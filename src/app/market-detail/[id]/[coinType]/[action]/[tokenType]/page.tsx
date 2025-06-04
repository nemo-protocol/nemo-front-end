"use client"

import { useParams, useRouter } from "next/navigation"
import { useCoinConfig } from "@/queries"
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"
import dynamic from "next/dynamic"
import { Action, CoinConfig, TokenType } from "@/queries/types/market"
import AssetHeader from "./components/AssetHeader"
import { Tab, type TabItem } from "@/components/ui/tab"
import Decimal from "decimal.js"
import { formatLargeNumber } from "@/lib/utils"
import dayjs from "dayjs"
import { useMemo } from "react"

export default function MarketDetailPage() {
  const params = useParams()
  const { id, tokenType, action } = params as {
    id: string
    action: Action
    tokenType: Lowercase<TokenType>
  }

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
  const MarketDetailComponent = dynamic<{ coinConfig: CoinConfig }>(
    () => {
      if (action === "mint") {
        return import("./mint/index")
      }
      switch (tokenType) {
        case "yield":
          return import("./yt/index")
        case "fixed":
          return import("./pt/index")
        case "pool":
          return import("./lp/index")
        default:
          return Promise.resolve(() => null)
      }
    },
    {
      ssr: false,
      loading: () => <div className="text-white p-8">Loading component...</div>,
    }
  )

  if (isConfigLoading) {
    return <div className="text-white p-8">Loading...</div>
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

      router.push(
        `/market-detail/${coinConfig.id}/${coinConfig.coinType}/${action}/${tokenType}`
      )
    }
    const tabItems: TabItem[] = [
      {
        id: "yield",
        label: "Yield Token",
        active: activeTab === "yield",
        onChange: () => handleTabChange("trade", "yield"),
        desc: "Earn variable yield by holding this token.",
      },
      {
        id: "principal",
        label: "Principal Token",
        active: activeTab === "principal",
        onChange: () => handleTabChange("trade", "fixed"),
        desc: "Holds the principal value, redeemable at maturity.",
      },
      {
        id: "liquidity",
        label: "Provide Liquidity",
        active: activeTab === "liquidity",
        onChange: () => handleTabChange("provide", "pool"),
        desc: "Provide liquidity to earn fees and rewards.",
      },
      {
        id: "mint",
        label: "Mint",
        active: activeTab === "mint",
        onChange: () => handleTabChange("mint", "fixed"),
        desc: "Mint new tokens by depositing assets.",
      },
    ]
    return <Tab items={tabItems} className="mb-8" />
  }

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100 px-7.5 py-4">
      {/* 返回按钮 */}
      <div
        onClick={() => history.back()}
        className="text-light-gray bg-gradient-to-r from-white/10 to-white/5 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 cursor-pointer inline-flex p-2 px-2.5 rounded-2xl gap-2 text-sm items-center"
      >
        <ArrowLeft width={16} />
        <span className="text-sm">Back</span>
      </div>

      <AssetHeader coinConfig={coinConfig} />

      {/* TOOD */}
      {/* 统计信息卡片区域 */}
      <div className="grid grid-cols-8 gap-8 mt-8 mb-10">
        {/* LIQUIDITY */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            LIQUIDITY
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.liquidity)}
          </span>
          <span
            className={[
              "text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit",
              new Decimal(coinConfig.liquidityRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span
              className={[
                "text-xs",
                new Decimal(coinConfig.liquidityRateChange).gt(0)
                  ? "text-[#4CC877]"
                  : "text-[#FF2E54]",
              ].join(" ")}
            >
              {new Decimal(coinConfig.liquidityRateChange).toFixed(2)}%
            </span>
            {new Decimal(coinConfig.liquidityRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* 24H VOLUME */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            24H VOLUME
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.volume)}
          </span>
          <span
            className={[
              "text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              new Decimal(coinConfig.volumeRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            <span>{new Decimal(coinConfig.volumeRateChange).toFixed(2)}%</span>
            {new Decimal(coinConfig.volumeRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* MATURITY */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            MATURITY
          </span>
          <span className="text-lg font-semibold text-white">128 Days</span>
          <span className="text-xs rounded-lg px-3 py-1 mt-1 inline-block w-fit text-[#F80] bg-[#F80]/10">
            {dayjs(parseInt(coinConfig.maturity)).format("DD MMM YYYY")}
          </span>
        </div>
        {/* TVL */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            TVL
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.tvl)}
          </span>
          <span className="text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit text-[#4CC877] bg-[#4cc877]/10">
            +4.11% <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
          </span>
        </div>
        {/* YIELD APY */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            YIELD APY
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.yieldApy)}%
          </span>
          <span
            className={[
              "text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              new Decimal(coinConfig.yieldApyRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            ${new Decimal(coinConfig.yieldApyRateChange).toFixed(2)}%
            {new Decimal(coinConfig.yieldApyRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* FIXED APY */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            FIXED APY
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.fixedApy)}%
          </span>
          <span
            className={[
              "text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              new Decimal(coinConfig.fixedApyRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            ${new Decimal(coinConfig.fixedApyRateChange).toFixed(2)}%
            {new Decimal(coinConfig.fixedApyRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* POOL APY */}
        <div className="flex flex-col">
          <span className="text-xs font-medium mb-4 text-[#FCFCFC]/40">
            POOL APY
          </span>
          <span className="text-lg font-semibold text-white">
            ${formatLargeNumber(coinConfig.poolApy)}%
          </span>
          <span
            className={[
              "text-xs rounded-lg px-3 py-1 mt-1 inline-flex items-center gap-1 w-fit ",
              new Decimal(coinConfig.poolApyRateChange).gt(0)
                ? "text-[#4CC877] bg-[#4CC877]/10"
                : "text-[#FF2E54] bg-[#FF2E54]/10",
            ].join(" ")}
          >
            ${new Decimal(coinConfig.poolApyRateChange).toFixed(2)}%
            {new Decimal(coinConfig.poolApyRateChange).gt(0) ? (
              <ArrowUpRight className="w-4 h-4 text-[#4CC877]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#FF2E54]" />
            )}
          </span>
        </div>
        {/* POOL RATIO */}
        <div className="flex flex-col">
          <span
            className="text-xs font-medium mb-4"
            style={{ color: "rgba(252,252,252,0.4)" }}
          >
            POOL RATIO
          </span>
          <span className="text-lg font-semibold text-white">63%</span>
          <div className="w-full h-2 bg-white/10 rounded-full mt-2 mb-1 relative">
            <div
              className="absolute left-0 top-0 h-2 bg-white/80 rounded-full"
              style={{ width: "63%" }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-[#FCFCFC]/40">
            <span>PT {coinConfig.underlyingCoinName} {ptRatio}%</span>
            <span>
              {coinConfig.underlyingCoinName} {syRatio}%
            </span>
          </div>
        </div>
      </div>

      <DetailTabs />

      {/* 动态加载对应类型的市场详情组件 */}
      <MarketDetailComponent coinConfig={coinConfig} />
    </main>
  )
}
