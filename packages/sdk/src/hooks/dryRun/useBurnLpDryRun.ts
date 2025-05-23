import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/types"
import type { DebugInfo, MoveCallInfo, PyPosition } from "../types"
import { ContractError } from "../types"
import useFetchLpPosition from "../useFetchLpPosition"
import useFetchPyPosition from "../useFetchPyPosition"
import { mergeLpPositions, redeemSyCoin } from "@/lib/txHelper"
import { initPyPosition } from "@/lib/txHelper/position"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import {
  NEED_MIN_VALUE_LIST,
  UNSUPPORTED_UNDERLYING_COINS,
} from "@/lib/constants"
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
  receivingType?: "underlying" | "sy"
}

export default function useBurnLpDryRun(
  outerCoinConfig?: CoinConfig,
  debug: boolean = false
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { mutateAsync: fetchLpPositionAsync } =
    useFetchLpPosition(outerCoinConfig)
  const { mutateAsync: fetchPyPositionAsync } =
    useFetchPyPosition(outerCoinConfig)

  const { mutateAsync: burnSCoinDryRun } = useBurnSCoinDryRun(outerCoinConfig)

  return useMutation({
    mutationFn: async (
      { lpAmount, receivingType, slippage, vaultId }: BurnLpParams,
      innerConfig?: CoinConfig
    ): Promise<[BurnLpResult] | [BurnLpResult, DebugInfo]> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const coinConfig = innerConfig || outerCoinConfig
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const marketPositions = await fetchLpPositionAsync()
      const [pyPositions] = (await fetchPyPositionAsync()) as [PyPosition[]]

      if (!marketPositions?.length) {
        throw new Error("No LP market position found")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

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
        !UNSUPPORTED_UNDERLYING_COINS.includes(coinConfig?.coinType)
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

      if (result.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[1] !==
        "u64"
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

      const outputArray =
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[0]
      if (!outputArray) {
        const message = "useBurnLpDryRun Failed to get output amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(new Uint8Array(outputArray))

      const outputValue = new Decimal(outputAmount)
        .div(10 ** decimal)
        .toFixed(decimal)

      const syAmount = (result.events[0].parsedJson as { sy_amount: string })
        .sy_amount
      const syValue = new Decimal(syAmount).div(10 ** decimal).toFixed(decimal)

      const ptAmount = (result.events[0].parsedJson as { pt_amount: string })
        .pt_amount
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
