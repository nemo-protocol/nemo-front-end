'use client'

import BackButton from '@/components/ui/back'
import { ArrowUpRight, ExternalLink, RefreshCcw } from 'lucide-react'
import Image from 'next/image'
import MetricCard from './MetricCard'
import SectionBox from './SectionBox'
import DonutChart from './DonutChart'

export default function VaultsDetailPage() {
    // mock data
    const addr = '0xdeb97...e270'

    return (
        <div className="min-h-screen bg-[#080d16] py-4 text-white">
            {/* 顶部返回 */}
            <div className="px-7.5">
                <BackButton />
            </div>

            {/* Header – 名称 + 地址 + 右侧 Source Protocol */}
            <div className="px-7.5 mt-6 grid lg:grid-cols-12 gap-6">
                {/* 左侧标题 */}
                <div className="lg:col-span-8 flex items-start gap-4">
                    <div className="flex -space-x-2">
                        <Image src="/icons/usdt.svg" alt="" width={40} height={40} />
                        <Image src="/icons/usdc.svg" alt="" width={40} height={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">suiUSDT-USDC</h1>
                        <p className="text-xs text-white/60">
                            Vault&nbsp;Address: <span className="underline">{addr}</span>
                        </p>
                    </div>
                </div>

                {/* 右侧协议 */}
                <div className="lg:col-span-4 flex lg:justify-end">
                    <div className="rounded-[12px] bg-[#0F151C] px-6 py-4 w-full lg:w-auto">
                        <p className="text-xs text-white/60 mb-2">SOURCE PROTOCOL</p>
                        <div className="flex items-center gap-2">
                            <Image src="/icons/momentum.svg" alt="" width={20} height={20} />
                            <span className="font-semibold">Momentum</span>
                        </div>
                        <a
                            href="https://momentum.xyz"
                            target="_blank"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-[#4E6BFF] hover:underline"
                        >
                            Website <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Top metrics row */}
            <div className="px-7.5 mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard label="Total Supplied" value="$17.13M" />
                <MetricCard
                    label="Vault APY"
                    value="32.37%"
                    icon={<Image src="/icons/apy.svg" alt="" width={14} height={14} />}
                />
                <MetricCard
                    label="Last Harvest"
                    value="2 hours ago"
                    icon={<RefreshCcw size={14} />}
                />
                <MetricCard label="Your Position" value="-" />
                <MetricCard label="Your Earnings" value="-" />
            </div>


            <div className="px-7.5 mt-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-6">

                    {/* LP Breakdown */}
                    <SectionBox title="LP Breakdown" className="lg:col-span-7">
                        <div className="flex flex-col md:flex-row gap-6">
                            <DonutChart />
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-white/60">
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
                                                    <button className="text-[#4E6BFF] hover:underline flex items-center gap-1 text-xs">
                                                        Swap <ArrowUpRight size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SectionBox>
                    <SectionBox title="Strategy Overview">
                        <p className="text-sm leading-relaxed mb-6">
                            The vault deposits the user’s suiUSDT-USDC in a Momentum LP within an
                            optimized price range, earning the platform’s incentive and swap
                            fees. Earned token is swapped for sbUSDT and USDC in order to
                            multiple times daily and auto-compounded to grow your deposits…
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <table className="w-full">
                                <tbody>
                                    <tr className="h-7">
                                        <td className="text-white/60">Token</td>
                                        <td className="flex items-center gap-1">
                                            <Image src="/icons/usdt.svg" alt="" width={14} height={14} />
                                            <Image src="/icons/usdc.svg" alt="" width={14} height={14} />
                                        </td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Vault APY</td>
                                        <td>32.37%</td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Current TVL</td>
                                        <td>$17.13M</td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Position Range</td>
                                        <td>1.000 - 1.001 USDC per suiUSDT</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full">
                                <tbody>
                                    <tr className="h-7">
                                        <td className="text-white/60">Source Protocol</td>
                                        <td className="flex items-center gap-2">
                                            <Image
                                                src="/icons/momentum.svg"
                                                alt=""
                                                width={14}
                                                height={14}
                                            />
                                            Momentum
                                        </td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Deployment Date</td>
                                        <td>23 June 2025</td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Cumulative Earnings</td>
                                        <td className="text-[#31D67E]">+ $328,323.00</td>
                                    </tr>
                                    <tr className="h-7">
                                        <td className="text-white/60">Performance Fee</td>
                                        <td>20.00%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionBox>
                </div>

                {/* Deposit / Withdraw 面板 */}
                <div className="lg:w-[420px] w-full">
                    <div className="rounded-[12px] bg-[#0F151C] p-6 space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-6 text-sm">
                            <button className="font-semibold">Deposit</button>
                            <button className="text-white/50 hover:text-white">Withdraw</button>
                        </div>

                        {/* Zap / Manual tabs */}
                        <div className="flex gap-4 text-xs">
                            <button className="py-1 px-3 rounded-full bg-[#1E262A] font-semibold">
                                ZAP IN
                            </button>
                            <button className="py-1 px-3 rounded-full hover:bg-[#1E262A]">
                                MANUAL
                            </button>
                        </div>

                        {/* Deposit input */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/60">DEPOSIT</label>
                                <div className="mt-1 flex items-center gap-2 bg-[#1E262A] p-3 rounded-[12px]">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                    <span className="text-xs text-white/60">$511.00</span>
                                    <span className="mx-2 text-xs text-white/30">|</span>
                                    <span className="text-sm">suiUSDT</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-[#1E262A] flex items-center justify-center">
                                    <Image src="/icons/switch.svg" alt="" width={14} height={14} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/60">RECEIVE</label>
                                <div className="mt-1 flex items-center gap-2 bg-[#1E262A] p-3 rounded-[12px]">
                                    <input
                                        disabled
                                        value="114"
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                    <span className="text-xs text-white/60">$150.00 (0.05%)</span>
                                    <span className="mx-2 text-xs text-white/30">|</span>
                                    <span className="text-sm flex items-center gap-1">
                                        MLP
                                        <Image src="/icons/usdt.svg" alt="" width={14} height={14} />
                                        <Image src="/icons/usdc.svg" alt="" width={14} height={14} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Price / Range / Slippage */}
                        <div className="text-xs text-white/60 space-y-1">
                            <p>
                                Price&nbsp;&nbsp;<span className="text-white">1.00 sUSDT = 0.55 MLP</span>
                            </p>
                            <p>
                                Position Range&nbsp;&nbsp;
                                <span className="text-white">1.000 - 1.001 USDC per suiUSDT</span>
                            </p>
                            <p>
                                Slippage&nbsp;&nbsp;<span className="text-white">0.5%</span>
                            </p>
                        </div>

                        {/* CTA */}
                        <button className="w-full h-10 rounded-[12px] bg-gradient-to-r from-[#266EFF] to-[#11C7FF] text-sm font-semibold">
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </div>

         
        </div>
    )
}