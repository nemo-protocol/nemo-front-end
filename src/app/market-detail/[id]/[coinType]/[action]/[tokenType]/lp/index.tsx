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
  setCurrentTab: (newTab: "1" | "0") => void
  currentTab: any
}

export default function LPMarketDetail({ coinConfig, currentTab, setCurrentTab }: Props) {

  // 添加路由相关hooks
  const searchParams = useSearchParams()
  const router = useRouter()



  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab as "1" | "0")

    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
      <SimpleTabs
        current={currentTab}
        onChange={handleTabChange}
        tabs={[
          { key: "0", label: "Add Liquidity" },
          { key: "1", label: "Remove Liquidity" },
        ]}
      />
      {currentTab === "0" ? (
        <AddLiquidity coinConfig={coinConfig} />
      ) : (
        <Remove coinConfig={coinConfig} />
      )}
    </div>
  )
}
