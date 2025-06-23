import Decimal from "decimal.js"
import { useQuery } from "@tanstack/react-query"
import type { CoinConfig } from "@/queries/types/market"
import useQuerySyOutByPtInDryRunWithVoucher from "./dryRun/sy/useQuerySyOutByPtIn"
import useQuerySyOutByYtInDryRunWithVoucher from "./dryRun/sy/useQuerySyOutByYtIn"

export default function useQuerySyRatio(
  coinConfig?: CoinConfig,
  inAmount?: string,
) {
  const { mutateAsync: querySyOutByPtIn } = useQuerySyOutByPtInDryRunWithVoucher({
    outerCoinInfo: coinConfig,
  })
  const { mutateAsync: querySyOutByYtIn } = useQuerySyOutByYtInDryRunWithVoucher({
    outerCoinConfig: coinConfig,
  })
  return useQuery({
    queryKey: ["ptPrice", coinConfig?.coinPrice, inAmount], // 1000
    queryFn: async () => {
      if (!coinConfig) {
        throw new Error("Please select a pool")
      }
      if (!inAmount) {
        throw new Error("Please provide syOut")
      }
      const { syAmount: syAmountByPt } = await querySyOutByPtIn({ ptIn: inAmount })
      const { syAmount: syAmountByYt } = await querySyOutByYtIn({ ytAmount: inAmount })
      console.log('initRatio: pt:', inAmount, "sy:",syAmountByPt,"ratio:",new Decimal(inAmount).div(syAmountByPt).toFixed(6).toString())
      console.log('initRatio: yt:', inAmount, "sy:",syAmountByYt,"ratio:",new Decimal(inAmount).div(syAmountByYt).toFixed(6).toString())

      return {
        initSyRatioBypt: new Decimal(inAmount).div(syAmountByPt),
        initSyRatioByYt: new Decimal(inAmount).div(syAmountByYt)
      }
    },

    enabled: !!coinConfig && !!inAmount,
  })
}
