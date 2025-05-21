import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient } from "@nemoprotocol/wallet-kit"
import { ContractError } from "../types"
import type { BaseCoinInfo } from "@/queries/types/market"
import type { DebugInfo } from "../types"
import { bcs } from "@mysten/sui/bcs"
import { getPriceVoucher } from "@/lib/txHelper/price"

interface PtOutParams {
  syIn: string
  coinInfo: BaseCoinInfo
}

type QueryPtOutResult<T extends boolean> = T extends true
  ? [string, DebugInfo]
  : string

export default function useQueryPtOutDryRun<T extends boolean = false>(
  debug: T = false as T,
) {
  const client = useSuiClient()
  const address =
    "0x0000000000000000000000000000000000000000000000000000000000000001"

  return useMutation({
    mutationFn: async ({
      syIn,
      coinInfo,
    }: PtOutParams): Promise<QueryPtOutResult<T>> => {
      if (!coinInfo) {
        throw new Error("Please select a pool")
      }

      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(tx, coinInfo)

      const moveCallInfo = {
        target: `${coinInfo.nemoContractId}::router::get_pt_out_for_exact_sy_in_with_price_voucher`,
        arguments: [
          { name: "net_sy_in", value: syIn },
          { name: "min_pt_out", value: "0" },
          { name: "price_voucher", value: "priceVoucher" },
          { name: "py_state_id", value: coinInfo.pyStateId },
          {
            name: "market_factory_config_id",
            value: coinInfo.marketFactoryConfigId,
          },
          { name: "market_state_id", value: coinInfo.marketStateId },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinInfo.syCoinType],
      }

      tx.moveCall({
        target: moveCallInfo.target,
        arguments: [
          tx.pure.u64(syIn),
          tx.pure.u64("0"),
          priceVoucher,
          tx.object(coinInfo.pyStateId),
          tx.object(coinInfo.marketFactoryConfigId),
          tx.object(coinInfo.marketStateId),
          tx.object("0x6"),
        ],
        typeArguments: moveCallInfo.typeArguments,
      })

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const debugInfo: DebugInfo = {
        moveCall: [priceVoucherMoveCall, moveCallInfo],
        rawResult: {
          error: result?.error,
          results: result?.results,
        },
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (!result?.results?.[1]?.returnValues?.[0]) {
        const message = "Failed to get pt out"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }
      const ptOut = bcs.U64.parse(
        new Uint8Array(result.results[1].returnValues[0][0]),
      ).toString()

      debugInfo.parsedOutput = ptOut

      return (debug ? [ptOut, debugInfo] : ptOut) as QueryPtOutResult<T>
    },
  })
}
