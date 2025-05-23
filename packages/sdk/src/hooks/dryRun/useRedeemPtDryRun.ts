import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/types"
import type { DebugInfo, MoveCallInfo, PyPosition } from "../types"
import { ContractError } from "../types"
import useFetchPyPosition from "../useFetchPyPosition"
import { redeemPy, redeemSyCoin } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { getCoinValue } from "@/lib/txHelper/coin"
import { initPyPosition } from "@/lib/txHelper/position"

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
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { mutateAsync: fetchPyPositionAsync } =
    useFetchPyPosition(outerCoinConfig)

  return useMutation({
    mutationFn: async (
      { ptAmount }: { ptAmount: string },
      innerConfig?: CoinConfig
    ): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const coinConfig = innerConfig || outerCoinConfig
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      // Get existing py positions or create a new one
      const [pyPositions] = (await fetchPyPositionAsync()) as [PyPosition[]]

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const moveCallInfos: MoveCallInfo[] = []

      // Get price voucher
      const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
        tx,
        coinConfig,
        true
      )
      moveCallInfos.push(priceVoucherMoveCall)

      // YT amount is 0 as we're only redeeming PT
      const [syCoin, redeemPyMoveCall] = redeemPy(
        tx,
        coinConfig,
        "0", // ytAmount
        ptAmount, // ptAmount
        priceVoucher,
        pyPosition,
        true // returnDebugInfo
      )

      moveCallInfos.push(redeemPyMoveCall)

      // Redeem the syCoin to get the yield token
      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      // Get the value of the yield token
      const [, getCoinValueMoveCallInfo] = getCoinValue(
        tx,
        yieldToken,
        coinConfig.coinType,
        true
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
        throw new ContractError(result.error, debugInfo)
      }

      // Parse the return value to get the coin amount
      if (
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[1] !==
        "u64"
      ) {
        const message = "Failed to get coin amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      // Parse the coin amount from the return value
      const returnValue =
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[0]
      if (!returnValue) {
        const message = "Failed to get coin amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }
      const coinAmount = bcs.U64.parse(new Uint8Array(returnValue))

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
