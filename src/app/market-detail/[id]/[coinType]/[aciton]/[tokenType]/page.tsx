"use client"

import { useParams } from "next/navigation"
import { useCoinConfig } from "@/queries"
import { ArrowLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { Action, CoinConfig, TokenType } from "@/queries/types/market"
import Calculator from "./components/Calculator"

export default function MarketDetailPage() {
  const params = useParams()
  const { id, tokenType, action } = params as {
    id: string
    action: Action
    tokenType: TokenType
  }

  const { data: coinConfig, isLoading: isConfigLoading } = useCoinConfig(id)

  // 动态导入对应类型的组件
  const MarketDetailComponent = dynamic<{ coinConfig: CoinConfig }>(
    () => {
      if (action === "mint") {
        return import("./mint/index")
      }
      switch (tokenType) {
        case "yt":
          return import("./yt/index")
        case "pt":
          return import("./pt/index")

        case "lp":
          return import("./lp/index")
        default:
          return Promise.resolve(() => null)
      }
    },
    {
      ssr: false,
      loading: () => <div className="text-white p-8">Loading component...</div>,
    }
  )

  if (isConfigLoading) {
    return <div className="text-white p-8">Loading...</div>
  }

  if (!coinConfig) {
    return <div className="text-white p-8">Market not found</div>
  }

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100 px-7.5 py-4">
      {/* 返回按钮 */}
      <div
        onClick={() => history.back()}
        className="text-white bg-gradient-to-r from-white/10 to-white/5 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5"
        style={{
          cursor: "pointer",
          display: "inline-flex",
          padding: "8px 10px",
          borderRadius: "16px",
          gap: "8px",
          fontSize: "14px",
          alignItems: "center",
        }}
      >
        <ArrowLeft width={16} />
        Back
      </div>

      {/* 动态加载对应类型的市场详情组件 */}
      <MarketDetailComponent coinConfig={coinConfig} />
    </main>
  )
}
