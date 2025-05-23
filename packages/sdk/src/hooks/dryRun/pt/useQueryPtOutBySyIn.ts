import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "../../types"
import type { DebugInfo } from "../../types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { DEFAULT_Address } from "@/lib/constants"
import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient } from "@nemoprotocol/wallet-kit"
import { CoinConfig } from "@/types"
import { getPtOutForExactSyIn } from "@/lib/txHelper/pt"

type Result = {
  ptValue: string
  ptAmount: string
  syValue: string
  syAmount: string
  tradeFee: string
}

interface QueryPtOutBySyInParams {
  syAmount: string
  minPtAmount?: string
  innerCoinConfig?: CoinConfig
}

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

export default function useQueryPtOutBySyIn<T extends boolean = false>(
  { outerCoinConfig, debug }: { outerCoinConfig?: CoinConfig; debug?: T } = {
    debug: false as T,
  }
) {
  const client = useSuiClient()
  const address = DEFAULT_Address

  return useMutation({
    mutationFn: async ({
      syAmount,
      innerCoinConfig,
      minPtAmount = "0",
    }: QueryPtOutBySyInParams): Promise<DryRunResult<T>> => {
      const coinConfig = outerCoinConfig || innerCoinConfig
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const [priceVoucher, priceVoucherInfo] = getPriceVoucher(tx, coinConfig)

      const [, getPtOutForExactSyInMoveCallInfo] = getPtOutForExactSyIn({
        tx,
        coinConfig,
        syAmount,
        minPtAmount,
        priceVoucher,
        returnDebugInfo: true,
      })

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const debugInfo: DebugInfo = {
        moveCall: [priceVoucherInfo, getPtOutForExactSyInMoveCallInfo],
        rawResult: result,
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (!result?.results?.[1]?.returnValues?.[0]) {
        const message = "Failed to get PT amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const ptAmount = bcs.U64.parse(
        new Uint8Array(result.results[1].returnValues[0][0])
      )

      const ptValue = new Decimal(ptAmount.toString())
        .div(10 ** Number(coinConfig.decimal))
        .toFixed()

      const parsedSyAmount = bcs.U64.parse(
        new Uint8Array(result.results[1].returnValues[1][0])
      )

      const syValue = new Decimal(parsedSyAmount.toString())
        .div(10 ** Number(coinConfig.decimal))
        .toFixed()

      const fee = bcs.U128.parse(
        new Uint8Array(result.results[1].returnValues[2][0])
      )

      const tradeFee = new Decimal(fee)
        .div(2 ** 64)
        .div(10 ** Number(coinConfig.decimal))
        .toString()

      debugInfo.parsedOutput = `${ptValue} ${syValue} ${tradeFee}`

      return (
        debug
          ? [{ ptValue, ptAmount, syValue, syAmount, tradeFee }, debugInfo]
          : { ptValue, ptAmount, syValue, syAmount, tradeFee }
      ) as DryRunResult<T>
    },
  })
}
