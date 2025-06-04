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
import { useParams } from "next/navigation"
import React from "react"

const TABS: { label: string; granularity: Granularity; seconds: number }[] = [
  { label: "1m", granularity: "MINUTELY", seconds: 60 * 60 },
  { label: "1H", granularity: "HOURLY", seconds: 60 * 60 * 60 },
  { label: "1D", granularity: "DAILY", seconds: 60 * 60 * 24 * 60 },
  { label: "1M", granularity: "MONTHLY", seconds: 60 * 60 * 24 * 120 },
]

function formatPercent(num?: string | number, digits = 2) {
  if (num == null) return "—"
  const n = +num
  if (Number.isNaN(n)) return "—"
  return `${(n * 1).toFixed(digits)}%` // *1 兼容字符串科学计数
}

export default function YieldChart({ coinConfig }: { coinConfig: CoinConfig }) {
  const params = useParams()
  const [activeTab, setActiveTab] = useState(0)
  const { tokenType: _tokenType } = params as {
    tokenType: Lowercase<TokenType>
  }

  const tokenType = _tokenType.toUpperCase() as TokenType

  // const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const mainMetric = useMemo(() => {
    switch (tokenType) {
      case "FIXED":
        return {
          label: "FIXED APY",
          value: formatPercent(coinConfig.fixedApy),
          delta: formatPercent(coinConfig.fixedApyRateChange),
          positive: +coinConfig.fixedApyRateChange >= 0,
        }
      case "YIELD":
        return {
          label: "YIELD APY",
          value: formatPercent(coinConfig.yieldApy),
          delta: formatPercent(coinConfig.yieldApyRateChange),
          positive: +coinConfig.yieldApyRateChange >= 0,
        }
      case "POOL":
        return {
          label: "POOL APY",
          value: formatPercent(coinConfig.poolApy),
          delta: formatPercent(coinConfig.poolApyRateChange),
          positive: +coinConfig.poolApyRateChange >= 0,
        }
      default:
        return { label: "", value: "—", delta: "", positive: true }
    }
  }, [tokenType, coinConfig])

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
      apy: +d.apy,
      ts: dayjs(d.timeLabel, "YYYY-MM-DD HH:mm:ss").valueOf(),
    }))
    const apys = arr.map((v) => v.apy)
    const min = Math.min(...apys)
    const max = Math.max(...apys)

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
  }, [data])

  // if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-500">{error.message}</p>

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative" ref={dropRef}>
          <div className="flex items-center mt-2 gap-2">
            <p className="text-[20px] font-[550]">{mainMetric.value}</p>

            {!!mainMetric.delta && (
              <span
                className={`
                  text-xs py-0.5 px-1.5 rounded-full flex items-center gap-1
                  ${
                    mainMetric.positive
                      ? "bg-[#4CC8771A] text-[#4CC877]"
                      : "bg-[#FF2E541A] text-[#FF2E54]"
                  }
                `}
              >
                {mainMetric.positive ? "+" : ""}
                {mainMetric.delta}
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

        <div className="flex gap-3 text-[12px]">
          {TABS.map((t, i) => (
            <div
              key={t.label + i}
              onClick={() => setActiveTab(i)}
              className={[
                "py-1 px-2 cursor-pointer select-none rounded-md flex items-center justify-center",
                activeTab === i
                  ? "bg-gradient-to-r from-white/10 to-white/5 text-white"
                  : "text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5",
              ].join(" ")}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
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
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null
              // 兼容 recharts payload 结构
              const apy = Array.isArray(payload[0].value)
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
                      Yield APY
                    </span>
                    <span className="text-white text-sm">
                      {formatPercent(Number(apy), 2)}
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
            type="stepAfter"
            dataKey="apy"
            stroke="#1785B7"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}
