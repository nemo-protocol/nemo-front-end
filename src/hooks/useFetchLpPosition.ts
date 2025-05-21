import { Decimal } from "decimal.js"
import { useSuiClient } from "@mysten/dapp-kit"
import { useMutation } from "@tanstack/react-query"
import type { DebugInfo, LpPosition } from "./types"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { type CoinConfig } from "@/queries/types/market"
import { type SuiObjectResponse } from "@mysten/sui/client"

type DryRunResult<T extends boolean> = T extends true
  ? [LpPosition[], DebugInfo]
  : LpPosition[]

export default function useFetchLpPosition<T extends boolean = false>(
  coinConfig?: CoinConfig,
  debug: T = false as T,
) {
  const suiClient = useSuiClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async (): Promise<DryRunResult<T>> => {
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }

      if (!address) {
        throw new Error("Please connect wallet first")
      }

      const response = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          MatchAny: coinConfig.marketPositionTypeList.map((type: string) => ({
            StructType: type,
          })),
        },
        options: {
          showContent: true,
        },
      })

      const debugInfo: DebugInfo = {
        moveCall: [
          {
            target: "query lp positions",
            arguments: [
              { name: "address", value: address },
              {
                name: "marketPositionTypeList",
                value: coinConfig.marketPositionTypeList.join(" "),
              },
              { name: "maturity", value: coinConfig.maturity },
              { name: "marketStateId", value: coinConfig.marketStateId },
            ],
            typeArguments: [],
          },
        ],
        rawResult: {
          results: response.data,
        },
      }

      const positions = response.data
        .map(
          (item: SuiObjectResponse) =>
            (
              item.data?.content as {
                fields?: {
                  name: string
                  expiry: string
                  id: { id: string }
                  lp_amount: string
                  description: string
                  market_state_id: string
                }
              }
            )?.fields,
        )
        .filter((item: unknown): item is LpPosition => {
          return (
            !!item &&
            typeof item === "object" &&
            "expiry" in item &&
            "market_state_id" in item
          )
        })
        .filter(
          (item: LpPosition) =>
            item.expiry === coinConfig.maturity &&
            item.market_state_id === coinConfig.marketStateId,
        )
        .sort((a: LpPosition, b: LpPosition) =>
          Decimal.sub(b.lp_amount, a.lp_amount).toNumber(),
        )
        .map((position: LpPosition) => ({
          ...position,
          lp_amount_display: new Decimal(position.lp_amount)
            .div(10 ** Number(coinConfig.decimal))
            .toString(),
        }))

      return (debug ? [positions, debugInfo] : positions) as DryRunResult<T>
    },
  })
}
