'use client';

import dayjs from 'dayjs';
import Image from 'next/image';
import { CoinConfig } from '@/queries/types/market';
import { MarketStat } from '@/types/types';

type Props = { coinConfig: CoinConfig };

function formatUSD(num: string | number | undefined) {
  if (num == null) return '—';
  const n = +num;
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact', // 30.1M、6.9T …
    maximumFractionDigits: 2,
  });
}

function formatPercent(num: string | number | undefined, opts?: { signed?: boolean }) {
  if (num == null) return '—';
  const n = +num;
  if (isNaN(n)) return '—';
  const sign = opts?.signed ? (n >= 0 ? '+' : '') : '';
  return `${sign}${n.toFixed(2)}%`;
}

function getMaturityStat(maturityMs?: string | number) {
  if (!maturityMs) {
    return { value: '—', delta: '—' };
  }
  const ts = +maturityMs;
  if (Number.isNaN(ts)) return { value: '—', delta: '—' };

  const days = Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
  return {
    value: `${days} Days`,
    delta: dayjs(ts).format('YYYY-MM-DD'),
  };
}

export default function StatCard({ coinConfig }: Props) {
  /* 1. 把 coinConfig 映射成统一结构 */
  const stats: MarketStat[] = [
    {
      label: 'Liquidity',
      value: formatUSD(coinConfig.liquidity),
      delta: formatPercent(coinConfig.liquidityRateChange, { signed: true }),
      deltaPositive: +coinConfig.liquidityRateChange >= 0,
    },
    {
      label: '24h Volume',
      value: formatUSD(coinConfig.liquidity),
      delta: formatPercent(coinConfig.volumeRateChange, { signed: true }),
      deltaPositive: +coinConfig.volumeRateChange >= 0,
    },
    {
      label: 'Yield APY',
      value: formatPercent(coinConfig.fixedApy),
      delta: formatPercent(coinConfig.fixedApyRateChange, { signed: true }),
      deltaPositive: +coinConfig.fixedApyRateChange >= 0,
    },
    (() => {
      const m = getMaturityStat(coinConfig.maturity);
      return {
        label: 'Maturity',
        value: m.value,
        delta: m.delta,
        deltaPositive: true,
      };
    })(),
  ];

  /* 2. 渲染 */
  return (
    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-[#101823] rounded-xl p-5 w-full"
        >
          <p className="text-xs tracking-widest text-slate-400 uppercase mb-1">
            {stat.label}
          </p>

          <p className="text-xl font-medium mb-1">{stat.value}</p>

          {!!stat.delta && (
            <span
              className={`text-xs py-0.5 px-1.5 rounded-full
                ${stat.deltaPositive
                  ? 'bg-green-900 text-green-400'
                  : 'bg-red-900 text-red-400'}`}
            >
              {stat.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
