"use client"

import { useState } from "react"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import Calculator from "../components/Calculator"
import SimpleTabs from "../components/SimpleTabs"
import Buy from "./components/Buy"
import Sell from "./components/Sell"

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<"buy" | "sell">("buy")

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
            onChange={key => setCurrentTab(key as "buy" | "sell")}
          />

          {currentTab === "buy" && <Buy coinConfig={coinConfig} />}
          {currentTab === "sell" && <Sell coinConfig={coinConfig} />}
        </div>
      </div>
    </div>
  )
}
