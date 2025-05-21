import { debugLog } from "@/config"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "./types"
import type { DebugInfo } from "./types"
import { DEFAULT_Address } from "@/lib/constants"
import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { useSuiClient } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"

export default function useQueryPriceVoucher(
  coinConfig?: CoinConfig,
  debug: boolean = false,
  caller?: string,
) {
  const client = useSuiClient()
  const address = DEFAULT_Address

  return useMutation({
    mutationFn: async (): Promise<string | [string, DebugInfo]> => {
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const debugInfo: DebugInfo = {
        moveCall: [],
        rawResult: {},
      }

      try {
        const [, priceVoucherMoveCallInfo] = getPriceVoucher(
          tx,
          coinConfig,
          caller,
        )

        debugInfo.moveCall = [priceVoucherMoveCallInfo]

        const result = await client.devInspectTransactionBlock({
          sender: address,
          transactionBlock: await tx.build({
            client: client,
            onlyTransactionKind: true,
          }),
        })

        debugInfo.rawResult = result

        if (!debug) {
          debugLog(
            `[${caller}] useQueryPriceVoucher move call:`,
            debugInfo.moveCall,
          )
        }

        if (result?.error) {
          throw new ContractError(
            "useQueryPriceVoucher error: " + result.error,
            debugInfo,
          )
        }

        if (!result?.results?.[0]?.returnValues?.[0]) {
          const message = "Failed to get price voucher"
          debugInfo.rawResult.error = message
          throw new ContractError(message, debugInfo)
        }

        const outputVoucher = bcs.U128.parse(
          new Uint8Array(result.results[0].returnValues[0][0]),
        ).toString()

        debugInfo.parsedOutput = outputVoucher

        return debug ? [outputVoucher, debugInfo] : outputVoucher
      } catch (error) {
        debugLog("useQueryPriceVoucher error", error)
        throw new Error("Failed to get price voucher")
      }
    },
  })
}
