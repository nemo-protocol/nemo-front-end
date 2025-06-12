"use client"

import { APYTooltip } from "@/components/APYTooltip"
import dayjs from "dayjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCoinInfoList } from "@/queries"
import StripedBar from "./components/StripedBar"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import { Tab, type TabItem } from "@/components/ui/tab"
import React, { useState, useMemo, useEffect } from "react"
import { ChevronDown, Plus, Inbox, X } from "lucide-react"
import { formatLargeNumber, formatTimeDiff } from "@/lib/utils"
import type { ExtendedColumnDef } from "@/components/ui/data-table"
import type {
  Action,
  TokenType,
  CoinInfoWithMetrics,
} from "@/queries/types/market"

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
  const { data: coinList = [], isLoading } = useCoinInfoList()
  const [tab, setTab] = useState<"all" | "search">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [listMode, setListMode] = useState<"list" | "grid" | undefined>(
    undefined
  )
  const [tooltipOpen, setTooltipOpen] = useState<Record<string, boolean>>({})

  // 页面挂载后读取缓存
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("marketListMode")
      setListMode((savedMode as "list" | "grid") || "list")
    }
  }, [])

  // 更新列表模式并保存到 localStorage
  const updateListMode = (mode: "list" | "grid") => {
    setListMode(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem("marketListMode", mode)
    }
  }

  const tabItems: TabItem[] = [
    {
      id: "all",
      label: "Markets",
      active: tab === "all",
      onChange: () => setTab("all"),
      content: "View all available markets",
    },
    {
      id: "search",
      label: "Search Markets",
      active: tab === "search",
      onChange: () => setTab("search"),
      icon: (
        <Image
          src={
            tab === "search"
              ? "/assets/images/search.svg"
              : "/assets/images/search-inactive.svg"
          }
          alt="search"
          width={16}
          height={16}
        />
      ),
    },
  ]

  // List Mode 切换Tab配置
  const listModeItems: TabItem[] = [
    {
      id: "list",
      label: (
        <Image
          src={
            listMode === "list"
              ? "/assets/images/line-list-active.svg"
              : "/assets/images/line-list.svg"
          }
          alt="List"
          width={22}
          height={22}
        />
      ),
      active: listMode === "list",
      onChange: () => updateListMode("list"),
    },
    {
      id: "grid",
      label: (
        <Image
          src={
            listMode === "grid"
              ? "/assets/images/grid-list-active.svg"
              : "/assets/images/grid-list.svg"
          }
          alt="Grid"
          width={22}
          height={22}
        />
      ),
      active: listMode === "grid",
      onChange: () => updateListMode("grid"),
    },
  ]

  // 更新展开状态并保存到 localStorage
  const updateOpenState = (groupName: string, isOpen: boolean) => {
    const newState = { ...open, [groupName]: isOpen }
    setOpen(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("marketExpandedState", JSON.stringify(newState))
    }
  }

  // 动态分组并排序
  const grouped = useMemo(() => {
    const map: Record<string, CoinInfoWithMetrics[]> = {}
    coinList.forEach((item) => {
      if (!map[item.groupName]) map[item.groupName] = []
      map[item.groupName].push(item)
    })
    // 计算每组TVL总和
    const groupArr = Object.entries(map).map(([groupName, arr]) => ({
      groupName,
      arr,
      coinLogo: arr[0].groupLogo,
      coinName: arr[0].groupName,
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

  // 过滤列表数据
  const filteredList = useMemo(() => {
    if (!searchQuery) return coinList
    const query = searchQuery.toLowerCase()
    return coinList.filter((item) =>
      item.coinName.toLowerCase().includes(query)
    )
  }, [coinList, searchQuery])

  const handleTokenClick = (
    id: string,
    coinType: string,
    action: Action,
    tokenType: Lowercase<TokenType>
  ) => {
    router.push(`/market-detail/${id}/${coinType}/${action}/${tokenType}`)
  }

  const columns: ExtendedColumnDef<CoinInfoWithMetrics, string | number>[] = [
    {
      accessorKey: "coinName",
      header: "MARKET",
      enableSorting: false,
      width: 250,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Image
            width={20}
            height={20}
            src={row.original.coinLogo}
            alt={row.original.coinName}
          />
          <span className="font-medium text-base">{row.original.coinName}</span>
          {row.original.ptTokenType && (
            <span className="text-light-gray/40 bg-[#956EFF]/10 text-xs px-1.5 py-1 rounded-lg ml-1">
              V2 TOKEN
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "maturity",
      header: "MATURITY",
      width: 300,
      cell: ({ row }) => {
        const maturity = parseInt(row.original.maturity)
        const startTime = parseInt(row.original.startTime)
        const now = Date.now()
        const total = maturity - startTime
        const passed = Math.max(0, Math.min(now - startTime, total))
        const count = 30
        let activeCount = Math.round((passed / total) * count)
        if (activeCount > count) activeCount = count
        if (activeCount < 0) activeCount = 0
        return (
          <div className="grid grid-cols-5 items-center">
            <div className="col-span-2 flex flex-col items-start gap-x-2">
              <span className="text-white text-sm font-medium">
                {`${formatTimeDiff(maturity).toLocaleLowerCase()}`}
              </span>
              <span className="col-span-3 shrink-0 text-xs text-white/40 font-medium">
                {dayjs(maturity).format("DD MMM YYYY")}
              </span>
            </div>
            <span className="col-span-2">
              <StripedBar
                gap={2}
                rounded
                count={count}
                barWidth={3}
                activeCount={activeCount}
              />
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "tvl",
      header: "TVL",
      width: 200,
      cell: ({ row }) => (
        <div className="flex items-center gap-x-2">
          <div className="text-white text-base font-medium">
            ${formatLargeNumber(row.original.tvl, 2)}
          </div>
          <div className="text-xs text-white/40">10%</div>
        </div>
      ),
    },
    {
      accessorKey: "poolApy",
      header: "POOL APY",
      headerColor: "#956EFF",
      width: 300,
      cell: ({ row }) => (
        <APYTooltip
          config={{
            perPoints: Number(row.original.perPoints),
            boost: Number(row.original.boost),
            scaledPtApy: Number(row.original.scaledPtApy),
            scaledUnderlyingApy: Number(row.original.scaledUnderlyingApy),
            swapFeeApy: Number(row.original.swapFeeApy),
            feeApy: Number(row.original.feeApy),
            poolApy: Number(row.original.poolApy),
            incentives: row.original.incentives?.map((incentive) => ({
              tokenLogo: incentive.tokenLogo,
              apy: Number(incentive.apy),
            })),
            scaledTotalApy:
              Number(row.original.scaledPtApy) +
              Number(row.original.scaledUnderlyingApy) +
              Number(row.original.swapFeeApy),
          }}
          open={tooltipOpen[row.original.id]}
          onOpenChange={(open) =>
            setTooltipOpen((prev) => ({ ...prev, [row.original.id]: open }))
          }
          trigger={
            <button
              onClick={() =>
                handleTokenClick(
                  row.original.id,
                  row.original.coinType,
                  "provide",
                  "pool"
                )
              }
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#956EFF]/10 text-[#FCFCFC] font-[550] shadow-lg justify-center cursor-pointer hover:bg-[#956EFF]/30"
            >
              <span className="text-white font-medium">
                {formatLargeNumber(row.original.poolApy, 2)}%
              </span>
              {row.original.perPoints && (
                <Image
                  src="/assets/images/star.svg"
                  alt="star"
                  width={16}
                  height={16}
                />
              )}
              {row.original.incentives?.length > 0 && (
                <Image
                  src="/assets/images/gift.svg"
                  alt="gift"
                  width={12}
                  height={12}
                />
              )}
              <Plus size={18} className="text-[#956EFF]" />
            </button>
          }
        />
      ),
    },
    {
      accessorKey: "ytApy",
      header: "YEILD APY",
      subHeader: "YT PRICE",
      headerColor: "#1785B7",
      width: 300,
      cell: ({ row }) => (
        <button
          onClick={() =>
            handleTokenClick(
              row.original.id,
              row.original.coinType,
              "trade",
              "yield"
            )
          }
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-light-gray/[0.03] text-white font-[550] shadow-lg justify-center cursor-pointer hover:bg-[#1785B7]/30"
        >
          <span className="text-white font-medium">
            {formatLargeNumber(row.original.ytApy, 2)}%
          </span>
          <span className="text-[#FCFCFC]/40">
            {formatLargeNumber(row.original.ytPrice, 2)}
          </span>
          <Plus size={18} className="text-[#1785B7]" />
        </button>
      ),
    },
    {
      accessorKey: "ptApy",
      header: "FIXED APY",
      subHeader: "PT PRICE",
      headerColor: "#17B69B",
      width: 300,
      cell: ({ row }) => (
        <button
          onClick={() =>
            handleTokenClick(
              row.original.id,
              row.original.coinType,
              "trade",
              "fixed"
            )
          }
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-light-gray/[0.03] text-white font-[550] shadow-lg justify-center cursor-pointer hover:bg-[#17B69B]/30"
        >
          <span className="text-white font-medium">
            {formatLargeNumber(row.original.ptApy, 2)}%
          </span>
          <span className="text-[#FCFCFC]/40">
            {formatLargeNumber(row.original.ptPrice, 2)}
          </span>
          <Plus size={18} className="text-[#17B69B]" />
        </button>
      ),
    },
  ]

  return (
    // listMode 未准备好时不渲染主内容
    listMode === undefined ? (
      <div className="min-h-screen bg-[#080E16]"></div>
    ) : (
      <div className="bg-[#080E16] min-h-screen text-white p-8">
        <Tab items={tabItems} className="mb-2" />
        {tab === "all" ? (
          <div className="flex items-center justify-between">
            <p className="text-light-gray/40 mb-8 py-2">
              Dive into the yield trading market and maximize your profit
              potential.
            </p>
            <div className="text-light-gray/40 flex items-center gap-8">
              <span className="text-light-gray/40">LIST MODE:</span>
              <Tab items={listModeItems} />
            </div>
          </div>
        ) : (
          <div className="relative w-full mb-8">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full text-sm bg-light-gray/[0.03] px-4 py-2 text-white border-none outline-none h-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                onClick={() => setSearchQuery("")}
                tabIndex={-1}
              >
                <X size={18} />
              </button>
            )}
            {/* 搜索浮层结果列表 */}
            {searchQuery && filteredList.length > 0 && (
              <div className="absolute left-0 w-full px-8 mt-2 z-30 backdrop-blur-md h-[800px] bg-transparent">
                <DataTable columns={columns} data={filteredList} />
              </div>
            )}
          </div>
        )}
        <div className="space-y-6">
          {isLoading ? (
            listMode === "list" ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[60px] w-full rounded-2xl bg-[linear-gradient(90deg,rgba(38,48,66,0.5)_0%,rgba(15,23,33,0.5)_100%)] mb-4"
                />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-6 bg-light-gray/[0.03] p-6"
                >
                  <Skeleton className="w-[60px] h-[60px] rounded-full flex-shrink-0 bg-[linear-gradient(90deg,rgba(38,48,66,0.5)_0%,rgba(15,23,33,0.5)_100%)]" />
                  <div className="flex flex-col justify-center flex-1 gap-6">
                    <Skeleton className="h-[60px] w-full rounded-2xl bg-[linear-gradient(90deg,rgba(38,48,66,0.5)_0%,rgba(15,23,33,0.5)_100%)]" />
                    <Skeleton className="h-[36px] w-full rounded-2xl bg-[linear-gradient(90deg,rgba(38,48,66,0.5)_0%,rgba(15,23,33,0.5)_100%)]" />
                    <Skeleton className="h-[36px] w-full rounded-2xl bg-[linear-gradient(90deg,rgba(38,48,66,0.5)_0%,rgba(15,23,33,0.5)_100%)]" />
                  </div>
                </div>
              ))
            )
          ) : listMode === "list" ? (
            filteredList.length === 0 ? (
              <div className="rounded-3xl bg-light-gray/[0.03] p-8 flex flex-col items-center justify-center gap-4">
                <Inbox size={48} className="text-white/40" />
                <p className="text-white/40 text-lg">No data available</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-light-gray/[0.03] p-8">
                <div className="overflow-x-auto">
                  <DataTable columns={columns} data={filteredList} />
                </div>
              </div>
            )
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-3xl bg-light-gray/[0.03] p-8 flex flex-col items-center justify-center gap-4">
              <Inbox size={48} className="text-white/40" />
              <p className="text-white/40 text-lg">No data available</p>
            </div>
          ) : (
            filteredGroups.map(
              ({ coinName, coinLogo, groupName, arr, totalTvl }) => (
                <div
                  key={groupName}
                  className="rounded-3xl bg-light-gray/[0.03]"
                >
                  <button
                    className="w-full px-8 py-6 focus:outline-none select-none group grid grid-cols-4"
                    onClick={() => updateOpenState(groupName, !open[groupName])}
                    style={{ borderRadius: "24px 24px 0 0" }}
                  >
                    <div className="flex items-center gap-3 text-2xl font-bold col-span-1">
                      <Image
                        width={32}
                        height={32}
                        src={coinLogo}
                        alt={coinName}
                      />
                      <span className="font-medium">{coinName}</span>
                      <span className="text-white/60 text-lg font-normal ml-1">
                        {arr.length}
                      </span>
                      <ChevronDown
                        className={`transition-transform duration-200 ml-2 ${
                          open[groupName] ? "rotate-180" : ""
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
                  {open[groupName] && (
                    <div className="px-8 pb-8 pt-2">
                      <div className="overflow-x-auto border-l border-light-gray/10">
                        <DataTable columns={columns} data={arr} />
                      </div>
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>
    )
  )
}
