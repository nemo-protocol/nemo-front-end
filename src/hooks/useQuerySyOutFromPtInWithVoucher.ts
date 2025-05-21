import Decimal from "decimal.js"
import { debugLog } from "@/config"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "./types"
import type { DebugInfo } from "./types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig } from "@/queries/types/market"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"

type DryRunResult<T extends boolean> = T extends true
  ? [string, DebugInfo]
  : string

export default function useQuerySyOutFromPtInWithVoucher<
  T extends boolean = false,
>(coinConfig?: CoinConfig, debug: T = false as T) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async (ptAmount: string): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      // Get price voucher first
      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const moveCall = {
        target: `${coinConfig.nemoContractId}::router::get_sy_amount_out_for_exact_pt_in_with_price_voucher`,
        arguments: [
          { name: "exact_pt_in", value: ptAmount },
          { name: "price_voucher", value: "priceVoucher" },
          { name: "py_state", value: coinConfig.pyStateId },
          {
            name: "market_factory_config",
            value: coinConfig.marketFactoryConfigId,
          },
          { name: "market", value: coinConfig.marketStateId },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinConfig.syCoinType],
      }

      tx.moveCall({
        target: moveCall.target,
        arguments: [
          tx.pure.u64(ptAmount),
          priceVoucher,
          tx.object(coinConfig.pyStateId),
          tx.object(coinConfig.marketFactoryConfigId),
          tx.object(coinConfig.marketStateId),
          tx.object("0x6"),
        ],
        typeArguments: moveCall.typeArguments,
      })

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const debugInfo: DebugInfo = {
        moveCall: [moveCall],
        rawResult: result,
      }

      debugLog(
        "get_sy_amount_out_for_exact_pt_in_with_price_voucher move call:",
        debugInfo,
      )

      // Record raw result
      debugInfo.rawResult = {
        error: result?.error,
        results: result?.results,
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (!result?.results?.[1]?.returnValues?.[0]) {
        const message = "Failed to get SY amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(
        new Uint8Array(result.results[1].returnValues[0][0]),
      )

      const formattedAmount = new Decimal(outputAmount.toString())
        .div(10 ** Number(coinConfig.decimal))
        .toFixed()

      debugInfo.parsedOutput = formattedAmount

      return (
        debug ? [formattedAmount, debugInfo] : formattedAmount
      ) as DryRunResult<T>
    },
  })
}
