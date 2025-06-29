"use client"

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import dayjs from "dayjs"
import { useMemo, useRef, useState } from "react"
import { CoinConfig, Granularity, TokenType } from "@/queries/types/market"

import Image from "next/image"
import { useApyHistory } from "@/hooks/useApyHistory"
import React from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import Decimal from "decimal.js"
import { getIsMobile } from "@/lib/utils"

const h1: { label: string; granularity: Granularity; seconds: number }[] = getIsMobile() ? [] : [{ label: "1m", granularity: "MINUTELY", seconds: 60 * 60 }];

const TABS: { label: string; granularity: Granularity; seconds: number }[] = [
  ...h1,
  { label: "1H", granularity: "HOURLY", seconds: 60 * 60 * 72 },
  { label: "1D", granularity: "DAILY", seconds: 60 * 60 * 24 * 60 },
  { label: "1M", granularity: "MONTHLY", seconds: 60 * 60 * 24 * 120 },
]

const METRICS = [
  { label: "APY", value: "apy" },
  { label: "Price", value: "price" },
] as const
const tokenTypeMap = {
  YIELD: "YT",
  FIXED: "PT",
  POOL: "LP",
  TVL: "LP",
}

export default function YieldChart({
  coinConfig,
  h,
  tokenType,
}: {
  coinConfig: CoinConfig
  h?: number
  tokenType: TokenType
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [activeMetric, setActiveMetric] =
    useState<(typeof METRICS)[number]["value"]>("apy")

  // const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const mainMetric = useMemo(() => {
    if (activeMetric === "apy") {
      switch (tokenType) {
        case "FIXED":
          return {
            label: "FIXED APY",
            value: new Decimal(coinConfig?.fixedApy).mul(100).toFixed(2),
            delta: new Decimal(coinConfig?.fixedApyRateChange)
              .mul(100)
              .toFixed(2),
            positive: new Decimal(coinConfig?.fixedApyRateChange).gt(0),
          }
        case "YIELD":
          return {
            label: "YIELD APY",
            value: new Decimal(coinConfig?.yieldApy).mul(100).toFixed(2),
            delta: new Decimal(coinConfig?.yieldApyRateChange)
              .mul(100)
              .toFixed(2),
            positive: new Decimal(coinConfig?.yieldApyRateChange).gt(0),
          }
        case "POOL":
          return {
            label: "POOL APY",
            value: new Decimal(coinConfig?.poolApy).mul(100).toFixed(2),
            delta: new Decimal(coinConfig?.poolApyRateChange)
              .mul(100)
              .toFixed(2),
            positive: new Decimal(coinConfig?.poolApyRateChange).gt(0),
          }
        default:
          return { label: "", value: "—", delta: "", positive: true }
      }
    } else if (activeMetric === "price") {
      switch (tokenType) {
        case "FIXED":
          return {
            label: "FIXED Price",
            value: coinConfig.ptPrice
              ? Number(coinConfig.ptPrice).toFixed(4)
              : "—",
            delta: new Decimal(coinConfig.ptPriceRateChange)
              .mul(100)
              .toNumber(),
            positive: new Decimal(coinConfig.ptPriceRateChange).gt(0),
          }
        case "YIELD":
          return {
            label: "YIELD Price",
            value: coinConfig.ytPrice
              ? Number(coinConfig.ytPrice).toFixed(4)
              : "—",
            delta: new Decimal(coinConfig.ytPriceRateChange)
              .mul(100)
              .toNumber(),
            positive: new Decimal(coinConfig.ytPriceRateChange).gt(0),
          }
        case "POOL":
          return {
            label: "POOL Price",
            value: coinConfig.lpPrice
              ? Number(coinConfig.lpPrice).toFixed(4)
              : "—",
            delta: new Decimal(coinConfig.lpPriceRateChange)
              .mul(100)
              .toNumber(),
            positive: new Decimal(coinConfig.lpPriceRateChange).gt(0),
          }
        default:
          return { label: "", value: "—", delta: "", positive: true }
      }
    }
    return { label: "", value: "—", delta: "", positive: true }
  }, [tokenType, coinConfig, activeMetric])

  const { granularity } = TABS[activeTab]
  const { data, error } = useApyHistory({
    marketStateId: coinConfig.marketStateId,
    tokenType: tokenType,
    granularity,
  })

  const { chartData, yDomain, yTicks, xInterval } = useMemo(() => {
    if (!data?.data?.length)
      return { chartData: [], yDomain: [0, 1], yTicks: [], xInterval: 0 }

    const arr = data.data.map((d) => ({
      price: d.price,
      apy: +d.apy * 100,
      ts: dayjs(d.timeLabel, "YYYY-MM-DD HH:mm:ss").valueOf(),
    }))
    
    const apys = arr.map((v) => v.apy)
    const prices = arr.map((v) => v.price)
    const values = activeMetric === "apy" ? apys : prices
    const min = Math.min(...values)
    const max = Math.max(...values)

    const wantTickCount = 7
    const segmentCount = wantTickCount - 1
    const rawStep = (max - min) / segmentCount
    const step = Math.max(0.1, Math.ceil(rawStep * 10) / 10)

    const tickStart = Math.floor(min / step) * step
    const ticks = Array.from(
      { length: wantTickCount },
      (_, i) => +(tickStart + step * i).toFixed(4)
    )

    const yMin = tickStart - step * 0.5
    const yMax = tickStart + step * segmentCount + step * 0.5
    const wantX = 6
    const interval = Math.max(0, Math.floor(arr.length / wantX) - 1)

    return {
      chartData: arr,
      yDomain: [yMin, yMax],
      yTicks: ticks,
      xInterval: interval,
    }
  }, [data?.data, activeMetric])

  // if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-500">{error.message}</p>

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative" ref={dropRef}>
          <div className="flex flex-col gap-2">
            <Select
              value={activeMetric}
              onValueChange={(v) =>
                setActiveMetric(v as (typeof METRICS)[number]["value"])
              }
            >
              <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-xs text-[rgba(252,252,252,0.40)] w-fit min-w-[60px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-none outline-none bg-[#181C23]">
                <SelectGroup>
                  {METRICS.map((metric) => (
                    <SelectItem
                      key={metric.value}
                      value={metric.value}
                      className="cursor-pointer text-[rgba(252,252,252,0.80)] text-xs"
                    >
                      {`${tokenTypeMap[tokenType]} ${metric.label}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              {/* <span className="text-xs text-white/40 font-medium">
                  {mainMetric.label}
                </span> */}
              <p className="text-[20px] font-[500]">
                {mainMetric.value}
                {activeMetric === "apy" ? "%" : ""}
              </p>
              {!!mainMetric.delta && (
                <span
                  className={`
                  text-xs py-1 px-1.5 rounded-lg font-[600] flex items-center gap-1
                  ${
                    mainMetric.positive
                      ? "bg-[#4CC8771A] text-[#4CC877]"
                      : "bg-[#FF2E541A] text-[#FF2E54]"
                  }
                `}
                >
                  {mainMetric.delta}%
                  <Image
                    src={`/arrow-${
                      mainMetric.positive ? "up" : "down"
                    }-right.svg`}
                    alt={""}
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 text-[12px]">
          {TABS.map((t, i) => (
            <div
              key={t.label + i}
              onClick={() => setActiveTab(i)}
              className={[
                "py-1 px-2 cursor-pointer select-none rounded-md flex items-center justify-center",
                activeTab === i
                  ? "bg-gradient-to-r from-white/5 to-white/1 text-white"
                  : "text-white/60 hover:text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/1",
              ].join(" ")}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={chartData} margin={{ left: 16, right: 0 }}>
          <CartesianGrid stroke="rgba(252,252,252,0.1)" vertical={false} />
          <XAxis
            dataKey="ts"
            interval={xInterval}
            tickFormatter={(v) => dayjs(v).format("DD.MM")}
            tick={{ fill: "rgba(252,252,252,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 16, right: 0 }}
          />
          <YAxis
            orientation="right"
            domain={yDomain as [number, number]}
            ticks={yTicks}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(252,252,252,0.4)", fontSize: 10 }}
            tickFormatter={(value) => {
              if (activeMetric === "apy") {
                // APY数据已经在数据处理阶段放大100倍，直接添加百分号
                return `${value.toFixed(1)}%`
              } else {
                // 价格数据
                return value.toFixed(2)
              }
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null
              const value = Array.isArray(payload[0].value)
                ? payload[0].value[0]
                : payload[0].value
              return (
                <div
                  style={{
                    background: "#0E1520",
                    border: "1px solid #3F3F3F",
                    borderRadius: 12,
                    padding: "16px 24px 12px 24px",
                    minWidth: 240,
                    color: "#fff",
                    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.24)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span className="text-light-gray/40 text-sm">
                      {activeMetric === "apy" ? "Yield APY" : "Price"}
                    </span>
                    <span className="text-white text-sm">
                      {value
                        ? activeMetric === "apy"
                          ? new Decimal(value).toFixed(2) + "%"
                          : new Decimal(value).toFixed(4)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-light-gray/40 text-sm">Time</span>
                    <span className="text-white text-sm">
                      {dayjs(label as string).format("YYYY-MM-DD HH:mm")}
                    </span>
                  </div>
                </div>
              )
            }}
            cursor={{ fill: "rgba(45, 244, 221, 0.10)" }}
          />
          <Line
            type="monotone"
            dataKey={activeMetric}
            stroke="#1785B7"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}
