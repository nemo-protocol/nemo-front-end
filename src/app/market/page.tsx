"use client"

import React, { useState, useMemo } from "react"
import { Info, ChevronDown, Plus, Sparkles, Gift } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useCoinInfoList } from "@/queries"
import type { CoinInfoWithMetrics } from "@/queries/types/market"
import dayjs from "dayjs"
import { formatLargeNumber, formatTimeDiff } from "@/lib/utils"

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-36 h-2 bg-[#23242A] rounded-full flex items-center overflow-hidden mx-2">
      <div
        className="h-full bg-gradient-to-r from-white to-white/60 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export default function MarketPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const { data: coinList = [] } = useCoinInfoList()

  // 动态分组并排序
  const grouped = useMemo(() => {
    const map: Record<string, CoinInfoWithMetrics[]> = {}
    coinList.forEach((item) => {
      if (!map[item.coinType]) map[item.coinType] = []
      map[item.coinType].push(item)
    })
    // 计算每组TVL总和
    const groupArr = Object.entries(map).map(([coinType, arr]) => ({
      coinType,
      arr,
      coinLogo: arr[0].coinLogo,
      coinName: arr[0].coinName,
      totalTvl: arr.reduce((sum, c) => sum + Number(c.tvl), 0),
    }))
    // 按TVL总和降序
    groupArr.sort((a, b) => b.totalTvl - a.totalTvl)
    return groupArr
  }, [coinList])

  return (
    <div className="bg-[#080E16] min-h-screen text-white p-8">
      <div className="flex items-center gap-8 mb-2">
        <div className="flex items-center gap-2 relative">
          <span
            className="text-[48px] font-serif font-semibold text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.5)]"
            style={{ letterSpacing: 0 }}
          >
            Markets
          </span>
          <Info
            size={22}
            className="ml-2 text-white/90 bg-white/10 rounded-full p-0.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[40px] font-serif text-white/30 font-normal">
            Search Markets
          </span>
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            className="text-white/30"
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m1.35-4.65a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <p className="text-white/60 mb-8">
        Dive into the yield trading market and maximize your profit potential.
      </p>
      <div className="space-y-6">
        {grouped.map(({ coinName, coinLogo, coinType, arr, totalTvl }) => (
          <div
            key={coinType}
            className="rounded-3xl"
            style={{ background: "rgba(252, 252, 252, 0.03)" }}
          >
            <button
              className="w-full flex items-center justify-between px-8 py-6 focus:outline-none select-none group"
              onClick={() =>
                setOpen((o) => ({ ...o, [coinType]: !o[coinType] }))
              }
              style={{ borderRadius: "24px 24px 0 0" }}
            >
              <div className="flex items-center gap-3 text-2xl font-bold">
                <img src={coinLogo} alt={coinName} className="w-8 h-8" />
                <span>{coinName}</span>
                <span className="text-white/60 text-lg font-normal ml-1">
                  {arr.length}
                </span>
                <ChevronDown
                  className={`transition-transform duration-200 ml-2 ${
                    open[coinType] ? "rotate-180" : ""
                  } text-white/70`}
                  size={28}
                />
              </div>
              <div className="flex items-center gap-8">
                <div className="text-lg font-bold">
                  Total TVL{" "}
                  <span className="text-[#FFD700]">
                    ${totalTvl.toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
            {open[coinType] && (
              <div className="px-8 pb-8 pt-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-white/60 text-xs">
                        <TableHead className="w-[16%] pl-2 font-normal">
                          MARKET
                        </TableHead>
                        <TableHead className="w-[16%] font-normal">
                          MATURITY
                        </TableHead>
                        <TableHead className="w-[12%] font-normal">
                          TVL
                        </TableHead>
                        <TableHead className="w-[18%] font-normal text-[#5D94FF]">
                          YEILD APY / YT PRICE
                        </TableHead>
                        <TableHead className="w-[18%] font-normal text-[#3FE0C5]">
                          FIXED APY / PT PRICE
                        </TableHead>
                        <TableHead className="w-[14%] font-normal text-[#B09FFF]">
                          POOL APY
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arr.map((row) => (
                        <TableRow className="align-middle" key={row.id}>
                          <TableCell className="w-[16%] pl-2">
                            <div className="flex items-center gap-2">
                              <img src={row.coinLogo} className="w-5 h-5" />
                              <span className="font-semibold text-base">
                                {row.coinName}
                              </span>
                              {row.version === "V2" && (
                                <span className="bg-[#23243A] text-xs px-2 py-0.5 rounded ml-1">
                                  V2 TOKEN
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[16%]">
                            <div className="text-white text-sm">
                              {formatTimeDiff(parseInt(row.maturity))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <ProgressBar percent={80} />
                              <span className="text-xs text-white/40">
                                {dayjs(parseInt(row.maturity)).format(
                                  "DD MMM YYYY"
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[12%]">
                            <div className="text-white text-base font-bold">
                              ${formatLargeNumber(row.tvl, 2)}
                            </div>
                            <div className="text-xs text-white/40">10%</div>
                          </TableCell>
                          <TableCell className="w-[18%]">
                            <div className="flex items-center gap-2">
                              <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#23243A] text-white font-bold">
                                {formatLargeNumber(row.ytApy, 2)}%
                              </button>
                              <div
                                className="flex items-center justify-center rounded-full px-4 py-2 font-bold text-white"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #fff 0%, #5D94FF 100%)",
                                  minWidth: 120,
                                }}
                              >
                                <span className="text-[#fff] mr-2">
                                  ${formatLargeNumber(row.ytPrice, 2)}
                                </span>
                                <button className="text-[#5D94FF] font-bold ml-1">
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[18%]">
                            <div className="flex items-center gap-2">
                              <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-[#3FE0C5]/30 to-[#23243A] text-[#3FE0C5] font-bold">
                                {formatLargeNumber(row.ptApy, 2)}%
                              </button>
                              <div
                                className="flex items-center justify-center rounded-full px-4 py-2 font-bold text-white"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #fff 0%, #3FE0C5 100%)",
                                  minWidth: 120,
                                }}
                              >
                                <span className="text-[#fff] mr-2">
                                  ${formatLargeNumber(row.ptPrice, 2)}
                                </span>
                                <button className="text-[#3FE0C5] font-bold ml-1">
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[14%]">
                            <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-[#B09FFF]/30 to-[#23243A] text-[#FFF7B2] font-bold shadow-lg w-full justify-center">
                              {formatLargeNumber(row.poolApy, 2)}%{" "}
                              <Sparkles size={16} className="inline ml-1" />{" "}
                              <Gift size={16} className="inline ml-1" />{" "}
                              <Plus size={18} className="ml-2" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
