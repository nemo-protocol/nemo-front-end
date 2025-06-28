'use client'

import BackButton from '@/components/ui/back'
import { ArrowUpRight, ExternalLink, RefreshCcw } from 'lucide-react'
import Image from 'next/image'
import MetricCard from './components/MetricCard'
import DonutChart from './components/DonutChart'
import Link from 'next/link'
import YieldChart from '@/app/market-detail/[id]/[coinType]/[action]/[tokenType]/components/YieldChart'
import SimpleTabs from '@/app/market-detail/[id]/[coinType]/[action]/[tokenType]/components/SimpleTabs'
import TradeVaults from './components/TradeVaults'
import { useState } from 'react'
import { CoinConfig } from '@/queries/types/market'
import { useCoinConfig } from '@/queries'

export default function VaultsDetailPage() {
    // mock data
    const [currentTab, setCurrentTab] = useState<"1" | "0">("0")
    const { data: coinConfig, isLoading: isConfigLoading } = useCoinConfig("0x50f457c30c02bb4cf186276a8798dfc5683aa16e54316d9e52d7b2ff8d23eed3")

    const addr = '0xdeb97...e270'
    const data = {
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList: [
            'Sui Incentives',
            'MMT Bricks'
        ],
        leftCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        leftCoinName: "sui",
        leftCoinPrice: "1.6789",
        leftCoinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        leftTokenAmount: "12345.6789",
        maturity: "string",
        rightCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        rightCoinName: "wal",
        rightCoinPrice: "1.6789",
        rightCoinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
        rightTokenAmount: "12345.6789",
        sourceProtocol: "Momentum",
        sourceProtocolLogoUrl: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx"
    }
    return (
        <div className="min-h-screen bg-[#080d16] py-4 text-white">
            <div className="px-7.5">
                <BackButton />
            </div>

            <div className="px-7.5 mt-2 grid lg:grid-cols-12 gap-6">
                {/* 左侧标题 */}
                <div className="lg:col-span-8 flex items-center gap-2.5 ">
                    <div className="flex ">
                        <img src={data.leftCoinLogo} alt="" width={52} height={52} />
                        <img src={data.rightCoinLogo} alt="" width={52} height={52} />
                    </div>
                    <div>
                        <div className="text-[32px] items-start font-normal font-serif font-[470] text-[#FCFCFC]">{data.vaultName}</div>
                        <div className="text-[14px] font-[500] text-[rgba(252,252,252,0.30)] mt-[-4px]">
                            Vault&nbsp;Address: <Link href={""} className="underline cursor-pointer">{addr}</Link>
                        </div>
                    </div>
                </div>

                {/* 右侧协议 */}
                <div className="lg:col-span-4 flex lg:justify-end">
                    <div className="border-l border-r border-[rgba(252,252,252,0.1)] px-10 py-4 w-full flex flex-col items-center lg:w-auto">
                        <div className="text-[12px] text-[rgba(252,252,252,0.40)] mb-2 font-[600]">SOURCE PROTOCOL</div>
                        <div className="flex text-[16px] font-[500] items-center gap-2">
                            <img src={data.sourceProtocolLogoUrl} alt="" width={20} height={20} />
                            <span className="font-semibold">Momentum</span>
                        </div>
                        <Link
                            href="https://momentum.xyz"
                            target="_blank"
                            className="mt-2 underline inline-flex items-center text-[#6E6E6E] font-[500] gap-1 text-xs hover:underline"
                        >
                            Website <ExternalLink size={12} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top metrics row */}
            <div className="px-7.5 mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard label="Total Supplied" value="$17.13M" />
                <MetricCard
                    label="Vault APY"
                    value="32.37%"
                />
                <MetricCard
                    label="Last Harvest"
                    value="2 hours ago"
                />
                <MetricCard label="Your Position" value="-" />
                <MetricCard label="Your Earnings" value="-" />
            </div>


            <div className="px-7.5 mt-6 flex flex-col lg:flex-row gap-6 w-full">

                {/* LP Breakdown */}
                <div className="flex-1">
                    <div className="flex-1 rounded-[12px] flex flex-col bg-[#0F151C] gap-6 p-6">
                        <div className="flex pb-4 gap-1 border-b border-[rgba(252,252,252,0.1)]">
                            <h1 className="fallback #FCFCFC text-[color:var(--typo-primary,#FCFCFC)] [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[24px] font-[470] font-normal font-serif">{"LP Breakdown"}</h1>

                            <div className="relative mt-1 group">
                                <button
                                    className="text-xs rounded-full inline-flex justify-center leading-none w-4 h-8 select-none cursor-pointer"
                                >
                                    <Image src="/tip.svg" alt="" width={16} height={16} className="shrink-0" />
                                </button>

                                <div
                                    className="hidden group-hover:block absolute top-0 left-0.5 ml-4 w-[480px] rounded-xl border border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm z-10 animate-fade-in text-[#FCFCFC]"
                                >
                                    This ranking is used to quantify the contributors who are deeply involved in the Nemo protocol.
                                </div>
                            </div>

                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <DonutChart />
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-[rgba(252,252,252,0.40)] font-[600] text-[12px]">
                                        <tr>
                                            <th className="text-left pb-2">ASSET</th>
                                            <th className="text-left pb-2">RATE</th>
                                            <th className="text-left pb-2">TOKEN&nbsp;AMOUNT</th>
                                            <th className="text-left pb-2">VALUE</th>
                                            <th className="text-left pb-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { asset: 'suiUSDT', rate: '47.33%', amount: '8,774,237.5', value: '~$8.73M' },
                                            { asset: 'USDC', rate: '52.67%', amount: '8,774,237.5', value: '~$8.43M' },
                                        ].map((row) => (
                                            <tr key={row.asset} className="h-8">
                                                <td>{row.asset}</td>
                                                <td>{row.rate}</td>
                                                <td>{row.amount}</td>
                                                <td>{row.value}</td>
                                                <td>
                                                    <button className=" hover:underline flex items-center gap-1 text-xs">
                                                        Swap <ArrowUpRight size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 rounded-[12px] flex flex-col bg-[#0F151C]  mt-4 p-6" >
                        <h1 className="fallback #FCFCFC text-[color:var(--typo-primary,#FCFCFC)] [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[24px] font-[470] font-normal font-serif">{"Strategy Overview"}</h1>
                        <div className="text-[14px] font-[500] text-[rgba(252,252,252,0.50)] mt-6 leading-relaxed mb-6 border-t border-b border-[rgba(252,252,252,0.1)] py-4">
                            The vault deposits the user’s suiUSDT-USDC in a Momentum LP within an
                            optimized price range, earning the platform’s incentive and swap
                            fees. Earned token is swapped for sbUSDT and USDC in order to
                            multiple times daily and auto-compounded to grow your deposits…
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <table className="w-full">
                                <tbody>
                                    <tr className="h-12">
                                        <td className="text-white/50 font-[500] text-[14px]">Token</td>
                                        <td className="text-right text-[14px] font-[500] text-[rgba(255,255,255,1)] flex items-center h-12 justify-end gap-1">
                                            <img src={data.leftCoinLogo} alt="" width={20} height={20} />
                                            <span>{data.leftCoinName}</span>
                                            <img className='ml-3' src={data.rightCoinLogo} alt="" width={20} height={20} />
                                            <span>{data.rightCoinName}</span>
                                        </td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/50 font-[500] text-[14px]">Vault APY</td>
                                        <td className='text-right'>32.37%</td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/50 font-[500] text-[14px]">Current TVL</td>
                                        <td className='text-right'>$17.13M</td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/50 font-[500] text-[14px]">Position Range</td>
                                        <td className='text-right'>1.000 - 1.001 USDC per suiUSDT</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full">
                                <tbody>
                                    <tr className="h-12">
                                        <td className="text-white/60">Source Protocol</td>
                                        <td className="flex  flex items-center h-12 justify-end gap-1">
                                            <img
                                                src={data.sourceProtocolLogoUrl}
                                                alt=""
                                                width={20}
                                                height={20}
                                            />
                                            {data.sourceProtocol}
                                        </td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/60">Deployment Date</td>
                                        <td className='text-right'>23 June 2025</td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/60">Cumulative Earnings</td>
                                        <td className="text-right text-[#31D67E]">+ $328,323.00</td>
                                    </tr>
                                    <tr className="h-12">
                                        <td className="text-white/60">Performance Fee</td>
                                        <td className='text-right'>20.00%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="rounded-[12px] flex flex-col bg-[#0F151C] mt-4 p-6">
                        {coinConfig && <YieldChart
                            coinConfig={coinConfig}
                            h={400}
                            tokenType={"YIELD"}
                        />}
                    </div>
                </div>

                {/* Deposit / Withdraw 面板 */}
                <div className="lg:w-[520px] w-full">
                    <TradeVaults
                        vaultsConfig={data}
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                    />
                </div>
            </div>


        </div>
    )
}