import { MarketState } from "./types"
import { useQuery } from "@tanstack/react-query"
import { CoinConfig, CoinInfoWithMetrics } from "@/types"
import { usePoolMetrics, PoolMetricsResult } from "./actions/usePoolMetrics"
import { isValidAmount } from "@/lib/utils"

// function validateCoinInfo(coinInfo: CoinConfig) {
//   const requiredFields = [
//     "decimal",
//     "maturity",
//     "marketStateId",
//     "underlyingApy",
//     "underlyingPrice",
//     "coinPrice",
//     "swapFeeForLpHolder",
//   ] as const

//   for (const field of requiredFields) {
//     if (coinInfo[field] === undefined || coinInfo[field] === null) {
//       console.error(
//         `Missing required field: ${field}, coinName: ${coinInfo.coinName}, maturity: ${new Date(
//           Number(coinInfo.maturity),
//         ).toLocaleString()}`,
//       )
//       throw new Error(
//         `Missing required field: ${field}, coinName: ${coinInfo.coinName}, maturity: ${new Date(
//           Number(coinInfo.maturity),
//         ).toLocaleString()}`,
//       )
//     }
//   }
// }

// FIXME: optimize this
export function useCalculatePtYt(
  coinInfo?: CoinConfig | CoinInfoWithMetrics,
  marketState?: MarketState
) {
  const { mutateAsync: calculateMetrics } = usePoolMetrics()

  return useQuery<PoolMetricsResult>({
    queryKey: ["useCalculatePtYt", coinInfo?.marketStateId],
    queryFn: async () => {
      if (!coinInfo) {
        throw new Error("Please select a pool")
      }
      if (!marketState) {
        throw new Error("Failed get market state")
      }

      const coinInfoWithMetrics = coinInfo as CoinInfoWithMetrics

      // validateCoinInfo(coinInfo)
      // FIXME: optimize this
      if (
        !isValidAmount(coinInfoWithMetrics?.ptApy) ||
        !isValidAmount(coinInfoWithMetrics?.ytApy) ||
        !isValidAmount(coinInfoWithMetrics?.scaledUnderlyingApy) ||
        !isValidAmount(coinInfoWithMetrics?.scaledPtApy) ||
        !isValidAmount(coinInfoWithMetrics?.incentiveApy) ||
        !isValidAmount(coinInfoWithMetrics?.tvl) ||
        !isValidAmount(coinInfoWithMetrics?.ptTvl) ||
        !isValidAmount(coinInfoWithMetrics?.syTvl) ||
        !isValidAmount(coinInfoWithMetrics?.ptPrice) ||
        !isValidAmount(coinInfoWithMetrics?.ytPrice) ||
        !isValidAmount(coinInfoWithMetrics?.poolApy) ||
        !isValidAmount(coinInfoWithMetrics?.swapFeeApy) ||
        !isValidAmount(coinInfoWithMetrics?.lpPrice)
      ) {
        return calculateMetrics({
          coinInfo: coinInfo as unknown as CoinConfig,
          marketState,
        })
      }

      return {
        ptApy: coinInfoWithMetrics?.ptApy,
        ytApy: coinInfoWithMetrics?.ytApy,
        scaledUnderlyingApy: coinInfoWithMetrics?.scaledUnderlyingApy,
        scaledPtApy: coinInfoWithMetrics?.scaledPtApy,
        incentiveApy: coinInfoWithMetrics?.incentiveApy,
        tvl: coinInfoWithMetrics?.tvl,
        ptTvl: coinInfoWithMetrics?.ptTvl,
        syTvl: coinInfoWithMetrics?.syTvl,
        ptPrice: coinInfoWithMetrics?.ptPrice,
        ytPrice: coinInfoWithMetrics?.ytPrice,
        poolApy: coinInfoWithMetrics?.poolApy,
        swapFeeApy: coinInfoWithMetrics?.swapFeeApy,
        lpPrice: coinInfoWithMetrics?.lpPrice,
        marketState,
        incentives: coinInfoWithMetrics?.incentives,
      }
    },
    enabled: !!coinInfo?.decimal && !!marketState,
  })
}
