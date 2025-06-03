"use client"

import { useState } from "react"
import { CoinConfig } from "@/queries/types/market"
import Mint from "./componets/Mint"
import Redeem from "./componets/Redeem"
import SimpleTabs from "../components/SimpleTabs"
import YieldChart from "../components/YieldChart"

interface Props {
  coinConfig: CoinConfig
}

export default function MintMarketDetail({ coinConfig }: Props) {
  const [activeTab, setActiveTab] = useState("mint")

  const tabs = [
    { key: "mint", label: "Mint" },
    { key: "redeem", label: "Redeem" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Mint/Redeem 面板 (span 2) */}
        <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          <SimpleTabs tabs={tabs} current={activeTab} onChange={setActiveTab} />

          {activeTab === "mint" ? (
            <Mint coinConfig={coinConfig} />
          ) : (
            <Redeem coinConfig={coinConfig} />
          )}
        </div>
      </div>
    </div>
  )
}
