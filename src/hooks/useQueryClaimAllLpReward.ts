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
import { useSearchParams } from "next/navigation"

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
  /* ------------------------------------------------------------------ */
  /* 1. 计算最终要用的地址：mockAddress > 钱包地址                      */
  /* ------------------------------------------------------------------ */
  const { address } = useWallet();
  const searchParams = useSearchParams();           // app-router
  const mockAddressRaw = searchParams.get("mockAddress");
  // pages-router 写法：
  // const { query } = useRouter();
  // const mockAddressRaw = query.mockAddress as string | undefined;

  const effectiveAddress =
  process.env.NEXT_PUBLIC_DEBUG && mockAddressRaw
      ? mockAddressRaw
      : address;


  const client = useSuiClient();
  const { data: suiCoins } = useCoinData(
    effectiveAddress,
    "0x2::sui::SUI",
  );

  return useQuery({
    queryKey: ["claimLpReward", effectiveAddress],
    enabled:
      !!effectiveAddress && !!params.filteredLPLists?.length,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,

    /* ------------------------- 核心查询函数 ------------------------- */
    queryFn: async () => {
      if (!effectiveAddress) {
        throw new Error("Please connect wallet first");
      }
      if (!suiCoins) {
        throw new Error("No SUI coins found");
      }

      const tx = new Transaction();
      tx.setSender(effectiveAddress);

      /* 每个 LP 列表 → 每个 rewardMetric 生成 moveCall */
      params.filteredLPLists.forEach((item) => {
        const marketState = params.marketStates[item.marketStateId];
        const lpPositions =
          params.lpPositionsMap?.[item.id]?.lpPositions ?? [];

        marketState.rewardMetrics.forEach((rewardMetric) => {
          const moveTarget = `${item.nemoContractId}::market::claim_reward`;

          const [coin] = tx.moveCall({
            target: moveTarget,
            arguments: [
              tx.object(item.version),
              tx.object(item.marketStateId),
              tx.object(lpPositions[0].id.id),
              tx.object("0x6"), // clock
            ],
            typeArguments: [item.syCoinType, rewardMetric.tokenType],
          });

          /* 查询 coin 数值 */
          tx.moveCall({
            target: `0x2::coin::value`,
            arguments: [coin],
            typeArguments: [rewardMetric.tokenType],
          });
        });
      });

      /* devInspect（dry-run） */
      const result = await client.devInspectTransactionBlock({
        sender: effectiveAddress,
        transactionBlock: await tx.build({
          client,
          onlyTransactionKind: true,
        }),
      });
      /* ---------------- 解析返回值，生成奖励 Map ----------------- */
      const lpReward: Record<string, string> = {};
      let index = 1
      params.filteredLPLists.forEach((item) => {
        const rewardMetrics = params.marketStates[item.marketStateId].rewardMetrics;

        rewardMetrics.forEach((rewardMetric) => {
          // 每个 rewardMetric 会触发两次 moveCall（claim + value）
          // 取 value 的返回：索引 = (前面调用数)*2 + 1
          const flatIndex = index;
          index = index + 2

          const [[balanceBytes]] =
            result.results[flatIndex].returnValues;
          const rewardRaw = bcs.U64.parse(new Uint8Array(balanceBytes));

          const decimal = Number(rewardMetric.decimal);
          lpReward[item.id + rewardMetric.tokenName] = formatDecimalValue(
            new Decimal(rewardRaw).div(new Decimal(10).pow(decimal)),
            decimal,
          );
        });
      });

      return lpReward;
    },
  });
}
