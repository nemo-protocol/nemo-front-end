import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/types"
import type { DebugInfo, PyPosition } from "../../types"
import { ContractError } from "../../types"
import { swapExactYtForSy, redeemSyCoin } from "@/lib/txHelper"
import { UNSUPPORTED_UNDERLYING_COINS } from "@/lib/constants"
import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { burnSCoin } from "@/lib/txHelper/coin"
import { initPyPosition } from "@/lib/txHelper/position"

interface SellYtParams {
  vaultId?: string
  slippage: string
  minSyOut: string
  ytAmount: string
  pyPositions?: PyPosition[]
  receivingType: "underlying" | "sy"
}

type Result = { outputValue: string; outputAmount: string; syAmount: string }

type DryRunResult<T extends boolean> = T extends true
  ? [Result, DebugInfo]
  : Result

export default function useSellYtDryRun<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async ({
      vaultId,
      slippage,
      minSyOut,
      ytAmount,
      receivingType,
      pyPositions: inputPyPositions,
    }: SellYtParams): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions: inputPyPositions,
      })

      const [priceVoucher, priceVoucherMoveCallInfo] = getPriceVoucher(
        tx,
        coinConfig
      )

      const [syCoin, swapMoveCallInfo] = swapExactYtForSy(
        tx,
        coinConfig,
        ytAmount,
        pyPosition,
        priceVoucher,
        minSyOut,
        true
      )

      const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

      if (coinConfig.provider === "Cetus" && receivingType === "underlying") {
        throw new Error(
          `Underlying protocol error, try to withdraw to ${coinConfig.coinName}.`
        )
      }

      if (
        receivingType === "underlying" &&
        !UNSUPPORTED_UNDERLYING_COINS.includes(coinConfig?.coinType)
      ) {
        const underlyingCoin = await burnSCoin({
          tx,
          // FIXME: cetus amount
          amount: "",
          address,
          vaultId,
          slippage,
          coinConfig,
          sCoin: yieldToken,
        })
        tx.moveCall({
          target: `0x2::coin::value`,
          arguments: [underlyingCoin],
          typeArguments: [coinConfig.underlyingCoinType],
        })
      } else {
        // tx.transferObjects([yieldToken], address)
        tx.moveCall({
          target: `0x2::coin::value`,
          arguments: [yieldToken],
          typeArguments: [coinConfig.coinType],
        })
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
        moveCall: [priceVoucherMoveCallInfo, swapMoveCallInfo],
        rawResult: result,
      }

      if (result?.error) {
        throw new ContractError(result.error, debugInfo)
      }

      if (
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[1] !==
        "u64"
      ) {
        const message = "Failed to get output amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const returnValue =
        result?.results?.[result.results.length - 1]?.returnValues?.[0]?.[0]
      if (!returnValue) {
        const message = "Failed to get sy amount"
        debugInfo.rawResult.error = message
        throw new ContractError(message, debugInfo)
      }

      const outputAmount = bcs.U64.parse(new Uint8Array(returnValue))

      const syAmount = (
        result.events[result.events.length - 1].parsedJson as {
          amount_out: string
        }
      ).amount_out

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
