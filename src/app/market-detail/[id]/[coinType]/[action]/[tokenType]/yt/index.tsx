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
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const [currentTab, setCurrentTab] = useState<"buy" | "sell">("buy")
  
  // 添加路由相关hooks
  const searchParams = useSearchParams()
  const router = useRouter()

  // 初始化时从URL读取mode参数
  useEffect(() => {
    const urlMode = searchParams.get("mode")
    if (urlMode === "0") {
      setCurrentTab("buy")
    } else if (urlMode === "1") {
      setCurrentTab("sell")
    }
  }, [searchParams])

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab as "buy" | "sell")
    
    // 更新URL参数 - 使用数字0对应buy，1对应sell
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newTab === "buy" ? "0" : "1")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      

      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          {/* Tab栏 用SimpleTabs组件 */}
          <SimpleTabs
            tabs={[
              { key: "buy", label: "BUY" },
              { key: "sell", label: "SELL" },
            ]}
            current={currentTab}
            onChange={handleTabChange}
          />

          {currentTab === "buy" && <Buy coinConfig={coinConfig} />}
          {currentTab === "sell" && <Sell coinConfig={coinConfig} />}
        </div>
      </div>
    </div>
  )
}
