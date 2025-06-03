import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { formatDecimalValue, isValidAmount } from "@/lib/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig, PortfolioItem } from "@/queries/types/market"
import { initPyPosition, redeemSyCoin } from "@/lib/txHelper"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { ContractError, LpPosition, type DebugInfo, type PyPosition } from "../types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import useCustomSignAndExecuteTransaction from "@/hooks/useCustomSignAndExecuteTransaction"
import { debugLog } from "@/config"
import { burnSCoin } from "@/lib/txHelper/coin"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST, UNSUPPORTED_UNDERLYING_COINS } from "@/lib/constants"
import useCoinData from "../query/useCoinData"
import useQueryConversionRate from "../query/useQueryConversionRate"
import { useAddLiquiditySingleSy } from "../actions/useAddLiquiditySingleSy"
import { MarketStateMap } from "../query/useMultiMarketState"
type DryRunResult<T extends boolean> = T extends true ? DebugInfo : void

interface ClaimYtRewardParams {
  filteredYTLists: PortfolioItem[]
  pyPositionsMap?: Record<string, {
    ptBalance: string;
    ytBalance: string;
    pyPositions: PyPosition[];
  }>
  addLiqudity: boolean
  filteredLPLists: PortfolioItem[]
  lpPositionsMap: Record<string, {
    lpBalance: string;
    lpPositions: LpPosition[];
  }>
  ytReward: Record<string, string>
  marketStates:MarketStateMap
}

export default function useClaimAllReward<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T,
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { mutateAsync: signAndExecuteTransaction } =
    useCustomSignAndExecuteTransaction()

  // async function claimLPCall(tx: Transaction) {
  //   if (
  //     suiCoins &&
  //     suiCoins.length &&
  //     coinConfig?.coinType &&
  //     address &&
  //     lpBalance &&
  //     lpPositions?.length &&
  //     marketState?.rewardMetrics
  //   ) {


  //     // if (conversionRate && coinData)
  //     //   await handleAddLiquiditySingleSy({
  //     //     tx,
  //     //     address,
  //     //     vaultId,
  //     //     slippage,
  //     //     coinType: coinConfig.coinPrice,
  //     //     coinData,
  //     //     addAmount: "100",
  //     //     tokenType: 0,
  //     //     pyPosition,
  //     //     coinConfig,
  //     //     minLpAmount: "0",
  //     //     conversionRate,
  //     //   })
  //   }
  // }


  async function claimAll(tx: Transaction, addLiqudity: boolean, params: ClaimYtRewardParams) {
    params.filteredYTLists.map(async (item: PortfolioItem) => {
      const coinConfig = item
      const pyPositions = params.pyPositionsMap?.[item.id]?.pyPositions
      const ytBalance = params.pyPositionsMap?.[item.id]?.ytBalance
      const ytReward = params.ytReward?.[item.id]

      const vaultId = coinConfig?.underlyingProtocol === "Cetus" ? CETUS_VAULT_ID_LIST.find((item) => item.coinType === coinConfig?.coinType,)?.vaultId
        : ""

      const minValue = NEED_MIN_VALUE_LIST.find(
        (item) =>
          item.provider === coinConfig.provider ||
          item.coinType === coinConfig.coinType,
      )?.minValue || 0

      // const { data: coinData } = useCoinData(
      //   address,
      //   coinConfig?.underlyingCoinType,
      // )
      // const { mutateAsync: handleAddLiquiditySingleSy } =
      // useAddLiquiditySingleSy(coinConfig)
      const decimal = Number(coinConfig?.decimal || 0)

      if (coinConfig?.coinType && address && ytBalance && ytReward) {
        // const tx = new Transaction()
        let pyPosition
        let created = false
        if (!pyPositions?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositions[0].id)
        }

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const redeemMoveCall = {
          target: `${coinConfig?.nemoContractId}::yield_factory::redeem_due_interest`,
          arguments: [
            address,
            "pyPosition",
            coinConfig?.pyStateId,
            "priceVoucher",
            coinConfig?.yieldFactoryConfigId,
            "0x6",
          ],
          typeArguments: [coinConfig?.syCoinType],
        }
        debugLog("redeem_due_interest move call:", redeemMoveCall)
        let minAddLpValue = new Decimal(0)

        minAddLpValue = new Decimal(ytReward).mul(
          Number(coinConfig?.underlyingPrice),
        )
        const [syCoin] = tx.moveCall({
          ...redeemMoveCall,
          arguments: [
            tx.object(coinConfig.version),
            pyPosition,
            tx.object(coinConfig?.pyStateId),
            priceVoucher,
            tx.object(coinConfig?.yieldFactoryConfigId),
            tx.object("0x6"),
          ],
        })
        if (!addLiqudity || minAddLpValue.lt(0.01)) {
          const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)
          if (
            new Decimal(ytReward).gt(minValue) &&
            !UNSUPPORTED_UNDERLYING_COINS.includes(coinConfig?.coinType)
          ) {
            const underlyingCoin = await burnSCoin({
              tx,
              // FIXME: cetus amount
              amount: "",
              coinConfig,
              sCoin: yieldToken,
              address,
              slippage: "0.5",
              vaultId,
            })
            tx.transferObjects([underlyingCoin], address)
          } else {
            tx.transferObjects([yieldToken], address)
          }
          if (created) {
            tx.transferObjects([pyPosition], address)
          }
        } else {
          const addAmount = new Decimal(Number(ytReward))
            .mul(10 ** decimal)
            .toFixed(0)

          // console.log(
          //   {
          //     tx,
          //     address,
          //     vaultId,
          //     slippage: "0.5",
          //     coinType: coinConfig.coinType,
          //     coinData,
          //     addAmount,
          //     tokenType: 0,
          //     pyPosition,
          //     coinConfig,
          //     minLpAmount: "0",
          //     conversionRate,
          //     syCoinParam: syCoin,
          //   },
          //   minAddLpValue.lt(0.01),
          //   "claimAllandAddLiqudity",
          // )
          // if (conversionRate && coinData) {
          //   await handleAddLiquiditySingleSy({
          //     tx,
          //     address,
          //     vaultId,
          //     slippage: "0.5",
          //     coinType: coinConfig.coinType,
          //     coinData,
          //     addAmount,
          //     tokenType: 0,
          //     pyPosition,
          //     coinConfig,
          //     minLpAmount: "0",
          //     conversionRate,
          //     syCoinParam: syCoin,
          //   })
          // }
        }
     

      }
    })
    params.filteredLPLists.map(item => {
      const coinConfig = item
      const marketState = params.marketStates[item.marketStateId]
      const lpPositions = params.lpPositionsMap?.[item.id]?.lpPositions
      marketState.rewardMetrics.map((rewardMetric) => {
        const claimRewardMoveCall = {
          target: `${coinConfig.nemoContractId}::market::claim_reward`,
          arguments: [
            { name: "version", value: coinConfig.version },
            { name: "market_state", value: coinConfig.marketStateId },
            { name: "lp_position", value: lpPositions[0].id.id },
            { name: "clock", value: "0x6" },
          ],
          typeArguments: [coinConfig.syCoinType, rewardMetric.tokenType],
        }

        const [coin] = tx.moveCall({
          target: claimRewardMoveCall.target,
          arguments: [
            tx.object(coinConfig.version),
            tx.object(coinConfig.marketStateId),
            tx.object(lpPositions[0].id.id),
            tx.object("0x6"),
          ],
          typeArguments: claimRewardMoveCall.typeArguments,
        })
        
        address && tx.transferObjects([coin], address)

      })
    })
  }

  return useMutation({
    mutationFn: async (params: ClaimYtRewardParams): Promise<DryRunResult<T>> => {
      let tx = new Transaction()
      await claimAll(tx, params.addLiqudity, params)
      if (params.addLiqudity) {
        const result = await client.devInspectTransactionBlock({
          sender: address,
          transactionBlock: await tx.build({
            client: client,
            onlyTransactionKind: true,
          }),
        })
        if (result?.error) {
          tx = new Transaction()
          await claimAll(tx, false, params)
        }
      }
      const { digest } = await signAndExecuteTransaction({
        transaction: tx,
      })

      const debugInfo: DebugInfo = {
        moveCall: [],
        rawResult: {},
      }
      return (debug ? debugInfo : undefined) as DryRunResult<T>
    }
  })


}
