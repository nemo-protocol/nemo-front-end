import Decimal from "decimal.js"
import { bcs } from "@mysten/sui/bcs"
import { Transaction } from "@mysten/sui/transactions"
import type { CoinConfig, PortfolioItem } from "@/queries/types/market"
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit"
import { useQuery } from "@tanstack/react-query"
import { ContractError, LpPosition, MarketState, DebugInfo } from "./types"
import { formatDecimalValue, isValidAmount } from "@/lib/utils"
import { debugLog } from "@/config"
import { CoinData } from "@/types"
import { mergeAllCoins } from "@/lib/txHelper"
import useCoinData from "./query/useCoinData"
import { MarketStateMap } from "./query/useMultiMarketState"

interface ClaimLpRewardParams {
  filteredLPLists: PortfolioItem[]
  lpPositionsMap: Record<string, {
    lpBalance: string;
    lpPositions: LpPosition[];
  }>
  marketStates: MarketStateMap
}

type DryRunResult<T extends boolean> = T extends true
  ? [string, DebugInfo]
  : string

export default function useQueryClaimAllLpReward<T extends boolean = false>(
  params: ClaimLpRewardParams,
  debug: T = false as T,
) {
  const client = useSuiClient()
  const { address } = useWallet()
  const { data: suiCoins } = useCoinData(address, "0x2::sui::SUI")

  return useQuery({
    queryKey: [
      "claimLpReward",
      address,
    ],
    enabled:
      !!address &&
      !!params?.filteredLPLists?.length,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      if (!address) {
        throw new Error("Please connect wallet first")
      }

      if (!suiCoins) {
        throw new Error("No SUI coins found")
      }

      // const rewardMetric =
      //   params.marketState?.rewardMetrics?.[params.rewardIndex]
      // if (!rewardMetric?.tokenType) {
      //   throw new Error("No reward token type found")
      // }

      const tx = new Transaction()
      tx.setSender(address)
      params.filteredLPLists.map(item => {

        const marketState = params.marketStates[item.marketStateId]
        marketState.rewardMetrics.map((rewardMetric) => {

          const lpPositions = params.lpPositionsMap?.[item.id]?.lpPositions
          const coinConfig = item
          // mergeAllCoins(tx, address, suiCoins, coinConfig.coinType)

          const moveCallInfo = {
            target: `${coinConfig?.nemoContractId}::market::claim_reward`,
            arguments: [
              { name: "version", value: coinConfig.version },
              { name: "market_state", value: coinConfig.marketStateId },
              { name: "market_position", value: lpPositions[0].id.id },
              { name: "clock", value: "0x6" },
            ],
            typeArguments: [coinConfig.syCoinType, rewardMetric.tokenType],
          }

          const [coin] = tx.moveCall({
            target: moveCallInfo.target,
            arguments: [
              tx.object(coinConfig.version),
              tx.object(coinConfig.marketStateId),
              tx.object(lpPositions[0].id.id),
              tx.object("0x6"),
            ],
            typeArguments: [coinConfig.syCoinType, rewardMetric.tokenType],
          })

          tx.moveCall({
            target: `0x2::coin::value`,
            arguments: [coin],
            typeArguments: [rewardMetric.tokenType],
          })
        })
      })

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: await tx.build({
          client: client,
          onlyTransactionKind: true,
        }),
      })
      const lpReward: Record<string, string> = {}
      console.log(result,tx.blockData,'sixu3')
      params.filteredLPLists.map((item, index1) => {
        const marketState = params.marketStates[item.marketStateId]
        marketState.rewardMetrics.map((rewardMetric, index2) => {

          const [[balanceBytes]] = result.results[((index1 + 1) * (index2 + 1) * 2) - 1].returnValues
          const rewardAmount = bcs.U64.parse(new Uint8Array(balanceBytes))

          const decimal = Number(rewardMetric.decimal)
          const rewardValue = formatDecimalValue(
            new Decimal(rewardAmount).div(new Decimal(10).pow(decimal)),
            decimal,
          )
         
          lpReward[item.id + rewardMetric.tokenName] = rewardValue


        }
          // params.pyPositionsMap?.[item.id]?.pyPositions.Ytreward = 

        )
      })


      // const debugInfo: DebugInfo = {
      //   moveCall: [moveCallInfo],
      //   rawResult: result,
      // }

      // if (result?.error) {
      //   const message = result.error
      //   if (debugInfo.rawResult) {
      //     debugInfo.rawResult.error = message
      //   }
      //   debugLog("claim_reward error:", debugInfo)
      //   throw new ContractError(message, debugInfo)
      // }

      // if (!result?.results?.[result.results.length - 1]?.returnValues?.[0]) {
      //   const message = "Failed to get reward amount"
      //   if (debugInfo.rawResult) {
      //     debugInfo.rawResult.error = message
      //   }
      //   debugLog("claim_reward error:", debugInfo)
      //   throw new ContractError(message, debugInfo)
      // }


      // debugInfo.parsedOutput = rewardAmount

      // if (!debug) {
      //   debugLog("claim_reward debugInfo:", debugInfo)
      // }

      // const decimal = Number(rewardMetric.decimal)
      // const rewardValue = formatDecimalValue(
      //   new Decimal(rewardAmount).div(new Decimal(10).pow(decimal)),
      //   decimal,
      // )

      return lpReward
    },
  })
}
