import Decimal from "decimal.js"
import { debugLog } from "@/config"
import { bcs } from "@mysten/sui/bcs"
import { burnLp } from "@/lib/txHelper/lp"
import { ContractError } from "../../types"
import { getCoinValue } from "@/lib/txHelper/coin"
import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig } from "@/queries/types/market"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import {
  redeemSyCoin,
  mergeLpPositions,
  swapExactPtForSy,
} from "@/lib/txHelper"
import type {
  DebugInfo,
  LpPosition,
  PyPosition,
  MoveCallInfo,
} from "../../types"
import { initPyPosition } from "@/lib/txHelper/position"

type BurnLpResult = {
  syValue: string
  syAmount: string
  ptAmount: string
  ptValue: string
}

interface BurnLpParams {
  lpAmount: string
  ptAmount?: string
  minSyOut?: string
  isSwapPt?: boolean
  pyPositions: PyPosition[]
  marketPositions: LpPosition[]
}

type DryRunResult<T extends boolean> = T extends true
  ? [BurnLpResult, DebugInfo]
  : BurnLpResult

export default function useBurnLpForSyCoinDryRun<T extends boolean = false>(
  outerCoinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async (
      {
        lpAmount,
        pyPositions,
        ptAmount = "0",
        minSyOut = "0",
        marketPositions,
        isSwapPt = false,
      }: BurnLpParams,
      innerConfig?: CoinConfig
    ): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const coinConfig = innerConfig || outerCoinConfig
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      if (!marketPositions?.length) {
        throw new Error("No LP market position found")
      }

      const moveCallInfos: MoveCallInfo[] = []

      const tx = new Transaction()
      tx.setSender(address)

      const [{ pyPosition, created }, initPyPositionMoveCallInfo] =
        initPyPosition({
          tx,
          coinConfig,
          pyPositions,
          returnDebugInfo: true,
        })

      moveCallInfos.push(initPyPositionMoveCallInfo)

      const decimal = Number(coinConfig?.decimal)

      // Merge LP positions
      const mergedPosition = mergeLpPositions(
        tx,
        coinConfig,
        marketPositions,
        lpAmount
      )

      const [syCoin, burnLpMoveCallInfo] = burnLp({
        tx,
        lpAmount,
        coinConfig,
        pyPosition,
        returnDebugInfo: true,
        marketPosition: mergedPosition,
      })

      moveCallInfos.push(burnLpMoveCallInfo)

      // Handle PT swap if needed
      let finalSyCoin = syCoin
      if (isSwapPt) {
        const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
          tx,
          coinConfig
        )
        moveCallInfos.push(priceVoucherMoveCall)

        const [syCoinFromSwapPt, swapExactPtForSyMoveCall] = swapExactPtForSy(
          tx,
          coinConfig,
          ptAmount,
          pyPosition,
          priceVoucher,
          minSyOut,
          true
        )
        moveCallInfos.push(swapExactPtForSyMoveCall)

        finalSyCoin = tx.mergeCoins(syCoin, syCoinFromSwapPt)
        moveCallInfos.push({
          target: `0x2::coin::merge_coins`,
          typeArguments: [],
          arguments: [
            { name: "destinationCoin", value: syCoin },
            { name: "sourceCoins", value: syCoinFromSwapPt },
          ],
        })
      }

      // Common logic for both paths
      const [yieldToken, redeemSyCoinMoveCall] = redeemSyCoin(
        tx,
        coinConfig,
        finalSyCoin,
        true
      )
      moveCallInfos.push(redeemSyCoinMoveCall)

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

      debugLog("useBurnLpDryRun", debugInfo)

      if (result.error) {
        debugLog("useBurnLpDryRun error", debugInfo)
        throw new ContractError(result.error, debugInfo)
      }

      if (
        result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      ) {
        const message = "useBurnLpDryRun Failed to get output amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const syAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0]
        )
      )

      const syValue = new Decimal(syAmount).div(10 ** decimal).toFixed(decimal)

      ptAmount = result.events[0].parsedJson.pt_amount as string
      const ptValue = new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)

      debugInfo.parsedOutput = JSON.stringify({
        syValue,
        syAmount,
        ptAmount,
        ptValue,
      })

      const returnValue = {
        syValue,
        syAmount,
        ptAmount,
        ptValue,
      }

      return (debug ? [returnValue, debugInfo] : returnValue) as DryRunResult<T>
    },
  })
}
