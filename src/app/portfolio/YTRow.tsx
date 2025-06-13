// src/components/portfolio/YTRow.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import Decimal from 'decimal.js';
import { BaseRowProps } from '@/types/PortfolioRows';
import { RankedPortfolioItem, categories, isExpired } from './Assets';
import { PyPosition } from '@/hooks/types';
import { formatPortfolioNumber, formatTVL } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import dayjs from 'dayjs';

export default function YTRow({
    item,
    activeTab,
    pyPositionsMap,
    ytReward,
}: BaseRowProps & {
    item: RankedPortfolioItem;
    activeTab: {
        label: string
        key: string
    };
    pyPositionsMap?: Record<string, {
        ptBalance: string;
        ytBalance: string;
        pyPositions: PyPosition[];
    }>
    ytReward?: Record<string, string>;
}) {
    const expired = isExpired(item.maturity);
    const canShow =
        (activeTab === categories[0] || activeTab === categories[2]) &&
        item.listType === 'yt';

    if (!canShow) return null;

    const balance = new Decimal(pyPositionsMap?.[item.id]?.ytBalance || 0);
    const reward = new Decimal(ytReward?.[item.id] || 0);

    return (
        <tr>
            <td className="py-3 text-[20px] font-[500] text-[#FCFCFC] flex gap-x-2">
                <Image src={item.ytTokenLogo} alt="" width={24} height={24} className="shrink-0" />
                YT {item.coinName}
            </td>

            <td className="py-3">
                <div className="text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,133,183,0.1)] text-[#1785B7]">
                    YIELD&nbsp;TOKEN
                </div>
            </td>

            <td className="py-3">
                <div
                    className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex ${expired
                            ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]'
                            : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'
                        }`}
                >
                    {dayjs(parseInt(item.maturity)).format('YYYY-MM-DD')}
                </div>
            </td>

            <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">{formatTVL(item.ytPrice)}</td>

            <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                <span>{balance.lt(0.01) && '<'}{formatPortfolioNumber(balance)}</span>
                <span className="text-[rgba(252,252,252,0.4)] ml-2">
                    ~{balance.mul(item.ytPrice).lt(0.01) && '<'}$
                    {formatPortfolioNumber(balance.mul(item.ytPrice))}
                </span>
            </td>

            <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">—</td>

            <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                <span>{reward.mul(item.conversionRate).lt(0.01) && '<'}{formatPortfolioNumber(reward.mul(item.conversionRate))}</span>
                <span className="text-[rgba(252,252,252,0.4)] ml-2">
                    ~{reward.mul(item.underlyingPrice).lt(0.01) && '<'}$
                    {formatPortfolioNumber(reward.mul(item.underlyingPrice))}
                </span>
            </td>

            <td className="py-3 text-[14px] text-right font-[500]">
                <div className="cursor-pointer px-2.5 py-1.5 items-center rounded-[16px] transition-colors duration-200 inline-flex text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)]">
                    <Link href={`/market-detail/${item.id}/${item.coinType}/trade/yield`} className="inline-flex gap-1 items-center">
                        <ArrowUpRight className="w-4 h-4" />
                        Trade
                    </Link>
                </div>
            </td>
        </tr>
    );
}