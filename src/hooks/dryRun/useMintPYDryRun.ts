import { useMutation } from "@tanstack/react-query"
import { Transaction } from "@mysten/sui/transactions"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import type { CoinConfig } from "@/queries/types/market"
import type { DebugInfo, MoveCallInfo } from "../types"
import { ContractError } from "../types"
import Decimal from "decimal.js"
import type { CoinData } from "@/types"
import type { PyPosition } from "../types"
import useFetchPyPosition from "../useFetchPyPosition"
import { depositSyCoin, mintPY, splitCoinHelper } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { initPyPosition } from "@/lib/txHelper/position"
import { mintMultiSCoin } from "@/lib/txHelper/coin"
import { NEED_MIN_VALUE_LIST } from "@/lib/constants"

type MintResult = {
  ptAmount: string
  ytAmount: string
}

export default function useMintPYDryRun(
  coinConfig?: CoinConfig,
  debug: boolean = false
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { mutateAsync: fetchPyPositionAsync } = useFetchPyPosition(coinConfig)

  return useMutation({
    mutationFn: async ({
      tokenType,
      mintValue,
      coinData,
      slippage,
      vaultId,
      pyPositions: inputPyPositions,
    }: {
      slippage: string
      vaultId?: string
      mintValue: string
      tokenType: number
      coinData: CoinData[]
      pyPositions?: PyPosition[]
    }): Promise<[MintResult] | [MintResult, DebugInfo]> => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }
      if (!coinData?.length) {
        throw new Error("No available coins")
      }

      const [pyPositions] = !inputPyPositions
        ? ((await fetchPyPositionAsync()) as [PyPosition[]])
        : [inputPyPositions]

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

      console.log("mint_py dry run result:", result)

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

      if (!result?.events?.[1]?.parsedJson) {
        const message = "Failed to get mint PY data"
        dryRunDebugInfo.rawResult = {
          error: message,
          results: result?.results,
        }
        throw new ContractError(message, dryRunDebugInfo)
      }

      const ptAmount = result.events[1].parsedJson.amount_pt as string
      const ytAmount = result.events[1].parsedJson.amount_yt as string

      dryRunDebugInfo.parsedOutput = JSON.stringify({ ptAmount, ytAmount })

      const returnValue = { ptAmount, ytAmount }

      return debug ? [returnValue, dryRunDebugInfo] : [returnValue]
    },
  })
}
