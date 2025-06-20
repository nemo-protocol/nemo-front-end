"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CoinConfig } from "@/queries/types/market"
import Mint from "./componets/Mint"
import Redeem from "./componets/Redeem"
import SimpleTabs from "../components/SimpleTabs"
import YieldChart from "../components/YieldChart"

interface Props {
  coinConfig: CoinConfig
  setCurrentTab: (newTab: "1" | "0") => void
  currentTab: any
}

export default function MintMarketDetail({ coinConfig, currentTab, setCurrentTab }: Props) {

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab as "1" | "0")

    // 更新URL参数 - 使用数字0对应mint，1对应redeem
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const tabs = [
    { key: "0", label: "Mint" },
    { key: "1", label: "Redeem" },
  ]

  return (


    <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
      <SimpleTabs tabs={tabs} current={currentTab} onChange={handleTabChange} />

      {currentTab === "0" ? (
        <Mint coinConfig={coinConfig} />
      ) : (
        <Redeem coinConfig={coinConfig} />
      )}
    </div>

  )
}
