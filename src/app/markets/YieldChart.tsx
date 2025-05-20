'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useApyHistory } from '@/hooks/useApyHistory';

const TABS = [
  { label: '1M', granularity: 'MINUTELY', seconds: 60 * 60 },
  { label: '1H', granularity: 'HOURLY', seconds: 60 * 60 * 60 },
  { label: '1D', granularity: 'DAILY', seconds: 60 * 60 * 24 * 60 },
  { label: '1M', granularity: 'MONTHLY', seconds: 60 * 60 * 24 * 120 },
];

export default function YieldChart() {
  const [active, setActive] = useState(0);
  const now = Math.floor(Date.now() / 1000);
  const { granularity, seconds } = TABS[active];

  /* ----------------- 拉数据 ----------------- */
  const { data, loading, error } = useApyHistory({
    marketStateId:
      '0x92eaf1588c0acb7d5150be61ef329da4f97ad18ca8ed1ce2e2853ecc81aa397d',
    tokenType: 'PT',
    granularity,
    startTime: now - seconds,
    endTime: now,
  });

  /* ----------------- 处理数据 ----------------- */
  const { chartData, yDomain, xInterval } = useMemo(() => {
    if (!data?.data?.length) return { chartData: [], yDomain: [0, 1], xInterval: 0 };

    const arr = data.data.map(d => ({
      apy: +d.apy,
      ts: dayjs(d.timeLabel, 'YYYY-MM-DD HH:mm:ss').valueOf(),
    }));

    const apys = arr.map(v => v.apy);
    const domain = [Math.min(...apys), Math.max(...apys)];

    const wantLabelCount = 6;
    const interval = Math.max(0, Math.floor(arr.length / wantLabelCount) - 1);

    return { chartData: arr, yDomain: domain, xInterval: interval };
  }, [data]);

  /* ----------------- UI ----------------- */
  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <>
      {/* 头部 */}
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
          {TABS.map((t, i) => (
            <div
              key={t.label}
              className={`w-8 h-8 flex items-center justify-center rounded-full
                         ${active === i ? 'bg-slate-700' : ''}`}
              onClick={() => setActive(i)}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ left: 16, right: 0 }}>
          <CartesianGrid stroke="rgba(252, 252, 252, 0.10)" vertical={false} />
          <XAxis
            dataKey="ts"
            interval={xInterval}
            tickFormatter={v => dayjs(v).format('DD.MM')}
            tick={{ fill: 'rgba(252, 252, 252, 0.40)', fontSize: 14 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 16, right: 0 }}      // ← 防止最左侧被裁
          />
          <YAxis
            orientation="right"
            domain={yDomain as [number, number]}
            tickCount={6}                         // ← 控制 Y 轴刻度数
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(252, 252, 252, 0.40)', fontSize: 14 }}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: 'none' }}
            labelFormatter={v => dayjs(v).format('YYYY-MM-DD HH:mm')}
            formatter={(v: number) => `${v.toFixed(6)}%`}
          />
          <Line type="stepAfter" dataKey="apy" stroke="#1785B7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
