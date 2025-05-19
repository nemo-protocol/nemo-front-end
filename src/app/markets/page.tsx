'use client';

import AssetHeader from './AssetHeader';
import StatCard from './StatCard';
import YieldChart from './YieldChart';
import TradeYTCard from './TradeYTCard';
import { MarketStat, ChartPoint, TokenMeta } from '@/types/types';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';


/* ------- 假数据 ------- */
const tokens: Record<string, TokenMeta> = {
  xsui: {
    symbol: 'xSUI',
    name: 'Sui Staked Token',
    logo: '',
  },
};

function getFakeStats(): MarketStat[] {
  return [
    { label: 'Liquidity', value: '$30.12M', delta: '4.11%', deltaPositive: true },
    { label: '24h Volume', value: '$5.32M', delta: '1.12%', deltaPositive: false },
    { label: 'Yield APY', value: '14.33%', delta: '4.56%', deltaPositive: true },
    { label: 'Maturity', value: '110 Days', delta: '2025-08-10', deltaPositive: true },
  ];
}

function getFakeChart(): ChartPoint[] {
  return new Array(20).fill(0).map((_, i) => ({
    ts: Date.now() - (20 - i) * 86400000,
    apy: 12 + Math.random() * 10,
  }));
}
/* --------------------- */

export default function MarketPage({
  params,
}: {
  params: { symbol: string };
}) {
  const token = tokens.xsui
  if (!token) notFound();

  const stats = getFakeStats();
  const chartData = getFakeChart();

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100 px-4 py-6"

    >
      {/* 返回按钮 */}
      <div
        onClick={() => history.back()}
        className="hover:bg-[#ffffff]"
        style={{
          cursor: 'pointer',
          backgroundColor: '#FCFCFC08',
          display: 'inline-flex',
          padding: '8px 12px',
          borderRadius: '12px',
          gap: '4px',
          fontSize: '14px',
          alignItems: 'center',
          color: '#FCFCFC'
        }}
      >
        <ArrowLeft width={16} />Back
      </div>

      {/* token 标题 */}
      <AssetHeader token={token} />

      {/* 概览指标 */}


      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Chart Card */}

          {/* 概览指标 */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
          <div className="bg-[#101823] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase">Yield APY</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-light">20.93%</span>
                  <span className="text-xs bg-green-900 text-green-400 px-1.5 rounded-full">
                    +2.09%
                  </span>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                {['1H', '1D', '1W'].map((t) => (
                  <button
                    key={t}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <YieldChart data={chartData} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <TradeYTCard />
      </div>
    </main>
  );
}
