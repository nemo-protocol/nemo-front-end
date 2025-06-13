import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"
import type { DebugInfo } from "../types"
import { ContractError } from "../types"
import type { PyPosition } from "../types"
import useFetchPyPosition from "../useFetchPyPosition"
import { redeemPy, redeemSyCoin } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { initPyPosition } from "@/lib/txHelper/position"
import Decimal from "decimal.js"

type RedeemResult = {
  syValue: string
  syAmount: string
}

type DryRunResult<T extends boolean> = T extends true
  ? [RedeemResult, DebugInfo]
  : RedeemResult

export default function useRedeemPYDryRun<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { mutateAsync: fetchPyPositionAsync } = useFetchPyPosition(coinConfig)

  return useMutation({
    mutationFn: async ({
      ptAmount,
      ytAmount,
      pyPositions: inputPyPositions,
    }: {
      ptAmount: string
      ytAmount: string
      pyPositions?: PyPosition[]
    }): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const [pyPositions] = !inputPyPositions
        ? ((await fetchPyPositionAsync()) as [PyPosition[]])
        : [inputPyPositions]

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const syCoin = redeemPy(
        tx,
        coinConfig,
        ytAmount,
        ptAmount,
        priceVoucher,
        pyPosition
      )

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      if (created) {
        tx.transferObjects([pyPosition], address)
      }

      tx.transferObjects([yieldToken], address)

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      console.log("redeem_py dry run result:", result)

      const moveCallInfo = {
        target: `${coinConfig.nemoContractId}::yield_factory::redeem_py`,
        arguments: [
          { name: "version", value: coinConfig.version },
          { name: "yt_amount", value: ytAmount },
          { name: "pt_amount", value: ptAmount },
          { name: "price_voucher", value: "priceVoucher" },
          {
            name: "py_position",
            value: created ? "pyPosition" : pyPositions[0].id,
          },
          { name: "py_state", value: coinConfig.pyStateId },
          {
            name: "yield_factory_config",
            value: coinConfig.yieldFactoryConfigId,
          },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinConfig.syCoinType],
      }

      const dryRunDebugInfo: DebugInfo = {
        moveCall: [moveCallInfo],
        rawResult: {
          error: result?.error,
          results: result?.results,
        },
      }

      if (result?.error) {
        throw new ContractError(result.error, dryRunDebugInfo)
      }

      if (!result?.events?.[2]?.parsedJson) {
        const message = "Failed to get redeem PY data"
        dryRunDebugInfo.rawResult = {
          error: message,
          results: result?.results,
        }
        throw new ContractError(message, dryRunDebugInfo)
      }

      const syAmount = result.events[2].parsedJson.amount_out as string

      const decimal = Number(coinConfig?.decimal) || 0

      const syValue = new Decimal(syAmount)
        .div(new Decimal(10).pow(decimal))
        .toString()

      dryRunDebugInfo.parsedOutput = syAmount

      const returnValue = { syAmount, syValue }

      return (
        debug ? [returnValue, dryRunDebugInfo] : returnValue
      ) as DryRunResult<T>
    },
  })
}
