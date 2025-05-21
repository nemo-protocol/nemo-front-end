import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig } from "@/queries/types/market"
import { redeemSyCoin } from "@/lib/txHelper"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { ContractError, PyPosition, type DebugInfo } from "../../types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { bcs } from "@mysten/sui/bcs"
import { debugLog } from "@/config"
import Decimal from "decimal.js"
import { claimYtInterest } from "@/lib/txHelper/yt"
import { getCoinValue } from "@/lib/txHelper/coin"
import { initPyPosition } from "@/lib/txHelper/position"

type Result = { coinValue: string; coinAmount: string }

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

export default function useClaimYtInterest<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T,
) {
  const client = useSuiClient()
  const { account } = useWallet()
  const address = account?.address

  return useMutation({
    mutationFn: async ({
      ytBalance,
      pyPositions,
    }: {
      ytBalance: string
      pyPositions?: PyPosition[]
    }): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect your wallet")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }
      if (!ytBalance) {
        throw new Error("没有可领取的 YT 余额")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
        tx,
        coinConfig,
      )

      const [syCoin, redeemDueInterestMoveCall] = claimYtInterest({
        tx,
        coinConfig,
        pyPosition,
        priceVoucher,
        returnDebugInfo: true,
      })

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      const [, getCoinValueMoveCallInfo] = getCoinValue(
        tx,
        yieldToken,
        coinConfig.coinType,
        true,
      )

      if (created) {
        tx.transferObjects([pyPosition], address)
      }

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const debugInfo: DebugInfo = {
        moveCall: [
          priceVoucherMoveCall,
          redeemDueInterestMoveCall,
          getCoinValueMoveCallInfo,
        ],
        rawResult: result,
      }

      if (result?.error) {
        debugLog(`useClaimYtReward error:`, debugInfo)
        throw new ContractError(result.error, debugInfo)
      }

      if (!debug) {
        debugLog(`useClaimYtReward debug info:`, debugInfo)
      }

      if (
        result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      ) {
        const message = "Failed to get coin amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const coinAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0],
        ),
      )

      const decimal = Number(coinConfig.decimal)

      const coinValue = new Decimal(coinAmount)
        .div(10 ** decimal)
        .toFixed(decimal)

      debugInfo.parsedOutput = coinValue

      const resultObj = {
        coinValue,
        coinAmount,
      }

      return (debug ? [resultObj, debugInfo] : resultObj) as DryRunResult<T>
    },
  })
}
