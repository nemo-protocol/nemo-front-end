"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

interface Market {
  id: string;
  name: string;
  content: string;
  icon: string;
  iconRight: string;
  items: string[];
  pointsMultiplier: string;
  pointsType: string;
  pointsPerDay: string;
  exposure: string;
  expiry: string;
  status: string;
  multiplierLeft: string;
  multiplierRight: string;
  leftLabel: string;
  rightLabel: string;
  topBgColor: string;
}

export default function PointsMarketCard({ market }: { market: Market }) {
  const router = useRouter();
  const getAccentColor = (id: string) => {
    switch (id) {
      case 'zlp':
        return '#FF7B1A';
      case 'vsui':
        return '#3B82F6';
      case 'sbusdt':
        return '#6B7280';
      default:
        return '#FF7B1A';
    }
  };

  const getBoostBadgeStyle = (id: string) => {
    switch (id) {
      case 'zlp':
        return {
          backgroundColor: '#1D0B00',
          color: '#E07637'
        };
      case 'vsui':
        return {
          backgroundColor: '#10286F',
          color: '#718EE1'
        };
      case 'sbusdt':
        return {
          backgroundColor: '#10286F',
          color: '#718EE1'
        };
      default:
        return {
          backgroundColor: '#1D0B00',
          color: '#E07637'
        };
    }
  };

  const getMultiplierGradient = (id: string) => {
    switch (id) {
      case 'zlp':
        return 'linear-gradient(329deg, #EB6F22 8.49%, #EFFAF9 100%)';
      case 'vsui':
      case 'sbusdt':
        return 'linear-gradient(329deg, #124EFF 8.49%, #EFFAF9 100%)';
      default:
        return 'linear-gradient(329deg, #EB6F22 8.49%, #EFFAF9 100%)';
    }
  };

  const handleCardClick = () => {
    router.push(`/points/${market.id}`);
  };

  return (
    <div 
      className="relative rounded-3xl overflow-hidden border border-transparent hover:border-[#868686] hover:bg-[#13181B] transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div 
        className="relative p-6 pb-8"
        style={{ background: market.topBgColor }}
      >
        <div className="absolute -top-4 -right-4 w-32 h-32 opacity-15 pointer-events-none">
          <img src={market.iconRight} alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative flex flex-wrap gap-2 mb-8">
          {market.items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center rounded-[26px] px-[10px] py-[6px] gap-[5px] text-sm font-medium leading-[120%]"
              style={getBoostBadgeStyle(market.id)}
            >
              <span className="truncate">{item}</span>
              <img src="/points/star.svg" alt="star" className="w-4 h-4 flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              <img src={market.icon} alt={market.name} className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-white text-[20px] font-medium mb-1">{market.name}</h3>
              <p className="text-[#A1A3A4] text-sm font-medium">{market.content}</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-right">
              <div 
                className="text-[28px] font-medium leading-[120%] underline mb-1"
                style={{
                  background: getMultiplierGradient(market.id),
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {market.multiplierLeft}
              </div>
              <div className="text-[#A1A3A4] text-sm font-medium leading-[145%]">
                {market.leftLabel}
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-[28px] font-medium leading-[120%] underline mb-1"
                style={{
                  background: getMultiplierGradient(market.id),
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {market.multiplierRight}
              </div>
              <div className="text-[#A1A3A4] text-sm font-medium leading-[145%]">
                {market.rightLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#13181B] p-6 rounded-b-2xl">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[#A1A3A4] text-sm font-medium leading-[120%]">{market.pointsType}</p>
          <p className="text-white text-sm font-medium leading-[120%] text-right">{market.pointsPerDay}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-[#A1A3A4] text-sm font-medium leading-[120%]">Effective Exposure</p>
          <p className="text-white text-sm font-medium leading-[120%] text-right">{market.exposure}</p>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-[#A1A3A4] text-sm font-medium leading-[120%]">Maturity</p>
          <p className="text-white text-sm font-medium leading-[120%] text-right">{market.expiry}</p>
        </div>
      </div>
    </div>
  );
}