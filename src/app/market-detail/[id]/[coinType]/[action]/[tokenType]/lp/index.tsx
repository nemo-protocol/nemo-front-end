"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import YieldChart from "../components/YieldChart"
import SimpleTabs from "../components/SimpleTabs"
import { CoinConfig } from "@/queries/types/market"
import AddLiquidity from "./components/AddLiquidity"
import Remove from "./components/Remove"

interface Props {
  coinConfig: CoinConfig
}

export default function LPMarketDetail({ coinConfig }: Props) {
  const [currentTab, setCurrentTab] = useState("add")
  
  // 添加路由相关hooks
  const searchParams = useSearchParams()
  const router = useRouter()

  // 初始化时从URL读取mode参数
  useEffect(() => {
    const urlMode = searchParams.get("mode")
    if (urlMode === "0") {
      setCurrentTab("add")
    } else if (urlMode === "1") {
      setCurrentTab("remove")
    }
  }, [searchParams])

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab)
    
    // 更新URL参数 - 使用数字0对应add，1对应remove
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newTab === "add" ? "0" : "1")
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
          <SimpleTabs
            current={currentTab}
            onChange={handleTabChange}
            tabs={[
              { key: "add", label: "Add Liquidity" },
              { key: "remove", label: "Remove Liquidity" },
            ]}
          />
          {currentTab === "add" ? (
            <AddLiquidity coinConfig={coinConfig} />
          ) : (
            <Remove coinConfig={coinConfig} />
          )}
        </div>
      </div>
    </div>
  )
}
