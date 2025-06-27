
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





export const categories = [
    { label: 'ALL', key: 'all' },
    { label: 'LP VAULTS', key: 'pt' },
    { label: 'SINGLE TOKEN VALUTS', key: 'yt' }
];


type SortKey =
    | 'default'
    | 'value'
    | 'maturity'
    | 'incentive'
    | 'accruedYield'

type SortOrder = 'asc' | 'desc'
export interface VaultRow {
    key: string
    name: string
    category: 'pt' | 'yt'                        // 用来配合顶部 Tab 过滤
    tokens: string[]                             // 代币 icon 路径
    tvl: number
    apy: number
    position?: number                            // 用户仓位
    earnings?: number                            // 用户收益
    source: 'Momentum' | '其他协议'
}
const MOCK_DATA: VaultRow[] = [
    {
        key: '1',
        name: 'SUI-haSUI',
        category: 'pt',
        tokens: ['/icons/sui.svg', '/icons/hasui.svg'],
        tvl: 3_200_000,
        apy: 0.1689,
        position: 0,
        earnings: 0,
        source: 'Momentum',
    },
    {
        key: '2',
        name: 'SUI-haSUI',
        category: 'pt',
        tokens: ['/icons/sui.svg', '/icons/hasui.svg'],
        tvl: 230_230,
        apy: 0.1689,
        source: 'Momentum',
    },

]


export default function VaultsPositon() {
    const [activeTab, setActiveTab] = useState(categories[0])
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState<'default' | 'apy' | 'tvl'>('default')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')


    const list = useMemo(() => {
        let data = MOCK_DATA


        if (activeTab.key !== 'all')
            data = data.filter(d => d.category === activeTab.key)

        // 搜索框模糊匹配
        if (search.trim())
            data = data.filter(d =>
                d.name.toLowerCase().includes(search.trim().toLowerCase())
            )

        // 排序
        if (sortKey !== 'default') {
            data = [...data].sort((a, b) => {
                const v1 = sortKey === 'apy' ? a.apy : a.tvl
                const v2 = sortKey === 'apy' ? b.apy : b.tvl
                return sortOrder === 'asc' ? v1 - v2 : v2 - v1
            })
        }
        return data
    }, [activeTab, search, sortKey, sortOrder])

    const loading = false
    const empty = !loading && list.length === 0

    return (
        <div className="mt-2 mx-7.5 bg-[rgba(252,252,252,0.03)] rounded-[24px] py-6 px-6">
            {/* Tabs + 搜索框 */}
            <div className="flex items-center gap-8">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Positions</div>
                <div className="flex space-x-2 text-[12px]">
                    {categories.map(c => (
                        <button
                            key={c.key}
                            onClick={() => setActiveTab(c)}
                            className={`h-8 px-3 rounded-[12px] font-[600] transition-colors
                ${activeTab.key === c.key
                                    ? 'bg-gradient-to-r from-white/10 to-white/5 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {/* 搜索框占位：flex-grow 后靠右 */}
                <div className="ml-auto relative">
                    <input
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 w-40 rounded-[12px] bg-[#1E262A] pl-7 pr-3
              text-xs text-white placeholder:text-white/40 focus:outline-none"
                    />

                </div>
            </div>

            {/* 表格 */}
            <div className="w-full mt-6">
                <table className="w-max min-w-[calc(100vw-128px)] border-collapse border-spacing-y-0.5">
                    <thead className="text-white/60 text-[12px] font-[600]">
                        <tr>
                            <th className="py-2 w-[15%] text-left">VAULTS</th>
                            <th className="py-2 w-[15%] text-left cursor-pointer"
                                onClick={() => toggleSort('tvl')}>
                                TVL
                            </th>
                            <th className="py-2 w-[13%] text-left cursor-pointer"
                                onClick={() => toggleSort('apy')}>
                                VAULT&nbsp;APY&nbsp;
                                {/* 你的 SortIcon 组件自行复用 */}
                            </th>
                            <th className="py-2 w-[10%] text-left">YOUR POSITION</th>
                            <th className="py-2 w-[13%] text-left">YOUR EARNINGS</th>
                            <th className="py-2 w-[12%] text-left">SOURCE PROTOCOL</th>
                            <th className="py-2 text-left"></th>
                        </tr>
                    </thead>

                    <tbody className="bg-[#0F151C]">
                        {!loading && list.map((item, idx) => (
                            <tr key={item.key} className="h-[48px]">
                                {/* VAULT 名称 + icon */}
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-1">
                                            {item.tokens.map((icon, i) => (
                                                <img
                                                    key={i}
                                                    src={icon}
                                                    alt=""
                                                    width={18}
                                                    height={18}
                                                    className="rounded-full border border-[#0F151C]"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-white">{item.name}</span>
                                    </div>
                                </td>

                                {/* TVL */}
                                <td className="text-sm text-white">{formatTVL(item.tvl.toString())}</td>

                                {/* APY */}
                                <td className="text-sm text-white">
                                    {(item.apy * 100).toFixed(2)}%
                                </td>

                                {/* 用户仓位 / 收益 */}
                                <td className="text-sm text-white/80">
                                    {item.position ? formatTVL(item.position.toString()) : '-'}
                                </td>
                                <td className="text-sm text-white/80">
                                    {item.earnings ? formatTVL(item.earnings.toString()) : '-'}
                                </td>

                                {/* Source Protocol */}
                                <td className="text-sm">
                                    <span className="flex items-center gap-1 text-white">
                                        <Image
                                            src="/icons/momentum.svg"
                                            alt=""
                                            width={16}
                                            height={16}
                                        />
                                        {item.source}
                                    </span>
                                </td>

                                {/* Deposit 按钮 */}
                                <td>
                                    <button
                                        className="h-8 w-[88px] rounded-[12px]
                      bg-gradient-to-r from-[#266EFF] to-[#11C7FF]
                      text-xs font-semibold text-white hover:opacity-80"
                                    >
                                        Deposit
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* skeleton / empty */}
                        {loading &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)]" />
                            ))}
                    </tbody>
                </table>

                {empty && (
                    <div className="w-full flex justify-center py-8">
                        <EmptyData />
                    </div>
                )}
            </div>
        </div>
    )

    // ===== 工具函数：排序 toggler =====
    function toggleSort(key: 'apy' | 'tvl') {
        if (sortKey !== key) {
            setSortKey(key)
            setSortOrder('desc')
            return
        }
        if (sortOrder === 'desc') setSortOrder('asc')
        else setSortKey('default')
    }
}