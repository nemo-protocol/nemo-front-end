import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import { PyPosition, LpPosition, MarketState } from '@/hooks/types';
import { PortfolioItem } from '@/queries/types/market';
import React, { useState } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';

const assetsData = [
    {
        asset: 'YT sSUI',
        type: 'YIELD TOKEN',
        maturity: '2026-02-19',
        price: '$143',
        amount: '10.3333',
        incentive: '—',
        accruedYield: '88,752 ~ $126,116.59',
    },
    {
        asset: 'PT sSUI',
        type: 'PRINCIPLE TOKEN',
        maturity: '2026-02-19',
        price: '$0.38',
        amount: '45.3333',
        incentive: '—',
        accruedYield: '—',
    },
    {
        asset: 'LP sSUI',
        type: 'LIQUIDITY',
        maturity: '2026-02-19',
        price: '$1.59',
        amount: '4334.4444',
        incentive: '319,287',
        accruedYield: '$31,609.43',
    },
    {
        asset: 'PT stSUI',
        type: 'PRINCIPLE TOKEN',
        maturity: '2025-04-19',
        price: '$1.42',
        amount: '51,125',
        incentive: '—',
        accruedYield: '—',
    },
];

const categories = ['ALL', 'PRINCIPLE TOKEN', 'YIELD TOKEN', 'LIQUIDITY'];

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
    marketStates: MarketStateMap
}

export default function Assets({
    filteredLists,
    pyPositionsMap,
    lpPositionsMap,
    marketStates
}: AssetsParams) {
    const [activeTab, setActiveTab] = useState(categories[0]);

    // Filter assets based on the active tab
    const filteredAssets = assetsData.filter(asset => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'YIELD TOKEN') return asset.type === 'YIELD TOKEN';
        if (activeTab === 'PRINCIPLE TOKEN') return asset.type === 'LIQUIDITY';
        if (activeTab === 'LIQUIDITY') return asset.type === 'PRINCIPLE TOKEN';
        return false;
    });

    return (
        <div className="mt-10 mx-auto max-w-7xl px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">
            {/* Tabs */}
            <div className="flex gap-8 items-center">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Assets</div>
                <div className="flex space-x-2 text-[12px]">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`h-8 px-2 cursor-pointer select-none rounded-[12px]
                        flex items-center justify-center

                        ${activeTab === category
                                    ? 'bg-gradient-to-r from-white/10 to-white/5 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'}
                        `}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>Ï
            {/* Assets Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="text-white/60">
                        <tr>
                            <th className="py-2 text-left text-[12px] font-medium">ASSET</th>
                            <th className="py-2 text-left text-[12px] font-medium">TYPE</th>
                            <th className="py-2 text-left text-[12px] font-medium">MATURITY</th>
                            <th className="py-2 text-left text-[12px] font-medium">PRICE</th>
                            <th className="py-2 text-left text-[12px] font-medium">AMOUNT</th>
                            <th className="py-2 text-left text-[12px] font-medium">INCENTIVE</th>
                            <th className="py-2 text-left text-[12px] font-medium">ACCRUED YIELD</th>
                            <th className="py-2 text-left text-[12px] font-medium"></th>

                        </tr>
                    </thead>
                    <tbody className="bg-[#0f151c]">
                        {(activeTab == categories[0] || activeTab == categories[1]) && filteredLists.pt.map((item, index) => (
                            <tr key={index} className="">
                                <td className="py-3 text-[20px] font-[550] text-[#FCFCFC] flex gap-x-2">
                                    <Image
                                        src={item.coinLogo}
                                        alt={""}
                                        width={24}
                                        height={24}
                                        className="shrink-0"
                                    />{item.coinName}</td>
                                <td className="py-3">
                                    <div className=' text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,182,155,0.10)] text-[#17B69B]'>{"PRINCIPLE TOKEN"}</div>
                                </td>
                                <td className="py-3">
                                    <div className=' text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,133,183,0.10)] text-[#FCFCFC66]'>
                                        {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                    </div>
                                </td>
                                <td className="py-3 text-[14px] text-[#FCFCFC]">{item.ptPrice}</td>
                                <td className="py-3 text-[14px] text-[#FCFCFC]">{pyPositionsMap?.[item.id].ptBalance}</td>
                                <td className="py-3 text-[14px] text-[#FCFCFC]">{"-"}</td>
                                <td className="py-3 text-[14px] text-[#FCFCFC]">{"-"}</td>
                                <td className="py-3 text-[14px] text-[#FCFCFC]">{"Trade"}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
