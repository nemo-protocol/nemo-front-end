import { nemoApi } from "./request"
import { handleInfinityValues } from "@/lib/utils"
import { useWallet } from "@nemoprotocol/wallet-kit"
// import useFetchMultiMarketState from "@/hooks/fetch/useMultiMarketState"
// import useCalculatePoolMetrics from "@/hooks/actions/useCalculatePoolMetrics"
import { useQuery, UseQueryResult, useMutation } from "@tanstack/react-query"
import {
  PointItem,
  CoinConfig,
  BaseCoinInfo,
  TokenInfoMap,
  PortfolioItem,
  FixedReturnItem,
  CoinInfoWithMetrics,
  MarketState,
  TokenType,
  Granularity,
  ApyHistoryData
} from "./types/market"
import { AxiosError } from "axios"

interface CoinInfoListParams {
  name?: string
  address?: string
  isShowExpiry?: number
  isCalc?: boolean
}

function getCoinInfoList({
  name = "",
  address = "",
  isShowExpiry = 0,
}: CoinInfoListParams = {}) {
  // FIXME: optimize this
  return nemoApi<CoinInfoWithMetrics[]>("/api/v1/market/coinInfo").get({
    name,
    address,
    isShowExpiry,
  })
}

function getFixedReturnInfos() {
  return nemoApi<FixedReturnItem[]>("/api/v1/fixReturn/detail").get()
}

function getRewardList(address?: string) {
  const headers = new Headers()
  if (address) {
    headers.set("userAddress", address)
  }
  return nemoApi<PointItem[]>("/api/v1/points/page").get(
    {
      pageSize: 100,
    },
    headers,
  )
}

function getRewardWithAddress(address?: string) {
  const userAddress = address || "0x0"
  return nemoApi<PointItem[]>("/api/v1/points/page").get({
    userAddress,
  })
}

export function useQueryFixedReturnInfos() {
  return useQuery({
    queryKey: ["FixedReturnInfos"],
    queryFn: () => getFixedReturnInfos(),
  })
}


function getPortfolioList() {
  return nemoApi<PortfolioItem[]>("/api/v1/portfolio/detail").get()
}

async function getMintLpAmount(
  marketStateId: string,
  syCoinAmount: string,
  ptCoinAmount: string,
) {
  const { amount } = await nemoApi<{ amount: string }>(
    "/api/v1/market/lp/mintConfig",
  ).get({
    marketStateId,
    syCoinAmount,
    ptCoinAmount,
  })
  return amount
}

interface MintPYResult {
  syPtRate: number
  syYtRate: number
}

async function getMintPYRatio(marketStateId: string) {
  return await nemoApi<MintPYResult>("/api/v1/market/py/mintConfig").get({
    marketStateId,
  })
}

export function useQueryMintPYRatio(marketStateId?: string) {
  return useQuery({
    queryKey: ["mintPYRatio", marketStateId],
    queryFn: () => getMintPYRatio(marketStateId!),
    enabled: !!marketStateId,
  })
}

interface LPResult {
  ptLpRate: string
  syLpRate: string
  syPtRate: string
  splitRate: string
  conversionRate: string
}

export async function getLPRatio(
  marketStateId: string,
  address: string,
  mintType?: string,
) {
  const headers = new Headers()
  headers.set("userAddress", address)
  const response = await nemoApi<LPResult>("/api/v1/market/lp/mintConfig").get(
    {
      marketStateId,
      mintType,
    },
    headers,
  )
  return handleInfinityValues(response)
}

export function useQueryMintLpAmount(
  marketStateId: string,
  syCoinAmount: string,
  ptCoinAmount: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["coinInfoList", marketStateId, syCoinAmount, ptCoinAmount],
    queryFn: () => getMintLpAmount(marketStateId, syCoinAmount, ptCoinAmount),
    enabled,
  })
}

export function useQueryLPRatio(
  address?: string,
  marketStateId?: string,
  mintType?: string,
) {
  return useQuery({
    enabled: !!marketStateId,
    refetchInterval: 1000 * 20,
    // FIXME： queryKey dose not work
    queryKey: ["lpRatio", marketStateId, mintType],
    queryFn: () => getLPRatio(marketStateId!, address!, mintType),
  })
}

export function useCoinConfig(
  coinType?: string,
  maturity?: string,
  address?: string,
) {
  return useQuery({
    enabled: !!coinType && !!maturity,
    // FIXME： queryKey dose not work
    queryKey: ["coinConfig", coinType, maturity],
    queryFn: () => getCoinConfig(coinType!, maturity!, address),
  })
}
function getCoinConfig(coinType: string, maturity: string, address?: string) {
  const headers = new Headers()
  if (address) {
    headers.set("userAddress", address)
  }
  return nemoApi<CoinConfig>("/api/v1/market/config/detail")
    .get(
      {
        coinType,
        maturity,
      },
      headers,
    )
    .then(handleInfinityValues)
}

export interface GetApyHistoryParams {
  marketStateId: string;
  tokenType: TokenType;
  granularity: Granularity;
  startTime?: number;
  endTime?: number;
  signal?: AbortSignal;
  address?: string
}
export async function getApyHistory({
  marketStateId,
  tokenType,
  granularity,
  startTime,
  endTime,
  address,
}: GetApyHistoryParams): Promise<ApyHistoryData> {
  const headers = new Headers()
  if (address) {
    headers.set("userAddress", address)
  }
  return nemoApi<ApyHistoryData>("/api/v1/market/apyData/history")
    .get(
      {
        marketStateId, tokenType, granularity, startTime, endTime
      },
      headers,
    )
    .then(handleInfinityValues)

}

export function useApyHistory(
  params: {
    marketStateId: string;
    tokenType: TokenType;
    granularity: Granularity;
    seconds: number;
    autoFetch?: boolean;
    address?: string
  },
) {
  const {
    marketStateId, tokenType, granularity, seconds, autoFetch = true, address } = params;

  return useQuery({
    queryKey: ['apyHistory', marketStateId, tokenType, granularity],
    queryFn: () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - seconds;
      const endTime = now;
      return getApyHistory({
        marketStateId,
        tokenType,
        granularity,
        startTime,
        endTime,
        address,
      })
    }
    ,
    enabled:
      autoFetch &&
      !!marketStateId &&
      !!tokenType &&
      !!granularity, // basic guard

  }) as {
    data: ReturnType<typeof getApyHistory> extends Promise<infer R> ? R : never;
    error: AxiosError | Error | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
}

export function usePortfolioList() {
  return useQuery({
    // FIXME： queryKey dose not work
    queryKey: ["PortfolioConfig"],
    queryFn: () => getPortfolioList(),
    // select: (data) => data.filter((item) => !!item.ptTokenType),
  })
}

// export function useCoinInfoList<T extends boolean = true>(
//   params: CoinInfoListParams & { isCalc?: T } = {},
// ): UseQueryResult<
//   T extends true ? CoinInfoWithMetrics[] : BaseCoinInfo[],
//   Error
// > {
//   const {
//     name = "",
//     address = "",
//     isShowExpiry = 0,
//     isCalc = true as T,
//   } = params
//   const { mutateAsync: calculateMetrics } = useCalculatePoolMetrics()
//   const { mutateAsync: fetchMarketStates } = useFetchMultiMarketState()

//   return useQuery({
//     queryKey: ["coinInfoList", name, address, isShowExpiry],
//     queryFn: async () => {
//       const coinList = (await getCoinInfoList(params).catch(() => [])).filter(
//         // ({ marketStateId }) =>
//         //   marketStateId ===
//         //   "0xa72ae88db5febc37fabb1bf10b6f0eeca002b59b7252998abd0b359c5269eed0",
//         // ({ isTokenization }) => isTokenization,
//         // ({ ptTokenType }) => !!ptTokenType,
//         ({ marketStateId }) => !!marketStateId,
//       )

//       if (!coinList.length) return []

//       if (!isCalc) return coinList

//       const marketStateIds = coinList.map((coin) => coin.marketStateId)

//       const marketStates = await fetchMarketStates(marketStateIds).catch(
//         () => ({}) as { [key: string]: MarketState },
//       )

//       const results = await Promise.all(
//         coinList.map(async (coinInfo) => {
//           const marketState = marketStates?.[coinInfo.marketStateId]

//           try {
//             let flag = false
//             if (
//               coinInfo.ptApy === "" ||
//               coinInfo.ytApy === "" ||
//               coinInfo.scaledUnderlyingApy === "" ||
//               coinInfo.scaledPtApy === "" ||
//               coinInfo.incentiveApy === "" ||
//               coinInfo.tvl === "" ||
//               coinInfo.ptTvl === "" ||
//               coinInfo.syTvl === "" ||
//               coinInfo.ptPrice === "" ||
//               coinInfo.ytPrice === "" ||
//               coinInfo.poolApy === "" ||
//               coinInfo.swapFeeApy === "" ||
//               coinInfo.lpPrice === ""
//             ) {
//               flag = true
//             }
//             const metrics = flag
//               ? await calculateMetrics({
//                   coinInfo,
//                   marketState,
//                 })
//               : {}

//             return {
//               ...coinInfo,
//               ...metrics,
//             }
//           } catch (error) {
//             console.log("error", error)
//             return {
//               ...coinInfo,
//               ptPrice: "",
//               ytPrice: "",
//               ptApy: "",
//               ytApy: "",
//               tvl: "",
//               poolApy: "",
//               ptTvl: "",
//               syTvl: "",
//               marketState,
//             }
//           }
//         }),
//       )

//       return results
//     },
//     staleTime: 10000,
//     gcTime: 30000,
//     retry: 2,
//   })
// }

export function useRewardList() {
  const { address } = useWallet()
  return useQuery({
    queryKey: ["RewardConfig"],
    queryFn: () => getRewardList(address),
  })
}

export function useRewardWithAddress(userAddress?: string) {
  return useQuery({
    // FIXME： queryKey dose not work
    queryKey: ["RewardWithAddress"],
    queryFn: () => getRewardWithAddress(userAddress),
  })
}

export const getTokenInfo = async (): Promise<TokenInfoMap> => {
  const res = await nemoApi<TokenInfoMap>("/api/v1/market/info").get()

  // Filter out tokens with NaN prices
  const filteredTokens = Object.entries(res).reduce((acc, [key, token]) => {
    if (!isNaN(Number(token.price))) {
      acc[key] = token
    }
    return acc
  }, {} as TokenInfoMap)

  console.log("filteredTokens", filteredTokens)

  return filteredTokens
}

export const useTokenInfo = () => {
  return useMutation<TokenInfoMap, Error>({
    mutationFn: getTokenInfo,
  })
}
