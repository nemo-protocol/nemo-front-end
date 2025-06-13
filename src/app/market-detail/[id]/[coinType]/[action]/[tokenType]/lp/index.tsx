"use client"

import { useState } from "react"
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
            onChange={setCurrentTab}
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
