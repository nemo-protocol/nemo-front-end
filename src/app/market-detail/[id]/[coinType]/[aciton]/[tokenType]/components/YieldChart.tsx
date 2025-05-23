'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CoinConfig, Granularity } from '@/queries/types/market';
import { useApyHistory } from '@/queries';
import Image from 'next/image';

/* 时间范围 Tab 配置 -------------------------------------------------- */
const TABS: { label: string; granularity: Granularity, seconds: number }[] = [
  { label: '1M', granularity: 'MINUTELY', seconds: 60 * 60 },
  { label: '1H', granularity: 'HOURLY', seconds: 60 * 60 * 60 },
  { label: '1D', granularity: 'DAILY', seconds: 60 * 60 * 24 * 60 },
  { label: '1M', granularity: 'MONTHLY', seconds: 60 * 60 * 24 * 120 },
];

/* tokenType 下拉配置 -------------------------------------------------- */
export type TokenType = 'FIXED' | 'YIELD' | 'POOL';
const TOKEN_TYPES: { label: string; value: TokenType }[] = [
  { label: 'FIXED APY', value: 'FIXED' },
  { label: 'YIELD APY', value: 'YIELD' },
  { label: 'POOL  APY', value: 'POOL' },
];
/* ------------------ 辅助函数 ------------------ */
function formatPercent(num?: string | number, digits = 2) {
  if (num == null) return '—';
  const n = +num;
  if (Number.isNaN(n)) return '—';
  return `${(n * 1).toFixed(digits)}%`;  // *1 兼容字符串科学计数
}

function getArrow(isPositive: boolean) {
  return isPositive ? '▲' : '▼';
}
export default function YieldChart({ coinConfig }: { coinConfig: CoinConfig }) {

  const [activeTab, setActiveTab] = useState(0);
  const [tokenType, setTokenType] = useState<TokenType>('FIXED');


  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const mainMetric = useMemo(() => {
    switch (tokenType) {
      case 'FIXED':
        return {
          label: 'FIXED APY',
          value: formatPercent(coinConfig.fixedApy),
          delta: formatPercent(coinConfig.fixedApyRateChange),
          positive: +coinConfig.fixedApyRateChange >= 0,
        };
      case 'YIELD':
        return {
          label: 'YIELD APY',
          value: formatPercent(coinConfig.yieldApy),
          delta: formatPercent(coinConfig.yieldApyRateChange),
          positive: +coinConfig.yieldApyRateChange >= 0,
        };
      case 'POOL':
        return {
          label: 'POOL APY',
          value: formatPercent(coinConfig.poolApy),
          delta: formatPercent(coinConfig.PoolApyRateChange),
          positive: +coinConfig.PoolApyRateChange >= 0,
        };
      default:
        return { label: '', value: '—', delta: '', positive: true };
    }
  }, [tokenType, coinConfig]);
  useEffect(() => {
    console.log(coinConfig, 'sixu')
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const { granularity, seconds } = TABS[activeTab];

  const { data, isLoading, error } = useApyHistory({
    marketStateId:
      '0x92eaf1588c0acb7d5150be61ef329da4f97ad18ca8ed1ce2e2853ecc81aa397d',
    tokenType,
    granularity,
    seconds,

  });


  const { chartData, yDomain, yTicks, xInterval } = useMemo(() => {
    if (!data?.data?.length)
      return { chartData: [], yDomain: [0, 1], yTicks: [], xInterval: 0 };

    const arr = data.data.map(d => ({
      apy: +d.apy,
      ts: dayjs(d.timeLabel, 'YYYY-MM-DD HH:mm:ss').valueOf(),
    }));
    const apys = arr.map(v => v.apy);
    const min = Math.min(...apys);
    const max = Math.max(...apys);

    const wantTickCount = 7;
    const segmentCount = wantTickCount - 1;
    const rawStep = (max - min) / segmentCount;
    const step = Math.max(0.1, Math.ceil(rawStep * 10) / 10);

    const tickStart = Math.floor(min / step) * step;
    const ticks = Array.from({ length: wantTickCount }, (_, i) =>
      +(tickStart + step * i).toFixed(4),
    );

    const yMin = tickStart - step * 0.5;
    const yMax = tickStart + step * segmentCount + step * 0.5;
    const wantX = 6;
    const interval = Math.max(0, Math.floor(arr.length / wantX) - 1);

    return { chartData: arr, yDomain: [yMin, yMax], yTicks: ticks, xInterval: interval };
  }, [data]);


  // if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-500">{error.message}</p>;

  return (
    <>

      <div className="mb-4 flex items-center justify-between">

        <div className="relative" ref={dropRef}>
          <button
            className="flex text-[#FCFCFC66] cursor-pointer items-center gap-1 text-[12px] font-medium uppercase "
            onClick={() => setOpen(o => !o)}
          >
            {TOKEN_TYPES.find(t => t.value === tokenType)!.label}
            <svg width="10" height="10" viewBox="0 0 20 20">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          <div className="flex items-center mt-2 gap-2">
            <p className="text-[20px] font-[550]">{mainMetric.value}</p>

            {!!mainMetric.delta && (
              <span
                className={`
                  text-xs py-0.5 px-1.5 rounded-full flex items-center gap-1
                  ${mainMetric.positive
                    ? 'bg-[#4CC8771A] text-[#4CC877]'
                    : 'bg-[#FF2E541A] text-[#FF2E54]'}
                `}
              >
                {mainMetric.positive ? '+' : ''}
                {mainMetric.delta}
                <Image
                  src={`/arrow-${mainMetric.positive ? 'up' : 'down'}-right.svg`}
                  alt={""}
                  width={16}
                  height={16}
                  className="shrink-0"
                />

              </span>
            )}
          </div>

          {open && (
            <ul
              className="absolute z-10 mt-0 top-[20px] w-32 rounded-md border border-[#3F3F3F] bg-[#0E1520] backdrop-blur text-[12px] text-[#FCFCFC66] shadow-lg"
            >
              {TOKEN_TYPES.map(opt => (
                <li
                  key={opt.value}
                  onClick={() => {
                    setTokenType(opt.value);
                    setOpen(false);
                  }}
                  className={`cursor-pointer px-3 py-2 hover:bg-white/10`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>


        <div className="flex gap-3 text-[12px]">
          {TABS.map((t, i) => (
            <div
              key={t.label + i}
              onClick={() => setActiveTab(i)}
              className={`h-8 w-8 cursor-pointer select-none rounded-[12px]
                          flex items-center justify-center

                          ${activeTab === i
                            ? 'bg-gradient-to-r from-white/10 to-white/5 text-white'
                            : 'text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'}
                          `}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>


      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ left: 16, right: 0 }}>
          <CartesianGrid stroke="rgba(252,252,252,0.1)" vertical={false} />
          <XAxis
            dataKey="ts"
            interval={xInterval}
            tickFormatter={v => dayjs(v).format('DD.MM')}
            tick={{ fill: 'rgba(252,252,252,0.4)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 16, right: 0 }}
          />
          <YAxis
            orientation="right"
            domain={yDomain as [number, number]}
            ticks={yTicks}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(252,252,252,0.4)', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: 'none' }}
            labelFormatter={v => dayjs(v).format('YYYY-MM-DD HH:mm')}
            formatter={(v: number) => `${v.toFixed(6)}%`}
          />
          <Line
            type="stepAfter"
            dataKey="apy"
            stroke="#1785B7"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
} 