"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import SimpleTabs from "../components/SimpleTabs"
import Buy from "./components/Buy"
import Sell from "./components/Sell"

interface Props {
  coinConfig: CoinConfig
  setCurrentTab: (newTab:  "1" | "0") => void
  currentTab: any
}

export default function YTMarketDetail({ coinConfig, currentTab, setCurrentTab }: Props) {

  const searchParams = useSearchParams()
  const router = useRouter()

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab as "1" | "0")
    // 更新URL参数 - 使用数字0对应buy，1对应sell
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (


    <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col h-a gap-6">
      <SimpleTabs
        tabs={[
          { key: "0", label: "BUY" },
          { key: "1", label: "SELL" },
        ]}
        current={currentTab}
        onChange={handleTabChange}
      />

      {currentTab === "0" && <Buy coinConfig={coinConfig} />}
      {currentTab === "1" && <Sell coinConfig={coinConfig} />}
    </div>
  )
}
