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
  // const getAccentColor = (id: string) => {
  //   switch (id) {
  //     case 'zlp':
  //       return '#FF7B1A';
  //     case 'vsui':
  //       return '#3B82F6';
  //     case 'sbusdt':
  //       return '#6B7280';
  //     default:
  //       return '#FF7B1A';
  //   }
  // };

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
      className="relative rounded-2xl overflow-hidden bg-[#13181B] border border-transparent hover:border-[#868686] transition-all duration-300 cursor-pointer flex flex-col items-center gap-2 self-stretch p-[1px_1px_17px_1px] w-full max-w-[413px]"
      onClick={handleCardClick}
    >
      <div 
        className="relative px-4 py-3 rounded-t-2xl border-b border-[#252A2D] h-[130px] w-full flex flex-col justify-between"
        style={{ background: market.topBgColor }}
      >
        <div className="absolute top-0 right-0 bottom-0 opacity-50 pointer-events-none">
          <img src={market.iconRight} alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative flex gap-2">
          {market.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center rounded-[26px] px-[10px] py-[6px] gap-[4px] text-[14px] font-[550] leading-[120%]"
              style={getBoostBadgeStyle(market.id)}
            >
              <span className="truncate">{item}</span>
              <img src={`/points/star-${market.id}.svg`} alt="star" className="w-[14px] h-[14px] flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-16 h-16">
              <img src={market.icon} alt={market.name} className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-white text-[20px] font-[550] mb-1">{market.name}</h3>
              <p className="text-[#A1A3A4] text-[14px] font-[550]">{market.content}</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-right">
              <div 
                className="text-right text-[28px] font-[550] leading-[120%] underline"
                style={{
                  background: getMultiplierGradient(market.id),
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textDecorationStyle: 'solid',
                  textDecorationSkipInk: 'auto',
                  textDecorationThickness: 'auto',
                  textUnderlineOffset: 'auto',
                  textUnderlinePosition: 'from-font'
                }}
              >
                {market.multiplierLeft}
              </div>
              <div className="text-[#A1A3A4] text-[14px] font-[550] leading-[145%]">
                {market.leftLabel}
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-right text-[28px] font-[550] leading-[120%] underline"
                style={{
                  background: getMultiplierGradient(market.id),
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textDecorationStyle: 'solid',
                  textDecorationSkipInk: 'auto',
                  textDecorationThickness: 'auto',
                  textUnderlineOffset: 'auto',
                  textUnderlinePosition: 'from-font'
                }}
              >
                {market.multiplierRight}
              </div>
              <div className="text-[#A1A3A4] text-[14px] font-[550] leading-[145%]">
                {market.rightLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-b-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[#A1A3A4] text-[14px] font-[550] leading-[120%]">{market.pointsType}</p>
          <p className="text-white text-[14px] font-[550] leading-[120%] text-right">{market.pointsPerDay}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-[#A1A3A4] text-[14px] font-[550] leading-[120%]">Effective Exposure</p>
          <p className="text-white text-[14px] font-[550] leading-[120%] text-right">{market.exposure}</p>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-[#A1A3A4] text-[14px] font-[550] leading-[120%]">Maturity</p>
          <p className="text-white text-[14px] font-[550] leading-[120%] text-right">{market.expiry}</p>
        </div>
      </div>
    </div>
  );
}