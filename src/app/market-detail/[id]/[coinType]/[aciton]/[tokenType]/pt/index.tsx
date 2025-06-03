"use client"

import { useState } from "react"
import { CoinConfig } from "@/queries/types/market"
import SimpleTabs from "../components/SimpleTabs"
import YieldChart from "../components/YieldChart"
import Buy from "./componets/Buy"
import Sell from "./componets/Sell"

interface Props {
  coinConfig: CoinConfig
}

export default function PTMarketDetail({ coinConfig }: Props) {
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
