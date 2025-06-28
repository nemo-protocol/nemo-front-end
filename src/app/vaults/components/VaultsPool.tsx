
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
import { VaultInfo } from '@/hooks/useUserVaultInfo';





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



export default function VaultsPool({ vaults }: {
    vaults?: VaultInfo[]
}) {
    const [activeTab, setActiveTab] = useState(categories[0])
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState<'default' | 'apy' | 'tvl'>('default')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')


    const list = useMemo(() => {
        if (!vaults)
            return
        let data = vaults


        if (activeTab.key !== 'all')
            data = data.filter(d => d.apy === activeTab.key)

        // 搜索框模糊匹配

        // 排序
        // if (sortKey !== 'default') {
        //     data = [...data].sort((a, b) => {
        //         const v1 = sortKey === 'apy' ? a.apy : a.tvl
        //         const v2 = sortKey === 'apy' ? b.apy : b.tvl
        //         return sortOrder === 'asc' ? v1 - v2 : v2 - v1
        //     })
        // }
        return data
    }, [activeTab, search, sortKey, sortOrder])

    const loading = false
    const empty = !loading && list?.length === 0

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

                <div className="ml-auto relative">
                    <input
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 w-40 rounded-[12px] bg-[#1E262A] pl-7 pr-3
              text-xs text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <Image
                        src="/assets/images/vaults/vault-search.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70"
                    />
                </div>
            </div>

            {/* 表格 */}
            <div className="w-full mt-6">
                <table className="w-max min-w-[calc(100vw-128px)] border-collapse border-spacing-y-0.5">
                    <thead className="text-white/60 text-[12px] font-[600]">
                        <tr>
                            <th className="py-2 w-[18%] text-left">VAULTS</th>
                            <th className="py-2 w-[10%] text-left cursor-pointer"
                                onClick={() => toggleSort('tvl')}>
                                TVL
                            </th>
                            <th className="py-2 w-[10%] text-left">APY</th>

                            <th className="py-2 w-[20%] text-left cursor-pointer"
                                onClick={() => toggleSort('apy')}>
                                YOUR POSITION
                            </th>
                            <th className="py-2 w-[13%] text-left">YOUR EARNINGS</th>
                            <th className="py-2 w-[12%] text-left">SOURCE PROTOCOL</th>
                            <th className="py-2 text-left"></th>
                        </tr>
                    </thead>

                    <tbody className="bg-[#0F151C]">
                        {!loading && list?.map((item, idx) => (
                            <tr key={item.coinType} className="h-[48px]">
                                {/* VAULT 名称 + icon */}
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-1">
                                            {[item.leftCoinLogo, item.rightCoinLogo].map((icon, i) => (
                                                <img
                                                    key={i}
                                                    src={icon}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full border border-[#0F151C]"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[20px] font-[500] text-[#FCFCFC]">{item.vaultName}</span>
                                    </div>
                                </td>

                                <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                                    <span>{new Decimal(432333.00).mul(1).lt(0.01) && '<'}{formatPortfolioNumber(new Decimal(432333.00).mul(1))}</span>

                                </td>
                                <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                                    <div className='flex gap-1'>
                                        {Number(item.apy) * 100}%
                                        <Image
                                            src="/assets/images/star.svg"
                                            alt="star"
                                            width={16}
                                            height={16}
                                        />
                                        <Image
                                            src="/assets/images/gift.svg"
                                            alt=""
                                            width={12}
                                            height={12}

                                        />
                                    </div>
                                </td>

                                <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">

                                    <span>{new Decimal(432333.00).mul(1).lt(0.01) && '<'}{formatPortfolioNumber(new Decimal(432333.00).mul(1))}</span>
                                    <span className="text-[rgba(252,252,252,0.4)] ml-2">
                                        ~{new Decimal(432333.00).mul(1).lt(0.01) && '<'}$
                                        {formatPortfolioNumber(new Decimal(432333.00).mul(1))}
                                    </span>

                                </td>

                                {/* 用户仓位 / 收益 */}
                                <td className="text-[14px] font-[500] text-[#4CC877]">
                                    +{item.earnings ? formatTVL(item.earnings.toString()) : '-'}
                                </td>


                                {/* Source Protocol */}
                                <td className="py-3 font-[500] text-[16px] text-[#FCFCFC]">
                                    <span className="flex items-center gap-1 text-white">
                                        <Image
                                            src={item.sourceProtocolLogoUrl}
                                            alt=""
                                            width={24}
                                            height={24}
                                        />
                                        {item.sourceProtocol}
                                    </span>
                                </td>

                                {/* Deposit 按钮 */}
                                <td className="py-3 text-[14px] text-right font-[500]">
                                    <div className="cursor-pointer px-6 py-1.5 items-center rounded-[16px] transition-colors duration-200 inline-flex bg-[#2E81FCE5] text-[#FCFCFC] hover:text-white hover:bg-[#2E81FCc5]">
                                        <Link href={`/vaults/detail`} className="inline-flex gap-1 items-center">
                                            Deposit
                                        </Link>
                                    </div>
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