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

export function getMaturityStat(maturityMs?: string | number) {
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

  return (
    <div className="mt-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6 w-full"
        >
          <p className="text-[12px] tracking-widest text-[#FCFCFC66] uppercase mb-4">
            {stat.label}
          </p>

          <p className="text-[20px] text-[#FCFCFC] font-[550] mb-1">{stat.value}</p>

          {(!!stat.delta && index !== 3) ? (
            <span
              className={`text-xs inline-flex py-0.5 px-1.5 rounded-[8px]
                ${stat.deltaPositive
                  ? 'bg-[#4CC8771A] text-[#4CC877]'
                  : 'bg-[#FF2E541A] text-[#FF2E54]'}`}
            >
              {stat.delta}
              <Image
                src={`/arrow-${stat.deltaPositive ? 'up' : 'down'}-right.svg`}
                alt={""}
                width={16}
                height={16}
                className="shrink-0"
              />

            </span>
          ) : <span
            className={`text-xs inline-flex py-0.5 px-1.5 rounded-[8px] bg-[#FF88001A] text-[#FF8800]`}
               
          >
            {stat.delta}
           

          </span>}
        </div>
      ))}
    </div>
  );
} 