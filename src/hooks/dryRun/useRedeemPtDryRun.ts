import Decimal from "decimal.js"
import { CoinData } from "@/types"
import { debugLog } from "@/config"
import { bcs } from "@mysten/sui/bcs"
import { ContractError } from "../types"
import { getCoinValue } from "@/lib/txHelper/coin"
import { useMutation } from "@tanstack/react-query"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { Transaction } from "@mysten/sui/transactions"
import { redeemPy, redeemSyCoin, splitCoinHelper } from "@/lib/txHelper"
import { initPyPosition } from "@/lib/txHelper/position"
import type { CoinConfig } from "@/queries/types/market"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { DebugInfo, MoveCallInfo, PyPosition } from "../types"
import { burnPt } from "@/lib/txHelper/pt"

type Result = { coinValue: string; coinAmount: string }

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

/**
 * Hook for dry-running the redeemPT functionality
 * This simulates the redemption of PT (Principal Token) to get underlying value
 */
export default function useRedeemPtDryRun<T extends boolean = false>(
  outerCoinConfig?: CoinConfig,
  debug: T = false as T,
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async (
      {
        ptCoins,
        pyPositions,
      }: { ptCoins: CoinData[]; pyPositions: PyPosition[] },
      innerConfig?: CoinConfig,
    ): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const coinConfig = innerConfig || outerCoinConfig
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const moveCallInfos: MoveCallInfo[] = []

      const tx = new Transaction()
      tx.setSender(address)

      const [{ pyPosition, created }, pyPositionMoveCall] = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
        returnDebugInfo: true,
      })
      moveCallInfos.push(pyPositionMoveCall)

      const ptTokenAmount = ptCoins?.reduce(
        (total, coin) => total.add(coin.balance),
        new Decimal(0),
      )

      if (coinConfig?.ptTokenType && ptCoins?.length) {
        const [ptCoin] = splitCoinHelper(
          tx,
          ptCoins,
          [new Decimal(ptTokenAmount).toFixed(0)],
          coinConfig.ptTokenType,
        )
        const [, burnPtMoveCall] = burnPt({
          tx,
          ptCoin,
          coinConfig,
          pyPosition,
          returnDebugInfo: true,
        })
        moveCallInfos.push(burnPtMoveCall)
      }

      const ptPositionAmount = pyPositions.reduce(
        (total, pyPosition) => total.add(pyPosition.ptBalance),
        new Decimal(0),
      )

      const ptAllAmount = ptPositionAmount.add(ptTokenAmount).toFixed(0)

      // Get price voucher
      const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
        tx,
        coinConfig,
        "default",
        true,
      )
      moveCallInfos.push(priceVoucherMoveCall)

      // YT amount is 0 as we're only redeeming PT
      const [syCoin, redeemPyMoveCall] = redeemPy(
        tx,
        coinConfig,
        "0", // ytAmount
        ptAllAmount, // ptAmount
        priceVoucher,
        pyPosition,
        true, // returnDebugInfo
      )

      moveCallInfos.push(redeemPyMoveCall)

      // Redeem the syCoin to get the yield token
      const [yieldToken, redeemSyCoinMoveCall] = redeemSyCoin(
        tx,
        coinConfig,
        syCoin,
        true,
      )
      moveCallInfos.push(redeemSyCoinMoveCall)

      // Get the value of the yield token
      const [, getCoinValueMoveCallInfo] = getCoinValue(
        tx,
        yieldToken,
        coinConfig.coinType,
        true,
      )
      moveCallInfos.push(getCoinValueMoveCallInfo)

      if (created) {
        tx.transferObjects([pyPosition], address)
      }

      // Execute the transaction in dry-run mode
      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })

      const debugInfo: DebugInfo = {
        moveCall: moveCallInfos,
        rawResult: result,
      }

      if (result?.error) {
        debugLog(`useRedeemPtDryRun error:`, debugInfo)
        throw new ContractError(result.error, debugInfo)
      }

      if (!debug) {
        debugLog(`useRedeemPtDryRun debug info:`, debugInfo)
      }

      // Parse the return value to get the coin amount
      if (
        result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      ) {
        const message = "Failed to get coin amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      // Parse the coin amount from the return value
      const coinAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0],
        ),
      )

      const decimal = Number(coinConfig.decimal)

      // Convert from raw units to decimal representation
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
