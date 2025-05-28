"use client"

import React, { useState, useMemo } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useCoinInfoList } from "@/queries"
import type {
  Action,
  CoinInfoWithMetrics,
  TokenType,
} from "@/queries/types/market"
import dayjs from "dayjs"
import { formatLargeNumber, formatTimeDiff } from "@/lib/utils"
import StripedBar from "./components/StripedBar"
import InfoTooltip from "@/components/InfoTooltip"
import Image from "next/image"

export default function MarketPage() {
  const router = useRouter()
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    // 从 localStorage 中获取保存的展开状态
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("marketExpandedState")
      return savedState ? JSON.parse(savedState) : {}
    }
    return {}
  })
  const { data: coinList = [] } = useCoinInfoList()
  const [tab, setTab] = useState<"all" | "search">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 更新展开状态并保存到 localStorage
  const updateOpenState = (coinType: string, isOpen: boolean) => {
    const newState = { ...open, [coinType]: isOpen }
    setOpen(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("marketExpandedState", JSON.stringify(newState))
    }
  }

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

  // 过滤搜索结果
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return grouped
    const query = searchQuery.toLowerCase()
    return grouped.filter((group) =>
      group.coinName.toLowerCase().includes(query)
    )
  }, [grouped, searchQuery])

  const handleTokenClick = (
    id: string,
    coinType: string,
    action: Action,
    tokenType: Lowercase<TokenType>
  ) => {
    router.push(`/market-detail/${id}/${coinType}/${action}/${tokenType}`)
  }

  return (
    <div className="bg-[#080E16] min-h-screen text-white p-8">
      <div className="flex items-center gap-8 mb-2">
        <div className="flex items-center gap-2 relative">
          <InfoTooltip active={tab === "all"}>
            <button
              className={`text-[32px] font-medium ${
                tab === "all" ? "text-white" : "text-light-gray/40"
              }`}
              onClick={() => setTab("all")}
            >
              Markets
            </button>
          </InfoTooltip>
        </div>
        <div className="relative">
          <button
            className={`text-[32px] font-medium ${
              tab === "search" ? "text-white" : "text-light-gray/40"
            }`}
            onClick={() => setTab("search")}
          >
            Search Markets
          </button>
          <Image
            src={
              tab === "search"
                ? "/assets/images/search.svg"
                : "/assets/images/search-inactive.svg"
            }
            alt="search"
            width={16}
            height={16}
            className="absolute top-0 -right-4"
          />
        </div>
      </div>
      {tab === "all" ? (
        <p className="text-light-gray/40 mb-8 py-2">
          Dive into the yield trading market and maximize your profit potential.
        </p>
      ) : (
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full text-sm bg-light-gray/[0.03] px-4 py-2 text-white border-none outline-none mb-8"
        />
      )}
      <div className="space-y-6">
        {filteredGroups.map(
          ({ coinName, coinLogo, coinType, arr, totalTvl }) => (
            <div key={coinType} className="rounded-3xl bg-light-gray/[0.03]">
              <button
                className="w-full px-8 py-6 focus:outline-none select-none group grid grid-cols-4"
                onClick={() => updateOpenState(coinType, !open[coinType])}
                style={{ borderRadius: "24px 24px 0 0" }}
              >
                <div className="flex items-center gap-3 text-2xl font-bold col-span-1">
                  <Image width={32} height={32} src={coinLogo} alt={coinName} />
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
                <div className="text-lg font-[550] flex items-center gap-x-4 col-span-1">
                  <span className="text-[#FCFCFC]/40">Total TVL</span>
                  <span className="text-white">
                    ${totalTvl.toLocaleString()}
                  </span>
                </div>
              </button>
              {open[coinType] && (
                <div className="px-8 pb-8 pt-2">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-light-gray/40 text-xs">
                          <TableHead className="font-semibold">
                            MARKET
                          </TableHead>
                          <TableHead className="font-semibold">
                            MATURITY
                          </TableHead>
                          <TableHead className="font-semibold">TVL</TableHead>
                          <TableHead className="font-semibold text-[#956EFF]">
                            POOL APY
                          </TableHead>
                          <TableHead className="font-semibold text-[#5D94FF] space-x-2">
                            <span className="text-[#1785B7]">YEILD APY</span>
                            <span className="text-[#FCFCFC]/40">YT PRICE</span>
                          </TableHead>
                          <TableHead className="font-semibold text-[#3FE0C5] space-x-2">
                            <span className="text-[#17B69B]">FIXED APY</span>
                            <span className="text-[#FCFCFC]/40">PT PRICE</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arr.map((row) => (
                          <TableRow className="align-middle" key={row.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={row.coinLogo}
                                  alt={row.coinName}
                                  width={20}
                                  height={20}
                                />
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
                            <TableCell>
                              <div className="grid grid-cols-8">
                                <span className="text-white text-sm col-span-2">
                                  {formatTimeDiff(parseInt(row.maturity))}
                                </span>
                                <span className="col-span-4">
                                  <StripedBar
                                    gap={4}
                                    rounded
                                    count={24}
                                    barWidth={8}
                                  />
                                </span>
                                <span className="col-span-2 shrink-0 text-sm text-white/40 font-medium">
                                  {dayjs(parseInt(row.maturity)).format(
                                    "DD MMM YYYY"
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="!px-6">
                              <div className="flex items-center gap-x-2">
                                <div className="text-white text-base font-bold">
                                  ${formatLargeNumber(row.tvl, 2)}
                                </div>
                                <div className="text-xs text-white/40">10%</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  handleTokenClick(
                                    row.id,
                                    row.coinType,
                                    "provide",
                                    "pool"
                                  )
                                }
                                className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#956EFF]/10 text-[#FCFCFC] font-[550] shadow-lg justify-center cursor-pointer"
                              >
                                <span className="text-white">
                                  {formatLargeNumber(row.poolApy, 2)}%
                                </span>
                                <Image
                                  src="/assets/images/star.svg"
                                  alt="star"
                                  width={16}
                                  height={16}
                                />
                                <Image
                                  src="/assets/images/gift.svg"
                                  alt="gift"
                                  width={16}
                                  height={16}
                                />
                                <Plus size={18} className="text-[#956EFF]" />
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  handleTokenClick(
                                    row.id,
                                    row.coinType,
                                    "trade",
                                    "yield"
                                  )
                                }
                                className="flex items-center gap-1 px-4 py-2 rounded-full bg-light-gray/[0.03] text-white font-[550] shadow-lg justify-center cursor-pointer"
                              >
                                <span className="text-white">
                                  {formatLargeNumber(row.ytApy, 2)}%
                                </span>
                                <span className="text-[#FCFCFC]/40">
                                  {formatLargeNumber(row.ytPrice, 2)}
                                </span>
                                <Plus size={18} className="text-[#1785B7]" />
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  handleTokenClick(
                                    row.id,
                                    row.coinType,
                                    "trade",
                                    "fixed"
                                  )
                                }
                                className="flex items-center gap-1 px-4 py-2 rounded-full bg-light-gray/[0.03] text-white font-[550] shadow-lg justify-center cursor-pointer"
                              >
                                <span className="text-white">
                                  {formatLargeNumber(row.ptApy, 2)}%
                                </span>
                                <span className="text-[#FCFCFC]/40">
                                  {formatLargeNumber(row.ptPrice, 2)}
                                </span>
                                <Plus size={18} className="text-[#17B69B]" />
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
          )
        )}
      </div>
    </div>
  )
}
