"use client";
import React, { useState } from 'react';
import PointsMarketCard from './PointsMarketCard';
import PointsHeader from './PointsHeader';

export const categories = [
  { label: 'ALL', key: 'all' },
  { label: 'LSTs', key: 'lsts' },
  { label: 'Stables', key: 'stables' },
  { label: 'Lps', key: 'lps' }];

const markets = [
  {
    id: 'zlp',
    items: ['2x Z0 Points Boos', '2x Nemo Points Boost'],
    name: 'ZLP',
    content: 'ZO Finance',
    icon: '/points/zpl.svg',
    iconRight: '/points/zpl-right.svg',
    pointsMultiplier: '2x Z0 Points Boos, 2x Nemo Points Boost',
    pointsType: 'ZO Points/ZLP',
    pointsPerDay: '~100000 points/Day',
    exposure: '98.11x',
    expiry: '2025-10-22',
    status: 'Coming Soon...',
    multiplierLeft: '2x',
    multiplierRight: '2x',
    leftLabel: 'Nemo',
    rightLabel: 'ZO',
    topBgColor: 'linear-gradient(90deg, #4E1504 0%, #200D02 100%)'
  },
  {
    id: 'vsui',
    items: ['2x Volo Points Boost', '2x Nemo Points Boost'],
    name: 'vSUI',
    content: 'VOLO Liquid Staking',
    icon: '/points/vsui.svg',
    iconRight: '/points/vsui-right.svg',
    pointsMultiplier: '2x Volo Points Boost, 2x Nemo Points Boost',
    pointsType: 'Volo Points/vSUI',
    pointsPerDay: '~100000 pts/Day',
    exposure: '75.82x',
    expiry: '2026-02-30',
    status: 'Coming Soon...',
    multiplierLeft: '2x',
    multiplierRight: '2x',
    leftLabel: 'Nemo',
    rightLabel: 'Volo',
    topBgColor: 'linear-gradient(90deg, #040E2D 0%, #06143E 100%)'
  },
  {
    id: 'sbusdt',
    items: ['2x MMT Bricks Boost', '2x Nemo Points Boost'],
    name: 'sbUSDT-USDC Vault',
    content: 'Momentum',
    icon: '/points/sbusdt.svg',
    iconRight: '/points/sbusdt-right.svg',
    pointsMultiplier: '2x MMT Bricks Boost, 2x Nemo Points Boost',
    pointsType: 'MMT Bricks/Vaults Shares',
    pointsPerDay: '~100000 bricks/Day',
    exposure: '100.32x',
    expiry: '2025-10-22',
    status: 'Coming Soon...',
    multiplierLeft: '2x',
    multiplierRight: '2x',
    leftLabel: 'Nemo',
    rightLabel: 'MMT',
    topBgColor: 'linear-gradient(90deg, #040054 0%, #041442 100%)'
  }
];


export default function PointsPage() {
  const [activeTab, setActiveTab] = useState(categories[0]);

  return (
    <div className="bg-[#080d16] text-white pl-6 pr-6">
      <PointsHeader />
      <div className="flex p-6 pb-20 flex-col items-start gap-6 rounded-3xl bg-white bg-opacity-5">
        <div className="flex gap-8 items-center">
          <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Assets</div>
          <div className="flex space-x-2 text-[12px]">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveTab(category)}
                className={`h-8 px-2 cursor-pointer select-none rounded-[12px]
                    flex items-center justify-center font-[600]
                    transition-colors
                    ${activeTab.key === category.key
                    ? 'bg-gradient-to-r from-white/10 to-white/5 text-white'
                    : 'text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'}
                    `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {markets.map(market => (
              <PointsMarketCard key={market.id} market={market} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{
              height: '266px',
              background: 'url(/points/background1.svg)',
            }}>
              <span className="text-white text-[20px] font-bold leading-[120%] text-center">
                Coming Soon...
              </span>
            </div>
            <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{
              height: '266px',
              background: 'url(/points/background2.svg)',
            }}>
              <span className="text-white text-[20px] font-bold leading-[120%] text-center">
                Coming Soon...
              </span>
            </div>
            <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{
              height: '266px',
              background: 'url(/points/background3.svg)',
            }}>
              <span className="text-white text-[20px] font-bold leading-[120%] text-center">
                Coming Soon...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
