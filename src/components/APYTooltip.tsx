import { Decimal } from "decimal.js"
import Image from "next/image"
import { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLargeNumber } from "@/lib/utils"

export interface APYTooltipConfig {
  perPoints?: number
  boost?: number
  scaledPtApy?: number
  scaledUnderlyingApy?: number
  swapFeeApy?: number
  feeApy?: number
  poolApy?: number
  incentives?: Array<{
    tokenLogo: string
    apy: number
  }>
  scaledTotalApy?: number
}

interface APYTooltipProps {
  config: APYTooltipConfig
  trigger: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function APYTooltip({
  config,
  trigger,
  open,
  onOpenChange,
}: APYTooltipProps) {
  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="p-3 border border-light-gray/10 rounded-xl w-[350px] bg-dark-gray"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-y-2.5">
          {/* Nemo Points 区块 */}
          {!!config.perPoints && (
            <div className="flex items-center justify-between border-b border-line-gray/10 pb-2.5">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-normal text-sm bg-gradient-to-r from-[#1784B7] to-white bg-clip-text text-transparent">
                    Nemo Points
                  </span>
                  <Image
                    src="/assets/images/star.svg"
                    alt=""
                    className="size-5"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-normal">
                  {formatLargeNumber(config.perPoints, 6)}
                </span>
                <span className="text-xs text-light-gray/40">
                  Per LP per day
                </span>
                {config.boost && new Decimal(config.boost).gt(1) && (
                  <span className="text-xs text-[#FFD600] font-bold">
                    {config.boost}x boost
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Incentive APY 区块 */}
          {config.incentives && config.incentives.length > 0 && (
            <div className="flex items-center justify-between border-b border-line-gray/10 pb-2.5">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-normal text-sm bg-gradient-to-r from-[#FFEA00] to-white bg-clip-text text-transparent">
                    Incentive APY
                  </span>
                  <Image
                    src="/assets/images/gift.svg"
                    alt=""
                    className="size-4"
                    width={16}
                    height={16}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-normal">
                  {formatLargeNumber(
                    config.incentives.reduce((acc, i) => acc + i.apy, 0),
                    6
                  )}
                  %
                </span>
                <div className="flex flex-col items-end gap-y-1">
                  {config.incentives?.map((incentive, index) => (
                    <div
                      key={index}
                      className="flex flex-row items-center gap-2 ml-6"
                    >
                      <Image
                        src={incentive.tokenLogo}
                        alt=""
                        className="size-3"
                        width={12}
                        height={12}
                      />
                      <span className="text-xs text-light-gray/40">
                        {incentive.apy
                          ? `${
                              incentive.tokenLogo
                                .split("/")
                                .pop()
                                ?.split(".")[0]
                            }`
                          : ""}
                      </span>
                      <span className="text-xs text-light-gray/40">{`${formatLargeNumber(
                        incentive.apy,
                        6
                      )}%`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scaled APY 区块 */}
          <div className="flex items-center justify-between border-b border-line-gray/10 pb-2.5">
            <div className="flex flex-row items-center justify-between">
              <span className="font-normal text-sm bg-gradient-to-r from-[#6FE3B1] to-white bg-clip-text text-transparent">
                Scaled APY
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-normal">
                {typeof config.scaledTotalApy === "number"
                  ? `${formatLargeNumber(config.scaledTotalApy, 6)}%`
                  : config.poolApy
                  ? `${formatLargeNumber(config.poolApy, 6)}%`
                  : "--"}
              </span>
              <div className="flex flex-col items-end gap-0.5 mt-1">
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">PT APY</span>
                  <span className="text-xs text-light-gray/40">
                    {config.scaledPtApy
                      ? `${formatLargeNumber(config.scaledPtApy, 6)}%`
                      : "--"}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">
                    Underlying APY
                  </span>
                  <span className="text-xs text-light-gray/40">
                    {config.scaledUnderlyingApy
                      ? `${formatLargeNumber(config.scaledUnderlyingApy, 6)}%`
                      : "--"}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">
                    Swap Fee APY
                  </span>
                  <span className="text-xs text-light-gray/40">
                    {config.swapFeeApy
                      ? `${formatLargeNumber(config.swapFeeApy, 6)}%`
                      : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total APY 区块 */}
          <div className="flex flex-row items-center justify-between pt-4 text-sm text-white">
            <span>Total APY</span>
            <span>
              {config.poolApy
                ? `${formatLargeNumber(config.poolApy, 6)}%`
                : "--"}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
