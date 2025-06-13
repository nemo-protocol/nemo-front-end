import Decimal from "decimal.js"
import { CoinData } from "@/types"
import { useCallback } from "react"
import { burnSCoin } from "@/lib/txHelper/coin"
import useClaimLpReward from "./useClaimLpReward"
import { useMutation } from "@tanstack/react-query"
import { CoinConfig } from "@/queries/types/market"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { claimYtInterest } from "@/lib/txHelper/yt"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { initPyPosition } from "@/lib/txHelper/position"
import useBurnLpDryRun from "@/hooks/dryRun/useBurnLpDryRun"
import useBurnSCoinDryRun from "../dryRun/useBurnSCoinDryRun"
import useRedeemLpDryRun from "@/hooks/dryRun/useRedeemLpDryRun"
import {
  LpPosition,
  PyPosition,
  MarketState,
  MoveCallInfo,
} from "@/hooks/types"
import useClaimYtInterest from "@/hooks/dryRun/yt/useClaimYtInterest"
import {
  burnLp,
  redeemPy,
  redeemSyCoin,
  mergeLpPositions,
  swapExactPtForSy,
} from "@/lib/txHelper"
import useSwapExactPtForSyDryRun from "../dryRun/useSwapExactPtForSyDryRun"

interface RedeemLpParams {
  lpAmount: string
  slippage: string
  vaultId?: string
  ytBalance: string
  coinConfig: CoinConfig
  lpPositions: LpPosition[]
  pyPositions: PyPosition[]
  receivingType?: "underlying" | "sy"
  txParam?: Transaction | null
  ptCoins?: CoinData[]
  minValue?: string | number
  action: "swap" | "redeem"
  minSyOut?: string
}

export default function useRedeemLp(
  coinConfig?: CoinConfig,
  marketState?: MarketState
) {
  const { account, signAndExecuteTransaction } = useWallet()
  const address = account?.address

  const { mutateAsync: burnLpDryRun } = useBurnLpDryRun(coinConfig)

  const { mutateAsync: swapExactPtForSyDryRun } = useSwapExactPtForSyDryRun({
    coinConfig,
    debug: false,
  })
  const { mutateAsync: burnSCoinDryRun } = useBurnSCoinDryRun(coinConfig)
  const { mutateAsync: claimLpRewardMutation } = useClaimLpReward(coinConfig)
  const { mutateAsync: claimYtInterestMutation } =
    useClaimYtInterest(coinConfig)
  const { mutateAsync: redeemLpDryRun } = useRedeemLpDryRun(
    coinConfig,
    marketState
  )

  const redeemLp = useCallback(
    async ({
      action,
      vaultId,
      lpAmount,
      slippage,
      ytBalance,
      coinConfig,
      lpPositions,
      pyPositions,
      minValue = 0,
      minSyOut = "0",
      txParam = null,
      receivingType = "underlying",
    }: RedeemLpParams) => {
      console.log("useRedeemLp", action, receivingType)
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

      const [{ pyPosition, created }, initPyPositionMoveCall] = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
        returnDebugInfo: true,
      })

      moveCallInfos.push(initPyPositionMoveCall)

      const mergedPositionId = mergeLpPositions(
        tx,
        coinConfig,
        lpPositions,
        lpAmount
      )

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)
      const syCoinFromYt = claimYtInterest({
        tx,
        coinConfig,
        pyPosition,
        priceVoucher,
      })

      const yieldTokenFromYt = redeemSyCoin(tx, coinConfig, syCoinFromYt)

      const { coinValue: ytRewardValue } = await claimYtInterestMutation({
        ytBalance,
        pyPositions,
      })

      if (
        receivingType === "underlying" &&
        new Decimal(ytRewardValue).gt(minValue)
      ) {
        const underlyingCoin = await burnSCoin({
          tx,
          address,
          vaultId,
          slippage,
          coinConfig,
          amount: ytRewardValue,
          sCoin: yieldTokenFromYt,
        })
        tx.transferObjects([underlyingCoin], address)
      } else {
        tx.transferObjects([yieldTokenFromYt], address)
      }

      const [{ ptAmount }] = await burnLpDryRun({
        vaultId,
        lpAmount,
        slippage,
        receivingType,
      })

      const syCoinFromLp = burnLp(
        tx,
        coinConfig,
        lpAmount,
        pyPosition,
        mergedPositionId
      )

      const yieldTokenFromLp = redeemSyCoin(tx, coinConfig, syCoinFromLp)

      const { coinValue: syCoinValue, coinAmount: syCoinAmount } =
        await burnSCoinDryRun({
          lpAmount,
        })
      // Add conditional logic for receivingType
      if (
        receivingType === "underlying" &&
        new Decimal(syCoinValue).gt(minValue)
      ) {
        const underlyingCoin = await burnSCoin({
          tx,
          address,
          vaultId,
          slippage,
          coinConfig,
          sCoin: yieldTokenFromLp,
          amount: syCoinAmount,
        })
        tx.transferObjects([underlyingCoin], address)
      } else {
        tx.transferObjects([yieldTokenFromLp], address)
      }

      if (new Decimal(coinConfig?.maturity).lt(Date.now())) {
        const [priceVoucherForOPY] = getPriceVoucher(tx, coinConfig)

        const syCoinFromPT = redeemPy(
          tx,
          coinConfig,
          "0",
          ptAmount,
          priceVoucherForOPY,
          pyPosition
        )

        const yieldTokenFromPT = redeemSyCoin(tx, coinConfig, syCoinFromPT)

        const { coinValue: syCoinFromPTValue, coinAmount: syCoinFromPTAmount } =
          await redeemLpDryRun({
            lpAmount,
            slippage,
            vaultId,
            coinConfig,
            lpPositions,
            pyPositions,
            receivingType,
          })

        // FIXME：burn pt

        // Use coinValue from dry run instead of ytReward for the comparison
        if (
          new Decimal(syCoinFromPTValue).gt(minValue) &&
          receivingType === "underlying"
        ) {
          const underlyingCoin = await burnSCoin({
            tx,
            address,
            vaultId,
            slippage,
            coinConfig,
            sCoin: yieldTokenFromPT,
            amount: syCoinFromPTAmount,
          })
          tx.transferObjects([underlyingCoin], address)
        } else {
          tx.transferObjects([yieldTokenFromPT], address)
        }
      } else if (action === "swap") {
        console.log("swapExactPtForSy")

        const [syCoin, swapExactPtForSyMoveCall] = swapExactPtForSy(
          tx,
          coinConfig,
          ptAmount,
          pyPosition,
          priceVoucher,
          minSyOut,
          true
        )

        moveCallInfos.push(swapExactPtForSyMoveCall)
        console.log("receivingType", receivingType)
        const { syAmount } = await swapExactPtForSyDryRun(ptAmount)
        console.log("syAmount", syAmount)
        const swappedSyValue = new Decimal(syAmount)
          .mul(new Decimal(10).pow(coinConfig.decimal))
          .toFixed(0)
        console.log("swappedSyValue", swappedSyValue)
        if (
          receivingType === "underlying" &&
          new Decimal(swappedSyValue).gt(minValue)
        ) {
          const underlyingCoin = await burnSCoin({
            tx,
            address,
            vaultId,
            slippage,
            coinConfig,
            amount: syAmount,
            sCoin: syCoin,
          })
          tx.transferObjects([underlyingCoin], address)
        } else {
          tx.transferObjects([yieldTokenFromYt], address)
        }
      }

      if (created) {
        tx.transferObjects([pyPosition], address)
      }
      if (!txParam) {
        const { digest } = await signAndExecuteTransaction({
          transaction: tx,
        })
        return { digest }
      } else return { digest: null }
    },
    [
      address,
      marketState,
      burnLpDryRun,
      redeemLpDryRun,
      burnSCoinDryRun,
      claimLpRewardMutation,
      claimYtInterestMutation,
      signAndExecuteTransaction,
    ]
  )

  return useMutation({
    mutationFn: redeemLp,
  })
}
