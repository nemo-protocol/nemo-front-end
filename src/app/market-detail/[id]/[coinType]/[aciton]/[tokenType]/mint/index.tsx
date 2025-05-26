"use client"

import AssetHeader from '../components/AssetHeader'
import StatCard from '../components/StatCard'
import YieldChart from '../components/YieldChart'
// import TradeYTCard from '../components/TradeYTCard'
import { CoinConfig } from '@/queries/types/market'

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* token 标题 */}
      <AssetHeader coinConfig={coinConfig} />

      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 概览指标 */}
          <StatCard coinConfig={coinConfig} />
          
          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        {/* <TradeYTCard /> */}
      </div>
    </div>
  )
} 