import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"
import type { DebugInfo, LpPosition, MoveCallInfo, PyPosition } from "../types"
import { ContractError } from "../types"
import { initPyPosition, mergeLpPositions, redeemSyCoin } from "@/lib/txHelper"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import {
  NEED_MIN_VALUE_LIST,
  NO_SUPPORT_UNDERLYING_COINS,
} from "@/lib/constants"
import { debugLog } from "@/config"
import { burnSCoin, getCoinValue } from "@/lib/txHelper/coin"
import { formatDecimalValue } from "@/lib/utils"
import useBurnSCoinDryRun from "./useBurnSCoinDryRun"

type BurnLpResult = {
  ptAmount: string
  syAmount: string
  ptValue: string
  syValue: string
  outputValue: string
  outputAmount: string
}

interface BurnLpParams {
  lpAmount: string
  slippage: string
  vaultId?: string
  pyPositions: PyPosition[]
  marketPositions: LpPosition[]
  receivingType?: "underlying" | "sy"
}

export default function useBurnLpDryRun(
  outerCoinConfig?: CoinConfig,
  debug: boolean = false
) {
  const client = useSuiClient()
  const { address } = useWallet()

  const { mutateAsync: burnSCoinDryRun } = useBurnSCoinDryRun(outerCoinConfig)

  return useMutation({
    mutationFn: async (
      {
        lpAmount,
        receivingType,
        slippage,
        vaultId,
        pyPositions,
        marketPositions,
      }: BurnLpParams,
      innerConfig?: CoinConfig
    ): Promise<[BurnLpResult] | [BurnLpResult, DebugInfo]> => {
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

      const tx = new Transaction()
      tx.setSender(address)

      // Handle py position creation
      let pyPosition
      if (!pyPositions?.length) {
        pyPosition = initPyPosition(tx, coinConfig)
      } else {
        pyPosition = tx.object(pyPositions[0].id)
      }

      const decimal = Number(coinConfig?.decimal)

      // Merge LP positions
      const mergedPosition = mergeLpPositions(
        tx,
        coinConfig,
        marketPositions,
        lpAmount
      )

      const moveCallInfos: MoveCallInfo[] = []

      const burnLpmoveCallInfo = {
        target: `${coinConfig.nemoContractId}::market::burn_lp`,
        arguments: [
          { name: "version", value: coinConfig.version },
          { name: "lp_amount", value: lpAmount },
          {
            name: "py_position",
            value: pyPosition,
          },
          { name: "market_state", value: coinConfig.marketStateId },
          { name: "market_position", value: marketPositions[0].id.id },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinConfig.syCoinType],
      }

      moveCallInfos.push(burnLpmoveCallInfo)

      const syCoin = tx.moveCall({
        target: burnLpmoveCallInfo.target,
        arguments: [
          tx.object(coinConfig.version),
          tx.pure.u64(lpAmount),
          pyPosition,
          tx.object(coinConfig.marketStateId),
          mergedPosition,
          tx.object("0x6"),
        ],
        typeArguments: burnLpmoveCallInfo.typeArguments,
      })

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      if (
        coinConfig.coinType ===
          "0xb1b0650a8862e30e3f604fd6c5838bc25464b8d3d827fbd58af7cb9685b832bf::wwal::WWAL" &&
        receivingType === "underlying"
      ) {
        throw new Error("Underlying protocol error, try to withdraw to wWAL.")
      }

      if (coinConfig.provider === "Cetus" && receivingType === "underlying") {
        throw new Error(
          `Underlying protocol error, try to withdraw to ${coinConfig.coinName}.`
        )
      }

      const minValue =
        NEED_MIN_VALUE_LIST.find(
          (item) =>
            item.provider === coinConfig.provider ||
            item.coinType === coinConfig?.coinType
        )?.minValue || 0

      // Use coin::value to get the output amount based on receivingType
      if (
        receivingType === "underlying" &&
        !NO_SUPPORT_UNDERLYING_COINS.some(
          (item) => item.coinType === coinConfig.underlyingCoinType
        )
      ) {
        const { coinValue, coinAmount: amount } = await burnSCoinDryRun({
          lpAmount,
        })

        if (new Decimal(coinValue).lt(minValue)) {
          const lpValue = new Decimal(lpAmount).div(Decimal.pow(10, decimal))

          throw new Error(
            `Please at least enter ${formatDecimalValue(
              new Decimal(lpValue).mul(minValue).div(coinValue),
              decimal
            )} LP ${coinConfig.coinName} or try to withdraw to ${
              coinConfig.coinName
            }
            .`
          )
        }

        const [underlyingCoin, burnMoveCallInfo] = await burnSCoin({
          tx,
          amount,
          address,
          vaultId,
          slippage,
          coinConfig,
          debug: true,
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

      if (!result?.events?.[0]?.parsedJson) {
        const message = "useBurnLpDryRun Failed to get pt amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(
        new Uint8Array(
          result.results[result.results.length - 1].returnValues[0][0]
        )
      )

      const outputValue = new Decimal(outputAmount)
        .div(10 ** decimal)
        .toFixed(decimal)

      const syAmount = result.events[0].parsedJson.sy_amount as string
      const syValue = new Decimal(syAmount).div(10 ** decimal).toFixed(decimal)

      const ptAmount = result.events[0].parsedJson.pt_amount as string
      const ptValue = new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)

      debugInfo.parsedOutput = JSON.stringify({
        syAmount,
        ptAmount,
        outputAmount,
        outputValue,
        syValue,
        ptValue,
      })

      const returnValue = {
        syAmount,
        ptAmount,
        outputAmount,
        outputValue,
        syValue,
        ptValue,
      }

      return debug ? [returnValue, debugInfo] : [returnValue]
    },
  })
}
