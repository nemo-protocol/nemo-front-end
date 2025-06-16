
"use client"
import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import { PyPosition, LpPosition, MarketState } from '@/hooks/types';
import { PortfolioItem } from '@/queries/types/market';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import { formatDecimalValue, formatPortfolioNumber, formatTVL } from '@/lib/utils';
import Decimal from 'decimal.js';
import { ArrowUpRight, Router } from 'lucide-react';
import Link from 'next/link';
import EmptyData from '@/components/ui/empty';
import PTRow from './PTRow';
import YTRow from './YTRow';
import LPRow from './LPRow';
import { useWallet } from '@nemoprotocol/wallet-kit';

export const isExpired = (maturityTime: string) => {
    return dayjs().isAfter(dayjs(parseInt(maturityTime)));
};

export type ListOrigin = 'pt' | 'yt' | 'lp'

export interface RankedPortfolioItem extends PortfolioItem {
    lpTotalReward: number;
    listType: ListOrigin;
    ytTotalReward: number;
}


export const categories = [
    { label: 'ALL', key: 'all' },
    { label: 'PRINCIPLE TOKEN', key: 'pt' },
    { label: 'YIELD TOKEN', key: 'yt' },
    { label: 'LIQUIDITY', key: 'lp' }];

interface AssetsParams {
    filteredLists: {
        pt: PortfolioItem[];
        yt: PortfolioItem[];
        lp: PortfolioItem[];
    }
    lpPositionsMap: Record<string, {
        lpBalance: string;
        lpPositions: LpPosition[];
    }>
    pyPositionsMap?: Record<string, {
        ptBalance: string;
        ytBalance: string;
        pyPositions: PyPosition[];
    }>
    marketStates: MarketStateMap;
    ytReward?: Record<string, string>
    lpReward?: Record<string, string>
    loading: boolean
}
type SortKey =
    | 'default'
    | 'value'
    | 'maturity'
    | 'incentive'
    | 'accruedYield'

type SortOrder = 'asc' | 'desc'
export default function Assets({
    filteredLists,
    pyPositionsMap,
    lpPositionsMap,
    marketStates,
    ytReward,
    lpReward,
    loading
}: AssetsParams) {
    const [activeTab, setActiveTab] = useState(categories[0]);
    const [list, setList] = useState<RankedPortfolioItem[]>([])
    const [empty, setEmpty] = useState(false)
    const [sortKey, setSortKey] = useState<SortKey>('default')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const toggleSort = (key: Exclude<SortKey, 'default'>) => {
        if (sortKey !== key) {
            setSortKey(key)
            setSortOrder('desc')
            return
        }

        if (sortOrder === 'desc') {
            setSortOrder('asc')
        } else {
            setSortKey('default')
            setSortOrder('desc')
        }
    }
    const SortIcon = ({ column }: { column: Exclude<SortKey, 'default'> }) => {

        if (sortKey !== column)
            return (
                <Image
                    src="/sorter.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="inline-block mb-1"
                />
            )
        if (sortOrder === 'desc')
            return (
                ' ↓'
            )
        return (
            ' ↑'
        )
    }

    const sortedList = useMemo(() => {
        const flat: RankedPortfolioItem[] = (['pt', 'yt', 'lp'] as ListOrigin[])
            .flatMap((key) =>
                filteredLists[key].map((item) => {
                    let totalReward = 0
                    if (lpReward && key == 'lp') {
                        marketStates[item.marketStateId]?.rewardMetrics.forEach(rewardMetric => {
                            totalReward = totalReward + Number(lpReward[item.id + rewardMetric.tokenName]) * Number(rewardMetric.tokenPrice)
                        })
                    }
                    return ({
                        ...item,
                        listType: key,
                        lpTotalReward: totalReward,
                        ytTotalReward: key == 'yt' ? Number(new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice)) : 0
                    })
                })
            )
        const calcValue = (p: RankedPortfolioItem) => {
            if (p.listType === 'lp')
                return new Decimal(lpPositionsMap?.[p.id]?.lpBalance || 0).mul(
                    p.lpPrice
                )
            if (p.listType === 'yt')
                return new Decimal(pyPositionsMap?.[p.id]?.ytBalance || 0).mul(
                    p.ytPrice
                )
            return new Decimal(pyPositionsMap?.[p.id]?.ptBalance || 0).mul(p.ptPrice)
        }


        const cmp = (a: RankedPortfolioItem, b: RankedPortfolioItem) => {
            // ---------- 默认：过期优先 → 价值降序 ----------
            if (sortKey === 'default') {
                const aExp = isExpired(a.maturity)
                const bExp = isExpired(b.maturity)
                if (aExp && !bExp) return -1
                if (!aExp && bExp) return 1
                return calcValue(b).comparedTo(calcValue(a))
            }

            // ---------- 价值 ----------
            if (sortKey === 'value') {
                const res = calcValue(a).comparedTo(calcValue(b))
                return sortOrder === 'asc' ? res : -res
            }

            // ---------- 到期 ----------
            if (sortKey === 'maturity') {
                const aExp = isExpired(a.maturity)
                const bExp = isExpired(b.maturity)
                if (aExp !== bExp)
                    return sortOrder === 'asc' ? (aExp ? -1 : 1) : aExp ? 1 : -1

                const res = Number(a.maturity) - Number(b.maturity)
                return sortOrder === 'asc' ? res : -res
            }

            // ---------- INCENTIVE（LP 奖励） ----------
            if (sortKey === 'incentive') {
                const res = new Decimal(a.lpTotalReward)
                    .comparedTo(new Decimal(b.lpTotalReward))
                return sortOrder === 'asc' ? res : -res
            }

            // ---------- ACCRUED YIELD（YT 累计收益） ----------
            if (sortKey === 'accruedYield') {
                const res = new Decimal(a.ytTotalReward)
                    .comparedTo(new Decimal(b.ytTotalReward))
                return sortOrder === 'asc' ? res : -res
            }

            return 0
        }

        return flat.sort(cmp)
    }, [
        filteredLists,
        lpPositionsMap,
        pyPositionsMap,
        sortKey,
        sortOrder,
        lpReward,
        ytReward
    ])

    useEffect(() => {
        if ((!sortedList || sortedList.length === 0) && !loading) {
            setEmpty(true);
            return;
        }
        const shouldBeEmpty =
            activeTab.key !== 'all' &&
            sortedList.every(item => item.listType !== activeTab.key);

        console.log(sortedList, shouldBeEmpty)
        setEmpty(shouldBeEmpty);
    }, [activeTab, sortedList]);

    return (
        <div className="mt-2 mx-7.5 px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">
            {/* Tabs */}
            <div className="flex gap-8 items-center">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Assets</div>
                <div className="flex space-x-2 text-[12px]">
                    {categories.map((category) => (
                        <button
                            key={category.key}
                            onClick={() => setActiveTab(category)}
                            className={`h-8 px-2 cursor-pointer select-none rounded-[12px]
                        flex items-center justify-center font-[600]

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
            {/* Assets Table */}
            <div className='w-full mt-6'>
                <table className={`w-max min-w-[calc(100vw-128px)] border-collapse  border-separate ${loading ? 'border-spacing-y-4' : "border-spacing-y-0.5"}`}>
                    <thead className="text-white/60">
                        <tr>
                            <th className="py-2  w-[15%] text-left text-[12px] font-[600]">ASSET</th>
                            <th className="py-2  w-[15%] text-left text-[12px] font-[600]">TYPE</th>
                            <th className="py-2  w-[13%] text-left text-[12px] font-[600] cursor-pointer select-none"
                                onClick={() => toggleSort('maturity')}>
                                MATURITY
                                <SortIcon column="maturity" />
                            </th>
                            <th className="py-2  w-[10%] text-left text-[12px] font-[600]">PRICE</th>
                            <th className="py-2 w-[13%] text-left text-[12px] font-[600] cursor-pointer select-none"
                                onClick={() => toggleSort('value')}>
                                AMOUNT
                                <SortIcon column="value" />
                            </th>
                            <th className="py-2 w-[12%] text-left text-[12px] font-[600] cursor-pointer select-none"
                                onClick={() => toggleSort('incentive')}>
                                INCENTIVE
                                <SortIcon column="incentive" /></th>
                            <th className="py-2 text-left text-[12px] font-[600]  cursor-pointer select-none"
                                onClick={() => toggleSort('accruedYield')}>
                                ACCRUED YIELD
                                <SortIcon column="accruedYield" /></th>
                            <th className="py-2 text-left text-[12px] font-[600]"></th>

                        </tr>
                    </thead>
                    <tbody className="bg-[#0f151c] ">
                        {!loading && sortedList.map((item, index) => {
                            switch (item.listType) {
                                case 'pt':
                                    return (
                                        <PTRow
                                            key={index}
                                            activeTab={activeTab}
                                            item={item}
                                            pyPositionsMap={pyPositionsMap}
                                            marketStates={marketStates}
                                        />
                                    );
                                case 'yt':
                                    return (
                                        <YTRow
                                            key={index}
                                            activeTab={activeTab}
                                            item={item}
                                            pyPositionsMap={pyPositionsMap}
                                            ytReward={ytReward}
                                        />
                                    );
                                case 'lp':
                                    return (
                                        <LPRow
                                            key={index}
                                            activeTab={activeTab}
                                            item={item}
                                            lpPositionsMap={lpPositionsMap}
                                            lpReward={lpReward}
                                            marketStates={marketStates}
                                        />
                                    );
                                default:
                                    return null;
                            }
                        })}
                        {(loading) && [0, 0, 0, 0, 0, 0].map((item, index) => (
                            <tr key={index} className="w-full h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4 overflow-hidden">
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>

                </table>
                <div className='w-full flex items-center'>{(empty) && <EmptyData />}</div>
            </div>
        </div >
    );
}
