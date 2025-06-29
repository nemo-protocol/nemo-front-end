'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { ArrowUpRight } from 'lucide-react';
import { RankedPortfolioItem, isExpired } from './Assets';
import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import { PyPosition, LpPosition } from '@/hooks/types';
import { formatPortfolioNumber } from '@/lib/utils';

interface MobileCardProps {
  item: RankedPortfolioItem;
  activeTab: {
    label: string;
    key: string;
  };
  pyPositionsMap?: Record<string, {
    ptBalance: string;
    ytBalance: string;
    pyPositions: PyPosition[];
  }>;
  lpPositionsMap: Record<string, {
    lpBalance: string;
    lpPositions: LpPosition[];
  }>;
  marketStates: MarketStateMap;
  ytReward?: Record<string, string>;
  lpReward?: Record<string, string>;
}

export default function MobileCard({
  item,
  activeTab,
  pyPositionsMap,
  lpPositionsMap,
  marketStates,
  ytReward,
  lpReward
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expired = isExpired(item.maturity);

  // 检查是否应该显示此卡片
  const canShow = () => {
    if (activeTab.key === 'all') return true;
    if (activeTab.key === 'pt' && item.listType === 'pt') return true;
    if (activeTab.key === 'yt' && item.listType === 'yt') {
      const reward = new Decimal(ytReward?.[item.id] || 0);
      return (Number(reward) !== 0 || !expired);
    }
    if (activeTab.key === 'lp' && item.listType === 'lp' && lpReward) return true;
    return false;
  };

  if (!canShow()) return null;

  const getBalanceAndValue = () => {
    if (item.listType === 'lp') {
      const balance = new Decimal(lpPositionsMap?.[item.id]?.lpBalance || 0);
      const value = balance.mul(item.lpPrice);
      return { balance, value, price: item.lpPrice };
    }
    if (item.listType === 'yt') {
      const balance = new Decimal(pyPositionsMap?.[item.id]?.ytBalance || 0);
      const value = balance.mul(item.ytPrice);
      return { balance, value, price: item.ytPrice };
    }
    // PT
    const balance = new Decimal(pyPositionsMap?.[item.id]?.ptBalance || 0);
    const value = balance.mul(item.ptPrice);
    return { balance, value, price: item.ptPrice };
  };

  const { balance, value, price } = getBalanceAndValue();

  const getAssetInfo = () => {
    if (item.listType === 'pt') {
      return {
        logo: item.ptTokenLogo,
        name: `PT ${item.coinName}`,
        type: (
          <div className="text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,182,155,0.10)] text-[#17B69B]">
            PRINCIPLE&nbsp;TOKEN
          </div>
        ),
        typeColor: '#17B69B',
        typeBg: 'rgba(23,182,155,0.10)'
      };
    }
    if (item.listType === 'yt') {
      return {
        logo: item.ytTokenLogo,
        name: `YT ${item.coinName}`,
        type: (
          <div className="text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,133,183,0.1)] text-[#1785B7]">
            YIELD&nbsp;TOKEN
          </div>
        ),
        typeColor: '#1785B7',
        typeBg: 'rgba(23,133,183,0.1)'
      };
    }
    // LP
    return {
      logo: item.lpTokenLogo,
      name: `LP ${item.coinName}`,
      type: (
        <div className="text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(149,110,255,0.1)] text-[#956EFF]">
          LIQUIDITY
        </div>
      ),
      typeColor: '#956EFF',
      typeBg: 'rgba(149,110,255,0.1)'
    };
  };

  const assetInfo = getAssetInfo();

  const getIncentiveInfo = () => {
    if (item.listType === 'lp') {
      const totalReward = new Decimal(item.lpTotalReward);
      return Number(totalReward) !== 0 ? totalReward : null;
    }
    return null;
  };

  const getAccruedYield = () => {
    if (item.listType === 'yt') {
      const reward = new Decimal(ytReward?.[item.id] || 0);
      return {
        amount: reward.mul(item.conversionRate),
        value: reward.mul(item.underlyingPrice)
      };
    }
    return null;
  };

  const incentive = getIncentiveInfo();
  const accruedYield = getAccruedYield();

  return (
    <div className="bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] rounded-[12px] p-4 mb-3 last:mb-0">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            {assetInfo.logo && (
              <Image
                src={assetInfo.logo}
                alt=""
                width={36}
                height={36}
                className="shrink-0"
              />
            )}
            <div>
              <div className="text-[14px] font-[550] text-[#FCFCFC] leading-[120%] mb-1">
                {assetInfo.name}
              </div>
              <div className="text-[12px] text-light-gray/40 font-[550] leading-[120%]">
                ${formatPortfolioNumber(value)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[14px] font-[550] text-[#FCFCFC] leading-[120%] mb-1">
              {balance.lt(0.01) && '<'}{formatPortfolioNumber(balance)}
            </div>
            <div className="text-[12px] text-light-gray/40 font-[550] leading-[120%]">
              ~${formatPortfolioNumber(value)}
            </div>
          </div>

          {isExpanded ? (
            <Image
              src="/protfolio/up.svg"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
          ) : (
            <Image
              src="/protfolio/down.svg"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-[18px] bg-[rgba(1, 9, 20, 0.20)] mt-[18px]">
          <div className="grid grid-cols-2 gap-6 mb-6">

            {item.listType === 'yt' && accruedYield && (
              <>
                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">ACCRUED YIELD</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    --
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    --
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">MATURITY</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: '#1785B7' }}>
                    {dayjs(parseInt(item.maturity)).format('YYYY-MM-DD')}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">INCENTIVE</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    --
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    --
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">TYPE</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: assetInfo.typeColor }}>
                    {assetInfo.type}
                  </div>
                </div>
              </>
            )}

            {item.listType === 'pt' && (
              <>
                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">ACCRUED YIELD</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    --
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    --
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">MATURITY</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: '#1785B7' }}>
                    {dayjs(parseInt(item.maturity)).format('YYYY-MM-DD')}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">INCENTIVE</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    --
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    --
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">TYPE</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: assetInfo.typeColor }}>
                    {assetInfo.type}
                  </div>
                </div>
              </>
            )}

            {item.listType === 'lp' && incentive && (
              <>
                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">ACCRUED YIELD</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    --
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    --
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">MATURITY</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: '#1785B7' }}>
                    {dayjs(parseInt(item.maturity)).format('YYYY-MM-DD')}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">INCENTIVE</div>
                  <div className="text-[14px] font-[550] text-[#FCFCFC] mb-1 leading-[120%]">
                    {formatPortfolioNumber(incentive)}
                  </div>
                  <div className="text-[14px] text-light-gray/40 font-[550] tracking-[0.14px] leading-[128%]">
                    ~${formatPortfolioNumber(incentive)}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">TYPE</div>
                  <div className="text-[20px] font-[400] leading-[120%]" style={{ color: assetInfo.typeColor }}>
                    {assetInfo.type}
                  </div>
                </div>
              </>
            )}

          </div>

          <div>
            <div className="text-[12px] text-light-gray/40 mb-3 font-[650] uppercase tracking-[0.12px] leading-[100%]">OTHER</div>
            <Link
              href={
                item.listType === 'pt'
                  ? `/market-detail/${item.id}/${item.coinType}/trade/fixed`
                  : item.listType === 'yt'
                    ? `/market-detail/${item.id}/${item.coinType}/trade/yield`
                    : `/market-detail/${item.id}/${item.coinType}/provide/pool`
              }
              className="inline-flex gap-1 items-center text-[14px] font-[400] text-light-gray/40"
            >
              <ArrowUpRight className="w-4 h-4" />
              Trade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
