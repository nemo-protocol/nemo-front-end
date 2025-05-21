'use client';

import AssetHeader from './AssetHeader';
import StatCard from './StatCard';
import YieldChart from './YieldChart';
import TradeYTCard from './TradeYTCard';
import { MarketStat, ChartPoint, TokenMeta } from '@/types/types';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCoinConfig } from '@/queries';







export default function MarketPage({
  params,
}: {
  params: { symbol: string };
}) {

  const {
    data: coinConfig,
    isLoading: isConfigLoading,
    refetch: refetchCoinConfig,
  } = useCoinConfig("0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI", "1771513200000")

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100 px-7.5 py-4"

    >
      {/* 返回按钮 */}
      <div
        onClick={() => history.back()}
        className='text-white bg-gradient-to-r from-white/10 to-white/5 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5'
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          padding: '8px 10px',
          borderRadius: '16px',
          gap: '8px',
          fontSize: '14px',
          alignItems: 'center',
        }}
      >
        <ArrowLeft width={16} />Back
      </div>

      {/* token 标题 */}
      {coinConfig && <AssetHeader coinConfig={coinConfig} />}



      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        {coinConfig &&<div className="lg:col-span-2 flex flex-col gap-6">

          {/* 概览指标 */}
         
          <StatCard coinConfig={coinConfig} />
          
           <div className="bg-[#101823] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>}

        {/* 右侧 Trade 面板 */}
        <TradeYTCard />
      </div>
    </main>
  );
}
