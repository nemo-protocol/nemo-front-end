import { useRef } from "react"
import Decimal from "decimal.js"
import { CoinConfig } from "@/queries/types/market"
import { useMutation } from "@tanstack/react-query"
import useQueryYtOutBySyInWithVoucher from "../useQueryYtOutBySyInWithVoucher"

export default function useTradeRatio(coinConfig?: CoinConfig) {
  const lastPowerRef = useRef(0)
  const { mutateAsync: queryYtOut } = useQueryYtOutBySyInWithVoucher(coinConfig)

  return useMutation({
    mutationFn: async (conversionRate: string) => {
      if (!coinConfig?.decimal) {
        throw new Error("Missing required configuration")
      }

      const decimal = 3

      const calculateRatio = async (
        power = lastPowerRef.current,
      ): Promise<string> => {
        if (power >= decimal) return ""

        const safeDecimal = Math.max(decimal - power, 0)
        try {
          const amount = new Decimal(10).pow(safeDecimal).toString()
          const { ytAmount } = await queryYtOut(amount)
          const ytRatio = new Decimal(ytAmount)
            .div(amount)
            .div(conversionRate)
            .toString()

          lastPowerRef.current = power
          return ytRatio
        } catch (error) {
          if (power < decimal) {
            return calculateRatio(power + 1)
          }
          throw error
        }
      }

      return calculateRatio()
    },
  })
}
