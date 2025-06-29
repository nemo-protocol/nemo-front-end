import React from "react"
import Image from "next/image"
import dayjs from "dayjs"
import StripedBar from "@/app/market/components/StripedBar"
import { formatLargeNumber, formatTimeDiff, truncate } from "@/lib/utils"
import type { CoinInfoWithMetrics, Action, TokenType } from "@/queries/types/market"
import Decimal from "decimal.js"

interface MobileDataCardProps {
  data: CoinInfoWithMetrics[]
  onTokenClick: (
    id: string,
    coinType: string,
    action: Action,
    tokenType: Lowercase<TokenType>
  ) => void
  tooltipOpen: Record<string, boolean>
  onTooltipChange: (id: string, open: boolean) => void
}

export function MobileDataCard({
  data,
  onTokenClick,
  tooltipOpen,
  onTooltipChange,
}: MobileDataCardProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => {
        const maturity = parseInt(item.maturity)
        const now = Date.now()
        const count = 30
        const remainingDays = Math.max(
          0,
          Math.ceil((maturity - now) / (1000 * 60 * 60 * 24))
        )
        let activeCount = Math.round((remainingDays / 365) * count)
        if (activeCount > count) activeCount = count
        if (activeCount < 0) activeCount = 0
        if (remainingDays > 0 && activeCount < 1) activeCount = 1

        return (
          <div
            key={item.id}
            className="flex flex-col justify-between items-start flex-shrink-0 w-[345px] h-[350px] p-5 rounded-[10px]"
            style={{ background: "rgba(252, 252, 252, 0.03)" }}
          >
            {/* 头部 - 币种信息和到期时间 */}
            <div className="flex items-end justify-center gap-[10px]">
              <div className="flex items-center gap-3">
                <Image
                  width={36}
                  height={36}
                  src={item.coinLogo}
                  alt={item.coinName}
                  className="flex-shrink-0"
                />
              </div>
              <div className="flex-shrink-0">
                <div className="text-white text-[20px] font-[550] leading-[120%]">
                  {truncate(item.coinName, 7)}
                </div>
                <div className="text-[12px] text-light-gray/40 font-[650] leading-[100%] tracking-[0.12px] uppercase">
                  {dayjs(maturity).format("DD MMM YYYY").toLocaleLowerCase()}
                  ({`${formatTimeDiff(maturity).toLocaleLowerCase()}`})
                </div>
              </div>
              <span className="flex-1">
                <StripedBar
                  gap={2}
                  rounded
                  count={count}
                  barWidth={3}
                  activeCount={activeCount}
                  width={116}
                />
              </span>
            </div>

            <div className="flex flex-col justify-between items-start flex-shrink-0 self-stretch h-[250px]">
              <div className="flex items-center justify-between w-full">
                <span className="text-[#FCFCFC] text-sm font-[650] leading-[100%] tracking-[0.14px] uppercase">TVL</span>
                <span className="text-white text-sm font-[550] leading-[128%] tracking-[0.14px]">
                  ${formatLargeNumber(item.tvl, 2)}
                </span>
              </div>

              <div className="flex flex-col justify-between items-start flex-shrink-0 self-stretch h-[220px]">
                {/* Pool APY - LP */}
                <button
                  onClick={() =>
                    onTokenClick(item.id, item.coinType, "provide", "pool")
                  }
                  className="w-full flex flex-row justify-between items-center flex-shrink-0 self-stretch h-[64.98px] px-5 py-2.5 rounded-[10px] bg-[#956EFF]/10 hover:bg-[#956EFF]/20 transition-all duration-200"
                >
                  <div className="text-[#956EFF] font-[Inter] text-[16px] font-[7000] leading-[19px]">
                    LP
                  </div>
                  <div className="w-[231px] flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[128%] tracking-[0.14px]">Pool APY</div>
                      <div
                        className="flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-[#956EFF]/30 text-[#FCFCFC] font-[550] transition-all duration-200 shadow-lg justify-center cursor-pointer hover:bg-[#956EFF]/40"
                      >
                        <span className="text-white text-right font-['Season_Sans_TRIAL'] text-[14px] font-[550] leading-[100%] tracking-[0.14px] uppercase">
                          {formatLargeNumber(
                            new Decimal(item.poolApy).mul(100),
                            2
                          )}
                          %
                        </span>
                        {item.perPoints && (
                          <Image
                            src="/assets/images/mobile-star.svg"
                            alt="star"
                            width={18}
                            height={18}
                          />
                        )}
                        {item.incentives?.length > 0 && (
                          <Image
                            src="/assets/images/mobile-gift.svg"
                            alt="gift"
                            width={12}
                            height={12}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[120%]">Price</div>
                      <div className="text-[#FCFCFC] text-[14px] font-[550] leading-[128%] tracking-[0.14px] text-right">--</div>
                    </div>
                  </div>
                </button>

                {/* Yield APY - YT */}
                <button
                  onClick={() =>
                    onTokenClick(item.id, item.coinType, "trade", "yield")
                  }
                  className="w-full flex flex-row justify-between items-center flex-shrink-0 self-stretch h-[64.98px] px-5 py-2.5 rounded-[10px] bg-[#956EFF]/10 hover:bg-[#956EFF]/20 transition-all duration-200"
                >
                  <div className="text-[#1785B7] font-[Inter] text-[16px] font-[7000] leading-[19px]">
                    YT
                  </div>
                  <div className="w-[231px] flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[128%] tracking-[0.14px]">Yield APY</div>
                      <div
                        className="flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-[#1785B7]/30 text-[#FCFCFC] font-[550] transition-all duration-200 shadow-lg justify-center cursor-pointer hover:bg-[#1785B7]/40"
                      >
                        <span className="text-white text-right font-['Season_Sans_TRIAL'] text-[14px] font-[550] leading-[100%] tracking-[0.14px] uppercase">
                          {formatLargeNumber(new Decimal(item.ytApy).mul(100), 2)}%
                        </span>
                        <Image
                          src="/assets/images/mobile-star.svg"
                          alt="star"
                          width={18}
                          height={18}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[120%]">Price</div>
                      <div className="text-[#FCFCFC] text-[14px] font-[550] leading-[128%] tracking-[0.14px] text-right">
                        &lt;${formatLargeNumber(item.ytPrice, 2)}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Fixed APY - PT */}
                <button
                  onClick={() =>
                    onTokenClick(item.id, item.coinType, "trade", "fixed")
                  }
                  className="w-full flex flex-row justify-between items-center flex-shrink-0 self-stretch h-[64.98px] px-5 py-2.5 rounded-[10px] bg-[#956EFF]/10 hover:bg-[#956EFF]/20 transition-all duration-200"
                >
                  <div className="text-[#17B69B] font-[Inter] text-[16px] font-[7000] leading-[19px]">
                    PT
                  </div>
                  <div className="w-[231px] flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[128%] tracking-[0.14px]">Fixed APY</div>
                      <span className="text-white text-right font-['Season_Sans_TRIAL'] text-[14px] font-[550] leading-[100%] tracking-[0.14px] uppercase">
                        {formatLargeNumber(new Decimal(item.ptApy).mul(100), 2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-[rgba(252,252,252,0.50)] text-[14px] font-[550] leading-[120%]">Price</div>
                      <div className="text-[#FCFCFC] text-[14px] font-[550] leading-[128%] tracking-[0.14px] text-right">
                        ~${formatLargeNumber(item.ptPrice, 2)}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}
