import Decimal from "decimal.js"
import { CoinData } from "@/types"
import { burnSCoin } from "@/lib/txHelper/coin"
import useClaimLpReward from "./useClaimLpReward"
import { useMutation } from "@tanstack/react-query"
import { CoinConfig } from "@/queries/types/market"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { claimYtInterest } from "@/lib/txHelper/yt"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { initPyPosition } from "@/lib/txHelper/position"
import { NO_SUPPORT_UNDERLYING_COINS } from "@/lib/constants"
import useRedeemLpDryRun from "@/hooks/dryRun/useRedeemLpDryRun"
import useBurnLpForSyCoinDryRun from "../dryRun/syCoinValue/useBurnLpForSyCoinDryRun"
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

interface RedeemLpParams {
  lpAmount: string
  slippage: string
  vaultId?: string
  minSyOut?: string
  ytBalance: string
  ptCoins?: CoinData[]
  coinConfig: CoinConfig
  action: "swap" | "redeem"
  lpPositions: LpPosition[]
  pyPositions: PyPosition[]
  minValue?: string | number
  txParam?: Transaction | null
  isSwapPt?: boolean
  receivingType?: "underlying" | "sy"
}

export default function useRedeemLp(
  coinConfig?: CoinConfig,
  marketState?: MarketState
) {
  const { signAndExecuteTransaction, address } = useWallet()
  const { mutateAsync: claimLpRewardMutation } = useClaimLpReward(coinConfig)
  const { mutateAsync: claimYtInterestMutation } =
    useClaimYtInterest(coinConfig)
  const { mutateAsync: burnLpForSyCoinDryRun } =
    useBurnLpForSyCoinDryRun(coinConfig)
  const { mutateAsync: redeemLpDryRun } = useRedeemLpDryRun(
    coinConfig,
    marketState
  )

  return useMutation({
    mutationFn: async ({
      action,
      vaultId,
      lpAmount,
      slippage,
      ytBalance,
      coinConfig,
      lpPositions,
      pyPositions,
      minValue = 0,
      txParam = null,
      minSyOut = "0",
      receivingType = "underlying",
    }: RedeemLpParams) => {
      if (
        !address ||
        !lpAmount ||
        !coinConfig?.coinType ||
        !lpPositions?.length
      ) {
        throw new Error("Invalid parameters for redeeming LP")
      }

      if (
        receivingType === "underlying" &&
        NO_SUPPORT_UNDERLYING_COINS.some(
          (item) => item.coinType === coinConfig.coinType
        )
      ) {
        throw new Error("Underlying protocol error, try to withdraw to sy")
      }

      if (!marketState) {
        throw new Error("Market state is not available")
      }

      const moveCalls: MoveCallInfo[] = []

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

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const mergedPositionId = mergeLpPositions(
        tx,
        coinConfig,
        lpPositions,
        lpAmount
      )

      if (new Decimal(ytBalance).gt(0)) {
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

        // todo: merge coin
        if (
          receivingType === "underlying" &&
          new Decimal(ytRewardValue).gt(minValue) &&
          !NO_SUPPORT_UNDERLYING_COINS.some(
            (item) => item.coinType === coinConfig.coinType
          )
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
      }

      const syCoin = burnLp(
        tx,
        coinConfig,
        lpAmount,
        pyPosition,
        mergedPositionId
      )

      const { ptAmount, syAmount, syValue } = await burnLpForSyCoinDryRun({
        lpAmount,
        pyPositions,
        marketPositions: lpPositions,
      })

      let syCoinValue = syValue
      let syCoinAmount = syAmount

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
          receivingType === "underlying" &&
          new Decimal(syCoinFromPTValue).gt(minValue) &&
          !NO_SUPPORT_UNDERLYING_COINS.some(
            (item) => item.coinType === coinConfig.coinType
          )
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
        const [priceVoucherForSwapSy, priceVoucherForSwapSyMoveCall] =
          getPriceVoucher(tx, coinConfig, "useRedeemLp swapExactPtForSy", true)
        moveCalls.push(priceVoucherForSwapSyMoveCall)

        const [syCoinFromSwapPt, swapExactPtForSyMoveCall] = swapExactPtForSy(
          tx,
          coinConfig,
          ptAmount,
          pyPosition,
          priceVoucherForSwapSy,
          minSyOut,
          true
        )
        moveCalls.push(swapExactPtForSyMoveCall)

        tx.mergeCoins(syCoin, [syCoinFromSwapPt])

        const { syValue, syAmount } = await burnLpForSyCoinDryRun({
          lpAmount,
          ptAmount,
          pyPositions,
          isSwapPt: true,
          marketPositions: lpPositions,
        })

        syCoinValue = syValue
        syCoinAmount = syAmount
      }

      const [yieldToken, redeemSyCoinMoveCall] = redeemSyCoin(
        tx,
        coinConfig,
        syCoin,
        true
      )
      moveCalls.push(redeemSyCoinMoveCall)

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
          sCoin: yieldToken,
          amount: syCoinAmount,
        })
        tx.transferObjects([underlyingCoin], address)
      } else {
        tx.transferObjects([yieldToken], address)
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
  })
}
