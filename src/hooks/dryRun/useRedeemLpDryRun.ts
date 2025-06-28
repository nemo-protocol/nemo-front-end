import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { CoinConfig } from "@/queries/types/market"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import {
  LpPosition,
  PyPosition,
  MarketState,
  MoveCallInfo,
  DebugInfo,
  ContractError,
} from "@/hooks/types"
import useBurnLpDryRun from "@/hooks/dryRun/useBurnLpDryRun"
import useClaimLpReward from "../actions/useClaimLpReward"
import {
  initPyPosition,
  mergeLpPositions,
  burnLp,
  redeemSyCoin,
  redeemPy,
} from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { getCoinValue } from "@/lib/txHelper/coin"
import { CoinData } from "@/types"
import { bcs } from "@mysten/sui/bcs"
import { debugLog } from "@/config"
import Decimal from "decimal.js"

type Result = { coinValue: string; coinAmount: string }

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

interface RedeemLpParams {
  lpAmount: string
  slippage: string
  vaultId?: string
  coinConfig: CoinConfig
  lpPositions: LpPosition[]
  pyPositions: PyPosition[]
  receivingType?: "underlying" | "sy"
  txParam?: Transaction | null
  ptCoins?: CoinData[]
}

export default function useRedeemLp<T extends boolean = false>(
  coinConfig?: CoinConfig,
  marketState?: MarketState,
  debug: T = false as T,
) {
  const client = useSuiClient()
  const { account } = useWallet()
  const address = account?.address

  const { mutateAsync: burnLpDryRun } = useBurnLpDryRun(coinConfig)
  const { mutateAsync: claimLpRewardMutation } = useClaimLpReward(coinConfig)

  // const { mutateAsync: redeemPtDryRun } = useRedeemPtDryRun(coinConfig)

  const redeemLp = useCallback(
    async ({
      vaultId,
      lpAmount,
      slippage,
      coinConfig,
      lpPositions,
      txParam = null,
      pyPositions = [],
      receivingType = "underlying",
    }: RedeemLpParams): Promise<DryRunResult<T>> => {
      if (
        !address ||
        !lpAmount ||
        !coinConfig?.coinType ||
        !lpPositions?.length
      ) {
        throw new Error("Invalid parameters for redeeming LP")
      }

      if (!marketState) {
        throw new Error("Market state is not available")
      }

      const moveCallInfos: MoveCallInfo[] = []

      // First check if we can swap PT
      const [{ ptAmount }] = await burnLpDryRun({
        vaultId,
        lpAmount,
        slippage,
        receivingType,
        pyPositions,
        marketPositions: lpPositions,
      })

      const tx = txParam ? txParam : new Transaction()

      // Claim all LP rewards first
      if (marketState?.rewardMetrics?.length) {
        for (const rewardMetric of marketState.rewardMetrics) {
          await claimLpRewardMutation({
            tx,
            coinConfig,
            lpPositions,
            rewardMetric,
          })
        }
      }

      let pyPosition
      let created = false
      if (!pyPositions?.length) {
        created = true
        pyPosition = initPyPosition(tx, coinConfig)
      } else {
        pyPosition = tx.object(pyPositions[0].id)
      }

      const mergedPositionId = mergeLpPositions(
        tx,
        coinConfig,
        lpPositions,
        lpAmount,
      )

      const syCoin = burnLp(
        tx,
        coinConfig,
        lpAmount,
        pyPosition,
        mergedPositionId,
      )

      tx.transferObjects([syCoin], address)

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const syCoinFromPT = redeemPy(
        tx,
        coinConfig,
        "0",
        ptAmount,
        priceVoucher,
        pyPosition,
      )

      const yieldTokenFromPT = redeemSyCoin(tx, coinConfig, syCoinFromPT)

      const [, getCoinValueMoveCallInfo] = getCoinValue(
        tx,
        yieldTokenFromPT,
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
        debugLog(`useRedeemLpDryRun error:`, debugInfo)
        throw new ContractError(result.error, debugInfo)
      }

      if (!debug) {
        debugLog(`useRedeemLpDryRun debug info:`, debugInfo)
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
    [address, marketState, burnLpDryRun, client, debug, claimLpRewardMutation],
  )

  return useMutation({
    mutationFn: redeemLp,
  })
}
