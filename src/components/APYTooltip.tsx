import { Decimal } from "decimal.js"
import Image from "next/image"
import { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLargeNumber } from "@/lib/utils"
import { Incentive } from "@/queries/types/market"

export interface APYTooltipConfig {
  perPoints?: number
  boost?: number
  scaledPtApy?: number
  scaledUnderlyingApy?: number
  swapFeeApy?: number
  feeApy?: number
  poolApy?: number
  incentives?: Incentive[]
  incentiveApy?: number
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
              <div className="flex flex-col items-end gap-y-1">
                <span className="text-sm font-normal">
                  {formatLargeNumber(
                    new Decimal(
                      config.incentiveApy || 0
                    )
                      .mul(100)
                      .toFixed(6),
                    6
                  )}
                  %
                </span>
                <div className="flex flex-col items-end gap-y-1">
                  {config.incentives?.map((incentive, index) => (
                    <div
                      key={index}
                      className="flex flex-row items-center gap-x-1 ml-6"
                    >
                      <Image
                        src={incentive.tokenLogo}
                        alt=""
                        className="size-3"
                        width={12}
                        height={12}
                      />
                      <span className="text-xs text-light-gray/40">{`${formatLargeNumber(
                        new Decimal(incentive.apy).mul(100).toFixed(6),
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
                {`${formatLargeNumber(
                  new Decimal(config.scaledPtApy || 0)
                    .add(config.scaledUnderlyingApy || 0)
                    .add(config.swapFeeApy || 0)
                    .mul(100)
                    .toFixed(6),
                  6
                )}%`}
              </span>
              <div className="flex flex-col items-end gap-0.5 mt-1">
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">PT APY</span>
                  <span className="text-xs text-light-gray/40">
                    {config.scaledPtApy
                      ? `${formatLargeNumber(
                          new Decimal(config.scaledPtApy).mul(100).toFixed(6),
                          6
                        )}%`
                      : "--"}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">
                    Underlying APY
                  </span>
                  <span className="text-xs text-light-gray/40">
                    {config.scaledUnderlyingApy
                      ? `${formatLargeNumber(
                          new Decimal(config.scaledUnderlyingApy)
                            .mul(100)
                            .toFixed(6),
                          6
                        )}%`
                      : "--"}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-xs text-light-gray/40">
                    Swap Fee APY
                  </span>
                  <span className="text-xs text-light-gray/40">
                    {config.swapFeeApy
                      ? `${formatLargeNumber(
                          new Decimal(config.swapFeeApy).mul(100).toFixed(6),
                          6
                        )}%`
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
                ? `${formatLargeNumber(
                    new Decimal(config.poolApy).mul(100).toFixed(6),
                    6
                  )}%`
                : "--"}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
