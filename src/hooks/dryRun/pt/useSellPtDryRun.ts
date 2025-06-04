import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"
import type { DebugInfo, MoveCallInfo } from "../../types"
import { ContractError } from "../../types"
import type { PyPosition } from "../../types"
import { swapExactPtForSy, redeemSyCoin, splitCoinHelper } from "@/lib/txHelper"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { getPriceVoucher } from "@/lib/txHelper/price"
// import { burnSCoin } from "@/lib/txHelper/coin"
import { CoinData } from "@/types"
import { burnPt } from "@/lib/txHelper/pt"
import { initPyPosition } from "@/lib/txHelper/position"

interface SellPtParams {
  minSyOut: string
  ptAmount: string
  vaultId?: string
  slippage: string
  ptCoins?: CoinData[]
  pyPositions?: PyPosition[]
  receivingType: "underlying" | "sy"
}

type Result = { outputValue: string; outputAmount: string; syAmount: string }

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

export default function useSellPtDryRun<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async ({
      // vaultId,
      ptCoins,
      // slippage,
      minSyOut,
      ptAmount,
      receivingType,
      pyPositions: inputPyPositions,
    }: SellPtParams): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const moveCalls: MoveCallInfo[] = []

      const tx = new Transaction()
      tx.setSender(address)

      const [{ pyPosition, created }, pyPositionMoveCall] = initPyPosition({
        tx,
        coinConfig,
        pyPositions: inputPyPositions,
        returnDebugInfo: true,
      })

      moveCalls.push(pyPositionMoveCall)

      const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
        tx,
        coinConfig
      )

      moveCalls.push(priceVoucherMoveCall)

      if (coinConfig?.ptTokenType && ptCoins?.length) {
        const [ptCoin] = splitCoinHelper(
          tx,
          ptCoins,
          [ptAmount],
          coinConfig.ptTokenType
        )
        const [, burnPtMoveCall] = burnPt({
          tx,
          ptCoin,
          coinConfig,
          pyPosition,
          returnDebugInfo: true,
        })
        moveCalls.push(burnPtMoveCall)
      }

      const [syCoin, swapExactPtForSyMoveCall] = swapExactPtForSy(
        tx,
        coinConfig,
        ptAmount,
        pyPosition,
        priceVoucher,
        minSyOut,
        true
      )

      moveCalls.push(swapExactPtForSyMoveCall)

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      if (coinConfig.provider === "Cetus" && receivingType === "underlying") {
        throw new Error(
          `Underlying protocol error, try to withdraw to ${coinConfig.coinName}.`
        )
      }

      // FIXME: support burn scoin

      tx.moveCall({
        target: `0x2::coin::value`,
        arguments: [yieldToken],
        typeArguments: [coinConfig.coinType],
      })

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
        moveCall: moveCalls,
        rawResult: result,
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (
        result.results[result.results.length - 1].returnValues[0][1] !== "u64"
      ) {
        const message = "Failed to get output amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      if (!result.events[result.events.length - 1].parsedJson.amount_out) {
        const message = "Failed to get sy amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0]
        )
      )

      console.log("outputAmount", outputAmount)

      const syAmount =
        result.events[result.events.length - 1].parsedJson.amount_out

      console.log("syAmount", syAmount)

      const decimal = Number(coinConfig.decimal)

      const outputValue = new Decimal(outputAmount)
        .div(10 ** decimal)
        .toFixed(decimal)

      debugInfo.parsedOutput = outputValue

      const resultObj = { outputValue, outputAmount, syAmount }

      return (debug ? [resultObj, debugInfo] : resultObj) as DryRunResult<T>
    },
  })
}
