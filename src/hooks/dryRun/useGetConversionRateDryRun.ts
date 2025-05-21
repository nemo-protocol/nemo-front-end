import Decimal from "decimal.js"
import { debugLog } from "@/config"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "../types"
import type { DebugInfo } from "../types"
import { DEFAULT_Address } from "@/lib/constants"
import { useMutation } from "@tanstack/react-query"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient } from "@nemoprotocol/wallet-kit"
import type { BaseCoinInfo } from "@/queries/types/market"
import { formatDecimalValue } from "@/lib/utils"

type DryRunResult<T extends boolean> = T extends true
  ? [string, DebugInfo]
  : string

export default function useGetConversionRateDryRun<T extends boolean = false>(
  debug: T = false as T,
) {
  const client = useSuiClient()

  const address = DEFAULT_Address

  return useMutation({
    mutationFn: async (
      coinConfig?: BaseCoinInfo & { underlyingProtocol?: string },
    ): Promise<DryRunResult<T>> => {
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const [priceVoucher, priceVoucherMoveCallInfo] = getPriceVoucher(
        tx,
        coinConfig,
        "useGetConversionRateDryRun",
      )

      const moveCallInfo = {
        target: `${coinConfig.oracleVoucherPackageId}::oracle_voucher::get_price`,
        arguments: [{ name: "price_voucher", value: "priceVoucher" }],
        typeArguments: [coinConfig.syCoinType],
      }

      tx.moveCall({
        target: moveCallInfo.target,
        arguments: [priceVoucher],
        typeArguments: moveCallInfo.typeArguments,
      })

      const debugInfo: DebugInfo = {
        moveCall: [priceVoucherMoveCallInfo, moveCallInfo],
        rawResult: {},
      }

      try {
        const result = await client.devInspectTransactionBlock({
          sender: address,
          transactionBlock: await tx.build({
            client: client,
            onlyTransactionKind: true,
          }),
        })

        debugInfo.rawResult = result

        if (result?.error) {
          debugLog("useGetConversionRateDryRun error", debugInfo)
          throw new ContractError(result.error, debugInfo)
        }

        if (!result?.results?.[result.results.length - 1]?.returnValues?.[0]) {
          const message = "Failed to get conversion rate"
          debugInfo.rawResult = {
            error: message,
          }
          debugLog("useGetConversionRateDryRun error", debugInfo)
          throw new ContractError(message, debugInfo)
        }

        const conversionRate = bcs.U128.parse(
          new Uint8Array(
            result.results[result.results.length - 1].returnValues[0][0],
          ),
        )

        const formattedConversionRate = new Decimal(conversionRate)
          .div(new Decimal(2).pow(64))
          .toFixed()

        if (
          (new Decimal(formattedConversionRate).lt(1) &&
            coinConfig?.provider !== "Cetus") &&
          coinConfig?.underlyingProtocol !== "Cetus"
        ) {
          throw new ContractError(
            `${coinConfig.coinType} conversion rate (${formatDecimalValue(
              formattedConversionRate,
              6,
            )}) cannot be less than 1`,
            debugInfo,
          )
        }

        debugInfo.parsedOutput = formattedConversionRate
        debugInfo.result = formattedConversionRate

        if (!debug) {
          debugLog("useGetConversionRateDryRun", debugInfo)
        }

        return (
          debug ? [formattedConversionRate, debugInfo] : formattedConversionRate
        ) as DryRunResult<T>
      } catch (error) {
        debugLog("useGetConversionRateDryRun error", debugInfo)
        throw new ContractError((error as Error).message, debugInfo)
      }
    },
  })
}
