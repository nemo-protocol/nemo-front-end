import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { formatDecimalValue, isValidAmount } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig, PortfolioItem } from "@/queries/types/market"
import { redeemSyCoin } from "@/lib/txHelper"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { ContractError, type DebugInfo, type PyPosition } from "../types"
import { getPriceVoucher } from "@/lib/txHelper/price"

interface ClaimYtRewardParams {
  filteredYTLists: PortfolioItem[]
  pyPositionsMap?: Record<string, {
    ptBalance: string;
    ytBalance: string;
    pyPositions: PyPosition[];
  }>
}

export default function useQueryClaimAllYtReward(
  params: ClaimYtRewardParams,
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useQuery({
    queryKey: ["claimYtReward", address],
    enabled: !!address && params.filteredYTLists.length != 0,
    refetchInterval: 60 * 1000, // 每分钟刷新一次
    refetchIntervalInBackground: true, // 即使页面在后台也继续刷新
    queryFn: async () => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }


      const tx = new Transaction()
      tx.setSender(address)
      params.filteredYTLists.map(item => {
        const balance = params.pyPositionsMap?.[item.id]?.ytBalance
        const pyPositions = params.pyPositionsMap?.[item.id]?.pyPositions
        const coinConfig = item

        let pyPosition
        let created = false
        if (!pyPositions?.length) {
          created = true
          const moveCall = {
            target: `${coinConfig?.nemoContractId}::py::init_py_position`,
            arguments: [coinConfig?.version, coinConfig?.pyStateId],
            typeArguments: [coinConfig?.syCoinType],
          }

          pyPosition = tx.moveCall({
            ...moveCall,
            arguments: moveCall.arguments.map((arg) => tx.object(arg)),
          })[0]
        } else {
          pyPosition = tx.object(pyPositions[0].id)
        }

        const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
          tx,
          coinConfig,
        )

        const redeemDueInterestMoveCall = {
          target: `${coinConfig?.nemoContractId}::yield_factory::redeem_due_interest`,
          arguments: [
            {
              name: "version",
              value: coinConfig.version,
            },
            {
              name: "py_position",
              value: pyPosition,
            },
            {
              name: "pyStateId",
              value: coinConfig?.pyStateId,
            },
            {
              name: "price_voucher",
              value: priceVoucher,
            },
            {
              name: "yield_factory_config",
              value: coinConfig?.yieldFactoryConfigId,
            },
            {
              name: "clock",
              value: "0x6",
            },
          ],
          typeArguments: [coinConfig?.syCoinType],
        }
        const [syCoin] = tx.moveCall({
          target: redeemDueInterestMoveCall.target,
          arguments: [
            tx.object(coinConfig.version),
            pyPosition,
            tx.object(coinConfig?.pyStateId),
            priceVoucher,
            tx.object(coinConfig?.yieldFactoryConfigId),
            tx.object("0x6"),
          ],
          typeArguments: redeemDueInterestMoveCall.typeArguments,
        })

        const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

        tx.moveCall({
          target: `0x2::coin::value`,
          arguments: [yieldToken],
          typeArguments: [coinConfig.coinType],
        })

        if (created) {
          tx.transferObjects([pyPosition], address)
        }
      })




      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const pyReward: Record<string, string> = {}
      // const pyReward:any = {}
      params.filteredYTLists.map((item, index) => {
        const decimal = Number(item.decimal)
        const syAmount = bcs.U64.parse(
          new Uint8Array(
            result.results[((index + 1) * 4) - 1].returnValues[0][0],
          ),
        )

        pyReward[item.id] = formatDecimalValue(
            new Decimal(syAmount).div(10 ** decimal).toString(),
            decimal,
          )


        // params.pyPositionsMap?.[item.id]?.pyPositions.Ytreward = 
      })

      // const debugInfo: DebugInfo = {
      //   moveCall: [priceVoucherMoveCall, redeemDueInterestMoveCall],
      //   rawResult: {
      //     error: result?.error,
      //     results: result?.results,
      //   },
      // }

      // if (
      //   result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      // ) {
      //   const message = "Failed to get output amount"
      //   debugInfo.rawResult.error = message
      //   throw new ContractError(message, debugInfo)
      // }


      return pyReward

      // return formatDecimalValue(
      //   new Decimal(syAmount).div(10 ** decimal).toString(),
      //   decimal,
      // )
    },
  })
}
