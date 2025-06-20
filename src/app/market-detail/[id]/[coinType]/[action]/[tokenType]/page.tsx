"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCoinConfig } from "@/queries"
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"
import dynamic from "next/dynamic"
import { Action, CoinConfig, TokenType } from "@/queries/types/market"
import AssetHeader from "./components/AssetHeader"
import { Tab, type TabItem } from "@/components/ui/tab"
import Decimal from "decimal.js"
import {
  formatDecimalValue,
  formatLargeNumber,
  formatTVL,
  formatTimeDiff,
  isValidAmountWithoutZero,
} from "@/lib/utils"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { APYTooltip } from "@/components/APYTooltip"
import Image from "next/image"
import PageLoader from "@/components/PageLoader"
import MintMarketDetail from "./mint"
import YTMarketDetail from "./yt/index"
import PTMarketDetail from "./pt/index"
import LPMarketDetail from "./lp/index"
import YieldChart from "./components/YieldChart"
const chartTypes = {
  yield: {
    "0": 456,
    "1": 456,
    tokenType: 'YIELD'
  },
  fixed: {
    "0": 488,
    "1": 488,
    tokenType: 'FIXED'
  },
  pool: {
    "0": 510,
    "1": 510,
    tokenType: 'POOL'
  },
  tvl: {
    "0": 488,
    "1": 488,
    tokenType: 'FIXED'
  },
}
export default function MarketDetailPage() {
  const params = useParams()
  const { id, tokenType, action } = params as {
    id: string
    action: Action
    tokenType: Lowercase<TokenType>
  }
  const [currentTab, setCurrentTab] = useState<"1" | "0">("0")

  const searchParams = useSearchParams()

  useEffect(() => {
    const urlMode = searchParams.get("mode")
    urlMode !== null && setCurrentTab(urlMode as "1" | "0")
  }, [searchParams])

  const { data: coinConfig, isLoading: isConfigLoading } = useCoinConfig(id)

  const [ptRatio, syRatio] = useMemo(() => {
    if (
      coinConfig?.ptTvl &&
      coinConfig?.syTvl &&
      !new Decimal(coinConfig.ptTvl).isZero() &&
      !new Decimal(coinConfig.syTvl).isZero()
    ) {
      const totalTvl = new Decimal(coinConfig.ptTvl).add(
        new Decimal(coinConfig.syTvl)
      )
      return [
        new Decimal(coinConfig.ptTvl).div(totalTvl).mul(100).toFixed(2),
        new Decimal(coinConfig.syTvl).div(totalTvl).mul(100).toFixed(2),
      ]
    }
    return ["0", "0"]
  }, [coinConfig])

  // 动态导入对应类型的组件
  const MarketDetailComponent =
    ({ coinConfig }: { coinConfig: CoinConfig }) => {
      if (action === "mint") {
        return <MintMarketDetail coinConfig={coinConfig} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      }
      switch (tokenType) {
        case "yield":
          return <YTMarketDetail coinConfig={coinConfig} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        case "fixed":
          return <PTMarketDetail coinConfig={coinConfig} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        case "pool":
          return <LPMarketDetail coinConfig={coinConfig} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        default:
          return <YTMarketDetail coinConfig={coinConfig} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      }
    }


  if (isConfigLoading) {
    return (
      <div className="text-white p-8">
        {" "}
        <PageLoader />
      </div>
    )
  }

  if (!coinConfig) {
    return <div className="text-white p-8">Market not found</div>
  }

  // 详情Tab切换组件
  function DetailTabs() {
    const router = useRouter()
    // mint tab由action控制，其他tab由tokenType控制
    let activeTab: string | undefined = undefined
    if (action === "mint") {
      activeTab = "mint"
    } else {
      switch (tokenType) {
        case "yield":
          activeTab = "yield"
          break
        case "fixed":
          activeTab = "principal"
          break
        case "pool":
          activeTab = "liquidity"
          break
        default:
          activeTab = undefined
      }
    }
    // tab点击跳转逻辑
    const handleTabChange = (
      action: Action,
      tokenType: Lowercase<TokenType>
    ) => {
      if (!coinConfig) return
      router.replace(
        `/market-detail/${coinConfig.id}/${coinConfig.coinType}/${action}/${tokenType}`,
        { scroll: false }
      );
    }
    const tabItems: TabItem[] = [
      {
        id: "yield",
        label: "Yield Token",
        active: activeTab === "yield",
        onChange: () => handleTabChange("trade", "yield"),
        content:
          "1 YT gives you exposure to the APY and points of 1 Sui until maturity.",
      },
      {
        id: "principal",
        label: "Principal Token",
        active: activeTab === "principal",
        onChange: () => handleTabChange("trade", "fixed"),
        content: "1 PT can be redeemed as 1 SUI at maturity.",
      },
      {
        id: "liquidity",
        label: "Provide Liquidity",
        active: activeTab === "liquidity",
        onChange: () => handleTabChange("provide", "pool"),
        content: (
          <div className="">
            <div className="mb-3 text-light-gray/40 text-sm">
              Liquidity providers (LPs) in Nemo have the following benefit:
            </div>
            <ol className="list-decimal pl-5">
              <li>
                <span className="font-bold">
                  Underlying Yield, the yield generated by underlying assets.
                </span>
              </li>
              <li>
                <span className="font-bold">The fixed yield from PT.</span>
              </li>
              <li>
                <span className="font-bold">Swap Fee.</span>
              </li>
              <li>
                <span className="font-bold">$NEMO and other Incentives.</span>
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: "mint",
        label: "Mint",
        active: activeTab === "mint",
        onChange: () => handleTabChange("mint", "fixed"),
        content:
          "Mint SY tokens into their corresponding underlying assets with Nemo SY Minter, vice versa.",
      },
    ]
    return <Tab items={tabItems} className="mb-0 mt-6 gap-12" />
  }

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100 px-7.5 py-0">
      {/* 返回按钮 */}
      <div
        onClick={() => history.back()}
        className="text-light-gray bg-gradient-to-r from-white/5 to-white/2 hover:bg-gradient-to-r hover:from-white/10 transition-all duration-200  hover:to-white/4 cursor-pointer inline-flex p-1 px-2.5 rounded-2xl gap-2 text-sm items-center"
      >
        <ArrowLeft width={16} />
        <span className="text-sm">Back</span>
      </div>

      <AssetHeader coinConfig={coinConfig} />

      {/* TOOD */}
      {/* 统计信息卡片区域 */}
      <div className="grid grid-cols-8 gap-8 mt-4 mb-0 border-b border-b-[rgba(252,252,252,0.10)] pb-6">
        {/* TVL */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">TVL</span>
          <span className="text-[20px] font-[500] text-white">
            ${formatLargeNumber(coinConfig.tvl)}
          </span>
          <span
            className={[
              "text-xs rounded-lg  font-[600] px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit",
              isValidAmountWithoutZero(coinConfig.tvlRateChange) &&
                new Decimal(coinConfig.tvlRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4cc877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span>
              {isValidAmountWithoutZero(coinConfig.tvlRateChange)
                ? new Decimal(coinConfig.tvlRateChange).mul(100).toFixed(2)
                : "--"}
              %
            </span>
            {isValidAmountWithoutZero(coinConfig.tvlRateChange) &&
              new Decimal(coinConfig.tvlRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>

        {/* 24H VOLUME */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">
            24H VOLUME
          </span>
          <span className="text-[20px] font-[500] text-white">
            {formatTVL(coinConfig.volume)}
          </span>
          <span
            className={[
              "text-xs font-[600] rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              isValidAmountWithoutZero(coinConfig.volumeRateChange) &&
                new Decimal(coinConfig.volumeRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span>
              {isValidAmountWithoutZero(coinConfig.volumeRateChange)
                ? new Decimal(coinConfig.volumeRateChange).mul(100).toFixed(2)
                : "--"}
              %
            </span>
            {isValidAmountWithoutZero(coinConfig.volumeRateChange) &&
              new Decimal(coinConfig.volumeRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* MATURITY */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">
            MATURITY
          </span>
          <span className="text-[20px] font-[500] text-white">
            {formatTimeDiff(Number(coinConfig.maturity))}
          </span>
          <span className="text-xs font-[600] rounded-lg px-3 py-1 mt-1 inline-block w-fit text-[#F80] bg-[#F80]/10">
            {dayjs(parseInt(coinConfig.maturity)).format("DD MMM YYYY")}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">
            {`Underlying Apy(7D)`.toLocaleUpperCase()}
          </span>
          <span className="text-[20px] font-[500] text-white">
            {formatLargeNumber(
              new Decimal(coinConfig.sevenAvgUnderlyingApy).mul(100).toFixed(2)
            )}
            %
          </span>
          <span
            className={[
              "text-xs font-[600] rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit",
              isValidAmountWithoutZero(
                coinConfig.sevenAvgUnderlyingApyRateChange
              ) && new Decimal(coinConfig.sevenAvgUnderlyingApyRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span
              className={[
                "text-xs",
                isValidAmountWithoutZero(
                  coinConfig.sevenAvgUnderlyingApyRateChange
                ) &&
                new Decimal(coinConfig.sevenAvgUnderlyingApyRateChange).gt(0)
                  ? "text-[#4CC877]"
                  : "text-[#FF2E54]",
              ].join(" ")}
            >
              {isValidAmountWithoutZero(
                coinConfig.sevenAvgUnderlyingApyRateChange
              )
                ? new Decimal(coinConfig.sevenAvgUnderlyingApyRateChange)
                    .mul(100)
                    .toFixed(2)
                : "--"}
              %
            </span>
            {isValidAmountWithoutZero(coinConfig.liquidityRateChange) &&
              new Decimal(coinConfig.liquidityRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* YIELD APY */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">
            YIELD APY
          </span>
          <span className="text-[20px] font-[500] text-white">
            {formatLargeNumber(
              new Decimal(coinConfig.yieldApy).mul(100).toFixed(2)
            )}
            %
          </span>
          <span
            className={[
              "text-xs rounded-lg font-[600] px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              isValidAmountWithoutZero(coinConfig.yieldApyRateChange) &&
                new Decimal(coinConfig.yieldApyRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span>
              {isValidAmountWithoutZero(coinConfig.yieldApyRateChange)
                ? new Decimal(coinConfig.yieldApyRateChange).mul(100).toFixed(2)
                : "--"}
              %
            </span>
            {isValidAmountWithoutZero(coinConfig.yieldApyRateChange) &&
              new Decimal(coinConfig.yieldApyRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* FIXED APY */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40">
            FIXED APY
          </span>
          <span className="text-[20px] font-[500] text-white">
            {formatLargeNumber(
              new Decimal(coinConfig.fixedApy).mul(100).toFixed(2)
            )}
            %
          </span>
          {isValidAmountWithoutZero(coinConfig.fixedApyRateChange) && (
            <span
              className={[
                "text-xs rounded-lg font-[600] px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",

                new Decimal(coinConfig.fixedApyRateChange).gt(0)
                  ? "text-[#4CC877] bg-[#4CC877]/10"
                  : "text-[#FF2E54] bg-[#FF2E54]/10",
              ].join(" ")}
            >
              <span>
                {`${new Decimal(coinConfig.fixedApyRateChange)
                  .mul(100)
                  .toFixed(2)} %`}
              </span>
              {new Decimal(coinConfig.fixedApyRateChange).gt(0) ? (
                <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
              )}
            </span>
          )}
        </div>
        {/* POOL APY */}
        <APYTooltip
          config={{
            poolApy: Number(coinConfig.poolApy),
            scaledPtApy: Number(coinConfig.scaledPtApy),
            scaledUnderlyingApy: Number(coinConfig.scaledUnderlyingApy),
            swapFeeApy: Number(coinConfig.swapFeeApy),
            feeApy: Number(coinConfig.feeApy),
            perPoints: coinConfig.perPoints
              ? Number(coinConfig.perPoints)
              : undefined,
            incentives: coinConfig.marketState?.rewardMetrics?.map(
              (metric) => ({
                tokenLogo: metric.tokenLogo,
                apy:
                  ((Number(metric.dailyEmission) *
                    Number(metric.tokenPrice) *
                    365) /
                    Number(coinConfig.tvl)) *
                  100,
              })
            ),
          }}
          trigger={
            <div className="flex flex-col cursor-pointer">
              <span className="text-xs font-[600] mb-4 text-[#FCFCFC]/40 flex items-center gap-x-2">
                <span>POOL APY</span>
                {coinConfig.marketState?.rewardMetrics?.length > 0 && (
                  <Image
                    src="/assets/images/gift.svg"
                    alt="gift"
                    className="w-3 h-3"
                    width={12}
                    height={12}
                  />
                )}
                {coinConfig.perPoints && (
                  <Image
                    src="/assets/images/star.svg"
                    alt="star"
                    className="w-4 h-4"
                    width={12}
                    height={12}
                  />
                )}
              </span>
              <span className="text-[20px] font-[500] text-white">
                {formatLargeNumber(
                  new Decimal(coinConfig.poolApy).mul(100).toFixed(2)
                )}
                %
              </span>
              {isValidAmountWithoutZero(coinConfig.poolApyRateChange) && (
                <span
                  className={[
                    "text-xs rounded-lg font-[600] px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
                    new Decimal(coinConfig.poolApyRateChange).gt(0)
                      ? "text-[#4CC877] bg-[#4CC877]/10"
                      : "text-[#FF2E54] bg-[#FF2E54]/10",
                  ].join(" ")}
                >
                  {new Decimal(coinConfig.poolApyRateChange).toFixed(2)}%
                  {new Decimal(coinConfig.poolApyRateChange).gt(0) ? (
                    <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
                  )}
                </span>
              )}
            </div>
          }
        />

        {/* POOL RATIO */}
        <div className="flex flex-col">
          <span className="text-xs font-[600] mb-5 text-[#FCFCFC]/40">
            POOL RATIO
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2 cursor-pointer">
                  <div className="flex justify-between items-end text-xs">
                    <span className="text-[20px] font-[500]">{ptRatio}%</span>
                    <span className="text-light-gray/40  font-[600]">
                      {syRatio}%
                    </span>
                  </div>
                  <Progress
                    value={Number(ptRatio)}
                    className="h-1 bg-light-gray/10"
                    indicatorClassName="bg-white"
                  />
                  <div className="flex justify-between text-xs text-light-gray/40 font-[600]">
                    <span>PT {coinConfig?.coinName}</span>
                    <span>{coinConfig?.coinName}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                className="bg-dark-gray border border-light-gray/10 rounded-lg p-2 sm:p-3 text-xs sm:text-sm relative mb-2"
                side="top"
                align="end"
                sideOffset={5}
              >
                <div className="text-white space-y-1">
                  <div className="flex justify-between items-center gap-x-2 sm:gap-x-4">
                    <span className="text-light-gray/40">
                      {coinConfig.marketState.totalPt && coinConfig.decimal
                        ? `${formatDecimalValue(
                          new Decimal(coinConfig.marketState.totalPt).div(
                            new Decimal(10).pow(coinConfig.decimal)
                          ),
                          2
                        )} `
                        : "--"}
                      PT {coinConfig?.coinName}:
                    </span>
                    <span>
                      {coinConfig.marketState?.totalPt && coinConfig.decimal
                        ? `$${formatDecimalValue(
                          new Decimal(coinConfig.marketState.totalPt).div(
                            new Decimal(10).pow(coinConfig.decimal)
                          ),
                          2
                        )} `
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-x-2 sm:gap-x-4">
                    <span className="text-light-gray/40">
                      {coinConfig.marketState.totalSy && coinConfig.decimal
                        ? `${formatDecimalValue(
                          new Decimal(coinConfig.marketState.totalSy).div(
                            new Decimal(10).pow(coinConfig.decimal)
                          ),
                          2
                        )} `
                        : "--"}
                      {coinConfig?.coinName}:
                    </span>
                    <span>
                      {coinConfig.marketState?.totalSy && coinConfig.decimal
                        ? `$${formatDecimalValue(
                          new Decimal(coinConfig.marketState.totalSy).div(
                            new Decimal(10).pow(coinConfig.decimal)
                          ),
                          2
                        )} `
                        : "--"}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <DetailTabs />

      <div className="flex flex-col gap-6">
        <div className="mt-6 grid lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
              <YieldChart coinConfig={coinConfig} h={chartTypes?.[tokenType]?.[currentTab]} tokenType={chartTypes?.[tokenType].tokenType as TokenType} />
            </div>
          </div>
          <MarketDetailComponent coinConfig={coinConfig} />
        </div>
      </div>

    </main>
  )
}
