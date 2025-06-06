import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import { PyPosition, LpPosition, MarketState } from '@/hooks/types';
import { PortfolioItem } from '@/queries/types/market';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import { formatDecimalValue, formatPortfolioNumber, formatTVL } from '@/lib/utils';
import Decimal from 'decimal.js';
import { ArrowUpRight, Router } from 'lucide-react';
import Link from 'next/link';

export const isExpired = (maturityTime: string) => {
    return dayjs().isAfter(dayjs(parseInt(maturityTime)));
};

export type ListOrigin = 'pt' | 'yt' | 'lp'

export interface RankedPortfolioItem extends PortfolioItem {
    listType: ListOrigin
}


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
    marketStates: MarketStateMap;
    ytReward?: Record<string, string>
    lpReward?: Record<string, string>
}

export default function Assets({
    filteredLists,
    pyPositionsMap,
    lpPositionsMap,
    marketStates,
    ytReward,
    lpReward
}: AssetsParams) {
    const [activeTab, setActiveTab] = useState(categories[0]);
    const [list, setList] = useState<RankedPortfolioItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const flat: RankedPortfolioItem[] = (['pt', 'yt', 'lp'] as ListOrigin[]).flatMap(
            (key) =>
                filteredLists[key].map((item) => ({
                    ...item,
                    listType: key
                }))
        )

        const ranklist = flat.sort((a, b) => {
            const aExpired = isExpired((a as any).maturity)
            const bExpired = isExpired((b as any).maturity)

            if (aExpired && !bExpired) return -1
            if (!aExpired && bExpired) return 1
            let aValue
            let bValue
            if (a.listType == 'lp')
                aValue = new Decimal(lpPositionsMap?.[a.id]?.lpBalance || 0).mul(a.lpPrice)
            else if (a.listType == 'yt')
                aValue = new Decimal(pyPositionsMap?.[a.id]?.ytBalance || 0).mul(a.ytPrice)
            else
                aValue = new Decimal(pyPositionsMap?.[a.id]?.ptBalance || 0).mul(a.ptPrice)

            if (b.listType == 'lp')
                bValue = new Decimal(lpPositionsMap?.[b.id]?.lpBalance || 0).mul(b.lpPrice)
            else if (b.listType == 'yt')
                bValue = new Decimal(pyPositionsMap?.[b.id]?.ytBalance || 0).mul(b.ytPrice)
            else
                bValue = new Decimal(pyPositionsMap?.[b.id]?.ptBalance || 0).mul(b.ptPrice)

            return bValue.comparedTo(aValue) // 降序
        })
        setList(ranklist)
        setLoading(false)
    }, [filteredLists, lpPositionsMap, pyPositionsMap])



    return (
        <div className="mt-10 mx-7.5 px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">
            {/* Tabs */}
            <div className="flex gap-8 items-center">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Assets</div>
                <div className="flex space-x-2 text-[12px]">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`h-8 px-2 cursor-pointer select-none rounded-[12px]
                        flex items-center justify-center font-[650]

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
            <div >
                <table className={`min-w-full border-collapse  border-separate ${loading ? 'border-spacing-y-4' : "border-spacing-y-0.5"}`}>
                    <thead className="text-white/60">
                        <tr>
                            <th className="py-2  w-[180px] text-left text-[12px] font-[650]">ASSET</th>
                            <th className="py-2  w-[160px] text-left text-[12px] font-[650]">TYPE</th>
                            <th className="py-2  w-[150px] text-left text-[12px] font-[650]">MATURITY</th>
                            <th className="py-2  w-[100px] text-left text-[12px] font-[650]">PRICE</th>
                            <th className="py-2 text-left text-[12px] font-[650]">AMOUNT</th>
                            <th className="py-2 text-left text-[12px] font-[650]">INCENTIVE</th>
                            <th className="py-2 text-left text-[12px] font-[650]">ACCRUED YIELD</th>
                            <th className="py-2 text-left text-[12px] font-[650]"></th>

                        </tr>
                    </thead>
                    <tbody className="bg-[#0f151c] ">
                        {!loading && list.map((item, index) => {

                            let totalReward = 0
                            if (lpReward)
                                marketStates[item.marketStateId]?.rewardMetrics.forEach(rewardMetric => {
                                    totalReward = totalReward + Number(lpReward[item.id + rewardMetric.tokenName]) * Number(rewardMetric.tokenPrice)
                                })
                            if ((activeTab == categories[0] || activeTab == categories[1]) && item.listType == 'pt') {
                                return <tr key={index} className="">
                                    <td className="py-3  text-[20px] font-[550] text-[#FCFCFC] flex gap-x-2">
                                        <Image
                                            src={item.ptTokenLogo}
                                            alt={""}
                                            width={24}
                                            height={24}
                                            className="shrink-0"
                                        />PT {item.coinName}</td>
                                    <td className="py-3">
                                        <div className=' text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,182,155,0.10)] text-[#17B69B]'>{"PRINCIPLE TOKEN"}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className={`text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex 
                                ${isExpired(item.maturity) ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]' : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'}`}>
                                            {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                        </div>
                                    </td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">{formatTVL(item.ptPrice)}</td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC] ">
                                        <span>
                                            {new Decimal(pyPositionsMap?.[item.id]?.ptBalance || 0).lt(0.01) && "<"}
                                            {formatPortfolioNumber(pyPositionsMap?.[item.id]?.ptBalance || 0)}
                                        </span>
                                        <span className='text-[rgba(252,252,252,0.4)] ml-1'>
                                            ~{new Decimal(pyPositionsMap?.[item.id]?.ptBalance || 0).mul(item.ptPrice).lt(0.01) && "<"}
                                            ${formatPortfolioNumber(new Decimal(pyPositionsMap?.[item.id]?.ptBalance || 0).mul(item.ptPrice))}
                                        </span>
                                    </td>
                                    <td className="py-3 text-[14px] text-[#FCFCFC]">{"—"}</td>
                                    <td className="py-3 text-[14px] text-[#FCFCFC]">{"—"}</td>
                                    <td className={`py-3 text-[14px] text-right font-[550]`}>
                                        <div className={` cursor-pointer  px-2.5 py-1.5 items-center rounded-[16px]
                                    transition-colors duration-200
                                    ${isExpired(item.maturity) ? "text-[#4CC877] hover:bg-[rgba(76,200,119,0.10)]" : "text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)]"} cursor-pointer inline-flex gap-1 items-center`}>{isExpired(item.maturity) ?
                                                <><img src={'/redeem.svg'} alt="" className="w-4 h-4" />Redeem</> :
                                                <Link className='inline-flex gap-1 items-center' href={`/market-detail/${item.id}/${item.coinType}/trade/fixed`}><ArrowUpRight className="w-4 h-4" />Trade</Link>

                                            }
                                        </div>
                                    </td>

                                </tr>
                            }
                            else if ((activeTab == categories[0] || activeTab == categories[2]) && item.listType == "yt") {
                                return <tr key={index} className="">
                                    <td className="py-3  text-[20px] font-[550] text-[#FCFCFC] flex gap-x-2">
                                        <Image
                                            src={item.ytTokenLogo}
                                            alt={""}
                                            width={24}
                                            height={24}
                                            className="shrink-0"
                                        />YT {item.coinName}</td>
                                    <td className="py-3 ">
                                        <div className=' text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,133,183,0.1)] text-[#1785B7]'>{"YIELD TOKEN"}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className={`text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex 
                                      ${isExpired(item.maturity) ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]' : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'}`}>
                                            {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                        </div>
                                    </td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">{formatTVL(item.ytPrice)}</td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">
                                        <span>
                                            {new Decimal(pyPositionsMap?.[item.id]?.ytBalance || 0).lt(0.01) && "<"}
                                            {formatPortfolioNumber(pyPositionsMap?.[item.id]?.ytBalance || 0)}
                                        </span>
                                        <span className='text-[rgba(252,252,252,0.4)] ml-1'>
                                            ~{new Decimal(pyPositionsMap?.[item.id]?.ytBalance || 0).mul(item.ytPrice).lt(0.01) && "<"}
                                            ${formatPortfolioNumber(new Decimal(pyPositionsMap?.[item.id]?.ytBalance || 0).mul(item.ytPrice))}
                                        </span>
                                    </td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">{"—"}</td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">
                                        <span>
                                            {new Decimal(ytReward?.[item.id] || 0).mul(item.conversionRate).lt(0.01) && "<"}
                                            {formatPortfolioNumber(new Decimal(ytReward?.[item.id] || 0).mul(item.conversionRate))}
                                        </span>
                                        <span className='text-[rgba(252,252,252,0.4)] ml-1'>
                                            ~{new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice).lt(0.01) && "<"}
                                            ${formatPortfolioNumber(new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice))}
                                        </span>
                                    </td>
                                    <td className={`py-3 text-[14px] text-right font-[550]`}>
                                        <div className={` cursor-pointer  px-2.5 py-1.5 items-center rounded-[16px]
                                    transition-colors duration-200
                                   text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)] cursor-pointer inline-flex`}>{
                                                <Link className='inline-flex gap-1 items-center' href={`/market-detail/${item.id}/${item.coinType}/trade/yield`}><ArrowUpRight className="w-4 h-4" />Trade</Link>
                                            }
                                        </div>
                                    </td>

                                </tr>
                            }
                            else if ((activeTab == categories[0] || activeTab == categories[3]) && item.listType == "lp" && lpReward) {
                                return <tr key={index} className="">
                                    <td className="py-3  text-[20px] font-[550] text-[#FCFCFC] flex gap-x-2">
                                        <Image
                                            src={item.coinLogo}
                                            alt={""}
                                            width={24}
                                            height={24}
                                            className="shrink-0"
                                        />LP {item.coinName}</td>
                                    <td className="py-3">
                                        <div className=' text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(149,110,255,0.1)] text-[#956EFF]'>{"LIQUIDITY"}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className={`text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex 
                                ${isExpired(item.maturity) ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]' : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'}`}>
                                            {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                        </div>
                                    </td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">{formatTVL(item.lpPrice)}</td>
                                    <td className="py-3 font-[550] text-[14px] text-[#FCFCFC]">
                                        <span>
                                            {new Decimal(lpPositionsMap?.[item.id]?.lpBalance || 0).lt(0.01) && "<"}

                                            {formatPortfolioNumber(lpPositionsMap?.[item.id]?.lpBalance || 0)}
                                        </span>
                                        <span className='text-[rgba(252,252,252,0.4)] ml-1'>
                                            ~{new Decimal(lpPositionsMap?.[item.id]?.lpBalance || 0).mul(item.lpPrice).lt(0.01) && "<"}
                                            ${formatPortfolioNumber(new Decimal(lpPositionsMap?.[item.id]?.lpBalance || 0).mul(item.lpPrice))}
                                        </span>
                                    </td>
                                    <td className="py-3 text-[#FCFCFC] relative group">
                                        <div>
                                            <div className={`text-[12px] font-[650] py-1 px-1.5 rounded-[8px] cursor-pointer inline-flex 
                                ${totalReward > 1000 ? 'bg-[rgba(149,110,255,0.80)]' : 'bg-[rgba(76,200,119,0.80)]'}`}>
                                                <Image
                                                    src={'/lpReward.svg'}
                                                    alt={""}
                                                    width={12}
                                                    height={12}
                                                    className="shrink-0"
                                                />
                                                <span>
                                                    ~{new Decimal(totalReward).lt(0.01) && "<"}
                                                    ${formatPortfolioNumber(new Decimal(totalReward))}
                                                </span>
                                            </div>

                                        </div>
                                        {
                                            <div
                                                className="absolute top-12 left-[-120px] ml-4 w-[320px] rounded-xl border border-[#6D7177]
                                        bg-[#101722] backdrop-blur px-6 py-6 text-sm z-10
                                        opacity-0 invisible transition-all duration-200
                                        group-hover:opacity-100 group-hover:visible"
                                            >
                                                <div className='text-[18px] font-[470]'>{"Incentive Details"}</div>
                                                <div className='mt-4 font-[550]'>
                                                    {marketStates[item.marketStateId]?.rewardMetrics.map(rewardMetric => (
                                                        <div className='flex justify-between text-[14px] mt-2' key={rewardMetric.tokenName}>
                                                            <div className='text-[rgba(252,252,252,0.40)]'>${rewardMetric.tokenName}</div>
                                                            <div className='flex text-[rgba(252,252,252,0.40)]'>
                                                                {lpReward[item.id + rewardMetric.tokenName] == "0" ? <>
                                                                    <span>
                                                                        0
                                                                    </span><span className='mr-2 ml-1 text-[#FCFCFC]'>
                                                                        $0
                                                                    </span></> : <>  <span>
                                                                        {new Decimal(lpReward[item.id + rewardMetric.tokenName]).lt(0.01) && "<"}

                                                                        {formatPortfolioNumber(lpReward[item.id + rewardMetric.tokenName])}
                                                                    </span>
                                                                    <span className='mr-2 ml-1 text-[#FCFCFC]'>
                                                                        ~{new Decimal(lpReward[item.id + rewardMetric.tokenName]).mul(rewardMetric.tokenPrice).lt(0.01) && "<"}
                                                                        ${formatPortfolioNumber(new Decimal(lpReward[item.id + rewardMetric.tokenName]).mul(rewardMetric.tokenPrice))}
                                                                    </span></>}

                                                                <Image
                                                                    src={rewardMetric.tokenLogo}
                                                                    alt={""}
                                                                    width={16}
                                                                    height={16}
                                                                    className="shrink-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className='w-full h-[1px] bg-[rgba(252,252,252,0.10)] mt-4 mb-4'></div>
                                                <div className='flex justify-between text-[14px] font-[550]'>
                                                    <div className='text-[rgba(252,252,252,0.50)]'>{"Total"}</div>
                                                    <div className='text-[#956EFF]'>  ~{new Decimal(totalReward).lt(0.01) && "<"}
                                                        ${formatPortfolioNumber(new Decimal(totalReward))}</div>

                                                </div>
                                            </div>
                                        }
                                    </td>
                                    <td className="py-3 text-[14px] text-[#FCFCFC]">{"—"}</td>
                                    <td className={`py-3 text-[14px] text-right font-[550]`}>
                                        <div className={`cursor-pointer px-2.5 py-1.5 items-center rounded-[16px]
                                    transition-colors duration-200 inline-flex
                                    ${isExpired(item.maturity) ? "text-[#4CC877] hover:bg-[rgba(76,200,119,0.10)]" : "text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)]"} cursor-pointer`}>{isExpired(item.maturity) ?
                                                <><img src={'/redeem.svg'} alt="" className="w-4 h-4" />Redeem</> :
                                                <Link className='inline-flex gap-1 items-center' href={`/market-detail/${item.id}/${item.coinType}/provide/pool`}><ArrowUpRight className="w-4 h-4" />Trade</Link>
                                            }
                                        </div>
                                    </td>

                                </tr>
                            }

                        })}
                        {loading && [0, 0, 0, 0, 0, 0].map((item, index) => (
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
            </div>
        </div >
    );
}
