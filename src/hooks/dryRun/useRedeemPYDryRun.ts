import Decimal from "decimal.js"
import { ContractError } from "@/hooks/types"
import type { DebugInfo, MoveCallInfo } from "@/hooks/types"
import type { PyPosition } from "@/hooks/types"
import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { redeemPy, redeemSyCoin } from "@/lib/txHelper"
import type { CoinConfig } from "@/queries/types/market"
import { initPyPosition } from "@/lib/txHelper/position"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { burnSCoin, getCoinValue } from "@/lib/txHelper/coin"
import { bcs } from "@mysten/sui/bcs"
import { NO_SUPPORT_UNDERLYING_COINS } from "@/lib/constants"

type RedeemResult = {
  outputAmount: string
  outputValue: string
}

type DryRunResult<T extends boolean> = T extends true
  ? [RedeemResult, DebugInfo]
  : RedeemResult

export default function useRedeemPYDryRun<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async ({
      ptAmount,
      ytAmount,
      pyPositions,
      receivingType,
    }: {
      ptAmount: string
      ytAmount: string
      pyPositions?: PyPosition[]
      receivingType: "underlying" | "sy"
    }): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      if (
        receivingType === "underlying" &&
        (coinConfig?.provider === "Cetus" ||
          NO_SUPPORT_UNDERLYING_COINS.some(
            (item) => item.coinType === coinConfig?.coinType
          ))
      ) {
        throw new Error(
          `Underlying protocol error, try to withdraw to ${coinConfig.coinName}.`
        )
      }

      const moveCallInfos: MoveCallInfo[] = []

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const [syCoin, redeemPyMoveCallInfo] = redeemPy(
        tx,
        coinConfig,
        ytAmount,
        ptAmount,
        priceVoucher,
        pyPosition,
        true
      )
      moveCallInfos.push(redeemPyMoveCallInfo)

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      if (receivingType === "underlying") {
        const [underlyingCoin, burnMoveCallInfo] = await burnSCoin({
          tx,
          address,
          coinConfig,
          debug: true,
          amount: "0",
          vaultId: "0",
          slippage: "0",
          sCoin: yieldToken,
        })
        moveCallInfos.push(...burnMoveCallInfo)

        const [, getCoinValueMoveCallInfo] = getCoinValue(
          tx,
          underlyingCoin,
          coinConfig.underlyingCoinType,
          true
        )
        moveCallInfos.push(getCoinValueMoveCallInfo)
      } else {
        const [, getCoinValueMoveCallInfo] = getCoinValue(
          tx,
          yieldToken,
          coinConfig.coinType,
          true
        )
        moveCallInfos.push(getCoinValueMoveCallInfo)
      }

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
        rawResult: {
          error: result?.error,
          results: result?.results,
        },
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (
        result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      ) {
        const message = "useBurnLpDryRun Failed to get output amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0]
        )
      )

      const decimal = Number(coinConfig?.decimal)

      const outputValue = new Decimal(outputAmount)
        .div(10 ** decimal)
        .toFixed(decimal)

      debugInfo.parsedOutput = outputValue

      const returnValue = { outputAmount, outputValue }

      return (debug ? [returnValue, debugInfo] : returnValue) as DryRunResult<T>
    },
  })
}
