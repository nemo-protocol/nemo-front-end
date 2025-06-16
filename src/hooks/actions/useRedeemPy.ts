import Decimal from "decimal.js"
import { CoinData } from "@/types"
import { useCallback } from "react"
import { burnPt } from "@/lib/txHelper/pt"
import { burnSCoin } from "@/lib/txHelper/coin"
import { useMutation } from "@tanstack/react-query"
import { CoinConfig } from "@/queries/types/market"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { PyPosition, MarketState } from "@/hooks/types"
import { initPyPosition } from "@/lib/txHelper/position"
import useRedeemPtDryRun from "../dryRun/useRedeemPtDryRun"
import { NO_SUPPORT_UNDERLYING_COINS } from "@/lib/constants"
import { redeemPy, redeemSyCoin, splitCoinHelper } from "@/lib/txHelper"

interface RedeemLpParams {
  slippage: string
  vaultId?: string
  ptCoins: CoinData[]
  coinConfig: CoinConfig
  pyPositions: PyPosition[]
  minValue?: string | number
  txParam?: Transaction | null
  receivingType?: "underlying" | "sy"
}

export default function useRedeemPy(
  coinConfig?: CoinConfig,
  marketState?: MarketState,
) {
  const { signAndExecuteTransaction, address } = useWallet()

  const { mutateAsync: redeemPtDryRun } = useRedeemPtDryRun(coinConfig)

  const redeemLp = useCallback(
    async ({
      vaultId,
      ptCoins,
      slippage,
      coinConfig,
      pyPositions,
      minValue = 0,
      txParam = null,
      receivingType = "underlying",
    }: RedeemLpParams) => {
      if (!address || !coinConfig?.coinType || !pyPositions?.length) {
        throw new Error("Invalid parameters for redeeming LP")
      }

      if (!marketState) {
        throw new Error("Market state is not available")
      }

      const tx = txParam ? txParam : new Transaction()

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

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
        burnPt({
          tx,
          ptCoin,
          coinConfig,
          pyPosition,
        })
      }

      const ptPositionAmount = pyPositions.reduce(
        (total, pyPosition) => total.add(pyPosition.ptBalance),
        new Decimal(0),
      )

      const ptAllAmount = ptPositionAmount.add(ptTokenAmount).toFixed(0)

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const syCoin = redeemPy(
        tx,
        coinConfig,
        "0",
        ptAllAmount,
        priceVoucher,
        pyPosition,
      )

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      const { coinValue, coinAmount } = await redeemPtDryRun({
        ptCoins,
        pyPositions,
      })

      if (
        receivingType === "underlying" &&
        new Decimal(coinValue).gt(minValue) &&
        !NO_SUPPORT_UNDERLYING_COINS.some(
          (item) => item.coinType === coinConfig.coinType,
        )
      ) {
        const underlyingCoin = await burnSCoin({
          tx,
          address,
          vaultId,
          slippage,
          coinConfig,
          sCoin: yieldToken,
          amount: coinAmount,
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
    [address, marketState, redeemPtDryRun, signAndExecuteTransaction],
  )

  return useMutation({
    mutationFn: redeemLp,
  })
}
