import { Time } from "@/lib/constants"
import type { CoinConfig } from "@/types"
import { useQuery } from "@tanstack/react-query"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"

export function useQueryConversionRate(coinConfig?: CoinConfig) {
  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()

  return useQuery({
    queryKey: ["conversionRate", coinConfig?.marketStateId],
    queryFn: async () => {
      console.log("useQueryConversionRate queryFn coinConfig", coinConfig)
      if (!coinConfig) return undefined
      return getConversionRate(coinConfig)
    },
    enabled: !!coinConfig,
    refetchInterval: Time.CONVERSION_RATE_REFRESH_INTERVAL,
  })
}
