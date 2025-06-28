import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"
import type { DebugInfo, LpPosition, MoveCallInfo, PyPosition } from "../types"
import { ContractError } from "../types"
import {
  mergeLpPositions,
  redeemSyCoin,
  swapExactPtForSy,
} from "@/lib/txHelper"
import { burnLp } from "@/lib/txHelper/lp"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import {
  NEED_MIN_VALUE_LIST,
  NO_SUPPORT_UNDERLYING_COINS,
} from "@/lib/constants"
import { debugLog } from "@/config"
import { burnSCoin, getCoinValue } from "@/lib/txHelper/coin"
import { formatDecimalValue } from "@/lib/utils"
import { initPyPosition } from "@/lib/txHelper/position"
import useBurnLpForSyCoinDryRun from "./syCoinValue/useBurnLpForSyCoinDryRun"
import { getPriceVoucher } from "@/lib/txHelper/price"

type BurnLpResult = {
  ptAmount: string
  ptValue: string
  outputValue: string
  outputAmount: string
}

interface BurnLpParams {
  lpAmount: string
  slippage: string
  vaultId?: string
  isSwapPt?: boolean
  minSyOut?: string
  pyPositions: PyPosition[]
  marketPositions: LpPosition[]
  receivingType?: "underlying" | "sy"
}

export default function useBurnLpDryRun(
  coinConfig?: CoinConfig,
  debug: boolean = false
) {
  const client = useSuiClient()
  const { address } = useWallet()

  const { mutateAsync: burnLpForSyCoinDryRun } =
    useBurnLpForSyCoinDryRun(coinConfig)

  return useMutation({
    mutationFn: async ({
      vaultId,
      lpAmount,
      slippage,
      pyPositions,
      receivingType,
      minSyOut = "0",
      marketPositions,
      isSwapPt = false,
    }: BurnLpParams): Promise<[BurnLpResult] | [BurnLpResult, DebugInfo]> => {
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

      if (!marketPositions?.length) {
        throw new Error("No LP market position found")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
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

      const [syCoin, burnLpMoveCallInfo] = burnLp({
        tx,
        lpAmount,
        coinConfig,
        pyPosition,
        returnDebugInfo: true,
        marketPosition: mergedPosition,
      })

      moveCallInfos.push(burnLpMoveCallInfo)

      const {
        syValue: _syValue,
        syAmount: _syAmount,
        ptAmount: _ptAmount,
      } = await burnLpForSyCoinDryRun({
        lpAmount,
        pyPositions,
        marketPositions,
      })

      if (isSwapPt) {
        const [priceVoucher, priceVoucherMoveCall] = getPriceVoucher(
          tx,
          coinConfig
        )
        moveCallInfos.push(priceVoucherMoveCall)

        const [syCoinFromSwapPt, swapExactPtForSyMoveCall] = swapExactPtForSy(
          tx,
          coinConfig,
          _ptAmount,
          pyPosition,
          priceVoucher,
          minSyOut,
          true
        )
        moveCallInfos.push(swapExactPtForSyMoveCall)

        tx.mergeCoins(syCoin, [syCoinFromSwapPt])
        moveCallInfos.push({
          target: `0x2::coin::merge_coins`,
          typeArguments: [],
          arguments: [
            { name: "destinationCoin", value: syCoin },
            { name: "sourceCoins", value: syCoinFromSwapPt },
          ],
        })
      }

      const [yieldToken, redeemSyCoinMoveCall] = redeemSyCoin(
        tx,
        coinConfig,
        syCoin,
        true
      )
      moveCallInfos.push(redeemSyCoinMoveCall)

      const minValue =
        NEED_MIN_VALUE_LIST.find(
          (item) =>
            item.provider === coinConfig.provider ||
            item.coinType === coinConfig?.coinType
        )?.minValue || 0

      // Use coin::value to get the output amount based on receivingType
      if (receivingType === "underlying") {
        const { syValue: coinValue, syAmount: amount } = isSwapPt
          ? await burnLpForSyCoinDryRun({
              isSwapPt,
              lpAmount,
              pyPositions,
              marketPositions,
              ptAmount: _ptAmount,
            })
          : { syValue: _syValue, syAmount: _syAmount }

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

      const ptAmount = result.events[0].parsedJson.pt_amount as string
      const ptValue = new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)

      debugInfo.parsedOutput = JSON.stringify({
        ptValue,
        ptAmount,
        outputValue,
        outputAmount,
      })

      const returnValue = {
        ptValue,
        ptAmount,
        outputValue,
        outputAmount,
      }

      return debug ? [returnValue, debugInfo] : [returnValue]
    },
  })
}
