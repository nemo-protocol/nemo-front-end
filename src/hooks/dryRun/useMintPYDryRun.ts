import Decimal from "decimal.js"
import type { CoinData } from "@/types"
import { ContractError } from "../types"
import type { PyPosition } from "../types"
import { useMutation } from "@tanstack/react-query"
import { mintMultiSCoin } from "@/lib/txHelper/coin"
import { NEED_MIN_VALUE_LIST } from "@/lib/constants"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import type { DebugInfo, MoveCallInfo } from "../types"
import { initPyPosition } from "@/lib/txHelper/position"
import type { CoinConfig } from "@/queries/types/market"
import { depositSyCoin, mintPY, splitCoinHelper } from "@/lib/txHelper"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"

type MintResult = {
  ptAmount: string
  ytAmount: string
}

type DryRunResult<T extends boolean> = T extends true
  ? [MintResult, DebugInfo]
  : MintResult

export default function useMintPYDryRun<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T
) {
  const client = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async ({
      vaultId,
      slippage,
      coinData,
      mintValue,
      tokenType,
      pyPositions,
    }: {
      slippage: string
      vaultId?: string
      mintValue: string
      tokenType: number
      coinData: CoinData[]
      pyPositions?: PyPosition[]
    }): Promise<DryRunResult<T>> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }
      if (!coinData?.length) {
        throw new Error("No available coins")
      }

      const moveCallInfos: MoveCallInfo[] = []

      const tx = new Transaction()
      tx.setSender(address)

      const { pyPosition, created } = initPyPosition({
        tx,
        coinConfig,
        pyPositions,
      })

      const limited =
        tokenType === 0
          ? NEED_MIN_VALUE_LIST.some(
              (item) =>
                item.provider === coinConfig.provider ||
                item.coinType === coinConfig.coinType
            )
          : false

      const amount = new Decimal(mintValue)
        .mul(new Decimal(10).pow(coinConfig.decimal))
        .toString()

      const [[splitCoin, sCoin], mintSCoinMoveCall] =
        tokenType === 0
          ? await mintMultiSCoin({
              tx,
              amount,
              limited,
              vaultId,
              address,
              slippage,
              coinData,
              coinConfig,
              debug: true,
              coinAmount: amount,
              splitAmounts: [amount],
            })
          : [
              splitCoinHelper(tx, coinData, [amount], coinConfig.coinType),
              [] as MoveCallInfo[],
            ]

      moveCallInfos.push(...mintSCoinMoveCall)

      if (sCoin) {
        tx.transferObjects([sCoin], address)
      }

      const syCoin = depositSyCoin(
        tx,
        coinConfig,
        splitCoin,
        coinConfig.coinType
      )

      const [priceVoucher] = getPriceVoucher(tx, coinConfig)

      const [, debugInfo] = mintPY(
        tx,
        coinConfig,
        syCoin,
        priceVoucher,
        pyPosition,
        true
      )

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

      const dryRunDebugInfo: DebugInfo = {
        moveCall: [debugInfo],
        rawResult: {
          error: result?.error,
          results: result?.results,
        },
      }

      if (result?.error) {
        throw new ContractError(result.error, dryRunDebugInfo)
      }

      if (!result?.events?.[result.events.length - 1]?.parsedJson) {
        const message = "Failed to get mint PY data"
        dryRunDebugInfo.rawResult = {
          error: message,
          results: result?.results,
        }
        throw new ContractError(message, dryRunDebugInfo)
      }

      const ptAmount = result.events[result.events.length - 1].parsedJson
        .amount_pt as string
      const ytAmount = result.events[result.events.length - 1].parsedJson
        .amount_yt as string

      dryRunDebugInfo.parsedOutput = JSON.stringify({ ptAmount, ytAmount })

      const returnValue = { ptAmount, ytAmount }

      return (
        debug ? [returnValue, dryRunDebugInfo] : returnValue
      ) as DryRunResult<T>
    },
  })
}
