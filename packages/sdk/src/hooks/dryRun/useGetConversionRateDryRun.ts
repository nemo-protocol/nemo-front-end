import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "../types"
import type { DebugInfo } from "../types"
import { DEFAULT_Address } from "@/lib/constants"
import { useMutation } from "@tanstack/react-query"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { Transaction } from "@mysten/sui/transactions"
import type { BaseCoinInfo } from "@/types"
import { formatDecimalValue } from "@/lib/utils"
import { defaultClient } from "@/config/sui"

type DryRunResult<T extends boolean> = T extends true
  ? [string, DebugInfo]
  : string

export default function useGetConversionRateDryRun<T extends boolean = false>(
  debug: T = false as T
) {
  const address = DEFAULT_Address

  return useMutation({
    mutationFn: async (
      coinConfig?: BaseCoinInfo & { underlyingProtocol?: string }
    ): Promise<DryRunResult<T>> => {
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const [priceVoucher, priceVoucherMoveCallInfo] = getPriceVoucher(
        tx,
        coinConfig
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

      console.log("useGetConversionRateDryRun tx", tx)

      try {
        const result = await defaultClient.devInspectTransactionBlock({
          sender: address,
          transactionBlock: await tx.build({
            client: defaultClient,
            onlyTransactionKind: true,
          }),
        })

        debugInfo.rawResult = result

        if (result?.error) {
          throw new ContractError(result.error, debugInfo)
        }

        if (!result?.results?.[result.results.length - 1]?.returnValues?.[0]) {
          const message = "Failed to get conversion rate"
          debugInfo.rawResult = {
            error: message,
          }
          throw new ContractError(message, debugInfo)
        }

        const returnValue =
          result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[0]
        if (!returnValue) {
          const message = "Failed to get conversion rate"
          debugInfo.rawResult = {
            error: message,
          }
          throw new ContractError(message, debugInfo)
        }

        const conversionRate = bcs.U128.parse(new Uint8Array(returnValue))

        const formattedConversionRate = new Decimal(conversionRate)
          .div(new Decimal(2).pow(64))
          .toFixed()

        if (
          new Decimal(formattedConversionRate).lt(1) &&
          coinConfig?.provider !== "Cetus" &&
          coinConfig?.underlyingProtocol !== "Cetus"
        ) {
          throw new ContractError(
            `${coinConfig.coinType} conversion rate (${formatDecimalValue(
              formattedConversionRate,
              6
            )}) cannot be less than 1`,
            debugInfo
          )
        }

        debugInfo.parsedOutput = formattedConversionRate
        debugInfo.result = formattedConversionRate

        return (
          debug ? [formattedConversionRate, debugInfo] : formattedConversionRate
        ) as DryRunResult<T>
      } catch (error) {
        throw new ContractError((error as Error).message, debugInfo)
      }
    },
  })
}
