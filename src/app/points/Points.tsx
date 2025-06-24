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
    <div className="bg-[#080d16] text-white pl-6 pr-6" style={{ fontFamily: '"Season Serif TRIAL"' }}>
      <PointsHeader />
      <div className="flex p-6 pb-20 flex-col items-start gap-6 rounded-3xl bg-[rgba(252,252,252,0.03)]">
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
        <div className="flex flex-col gap-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            {markets.map(market => (
              <PointsMarketCard key={market.id} market={market} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            <div className="w-full max-w-[413px] h-[240px] relative overflow-hidden">
              <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center w-[413px] h-[266px] aspect-[413.50/266.00] blur-[25px]" style={{
                background: 'url(/points/background1.svg) lightgray 50% / cover no-repeat',
              }}>
              </div>
              <span 
                className="text-center text-[20px] font-[650] leading-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  background: 'linear-gradient(90deg, #FFF 0%, #3F3F3F 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Coming Soon...
              </span>
            </div>
            <div className="w-full max-w-[413px] h-[240px] relative overflow-hidden">
              <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center w-[413px] h-[266px] aspect-[413.50/266.00] blur-[25px]" style={{
                background: 'url(/points/background2.svg) lightgray 50% / cover no-repeat',
              }}>
              </div>
              <span 
                className="text-center text-[20px] font-[650] leading-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  background: 'linear-gradient(90deg, #FFF 0%, #3F3F3F 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Coming Soon...
              </span>
            </div>
            <div className="w-full max-w-[413px] h-[240px] relative overflow-hidden">
              <div className="relative rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center w-[413px] h-[266px] aspect-[413.50/266.00] blur-[25px]" style={{
                background: 'url(/points/background3.svg) lightgray 50% / cover no-repeat',
              }}>
              </div>
              <span 
                className="text-center text-[20px] font-[650] leading-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  background: 'linear-gradient(90deg, #FFF 0%, #3F3F3F 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Coming Soon...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
