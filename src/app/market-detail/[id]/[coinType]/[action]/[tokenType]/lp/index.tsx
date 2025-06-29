"use client"

import Remove from "./components/Remove"
import SimpleTabs from "../components/SimpleTabs"
import { CoinConfig } from "@/queries/types/market"
import AddLiquidity from "./components/AddLiquidity"
import { useSearchParams, useRouter } from "next/navigation"
import { getIsMobile } from "@/lib/utils"

interface Props {
  currentTab: string
  coinConfig: CoinConfig
  setCurrentTab: (newTab: "1" | "0") => void
}

export default function LPMarketDetail({
  coinConfig,
  currentTab,
  setCurrentTab,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
          { key: "1", label: getIsMobile() ? "Remove" : "Remove Liquidity" },
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
