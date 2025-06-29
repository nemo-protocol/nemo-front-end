"use client"
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useMarketTransactions } from '@/hooks/useMarketTransactions';
import { isExpired } from './Assets';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import EmptyData from '@/components/ui/empty';
import { useWallet } from '@nemoprotocol/wallet-kit';


const typeColor: Record<string, string> = {
    BUY: 'bg-[rgba(76,200,119,0.1)]',
    ADD: 'bg-[rgba(76,200,119,0.1)]',
    MINT: 'bg-[rgba(76,200,119,0.1)]',
    CLAIM: 'bg-[rgba(76,200,119,0.1)]',
    REDEEM: 'bg-[rgba(76,200,119,0.1)]',

    SELL: 'bg-[rgba(255,46,84,0.1)]',
    REMOVE: 'bg-[rgba(255,46,84,0.1)]',
    success: 'bg-[rgba(76,200,119,0.1)]',
    failed: 'bg-[rgba(255,46,84,0.1)]',

};

const textColor: Record<string, string> = {
    BUY: 'text-[#4CC877]',
    ADD: 'text-[#4CC877]',
    CLAIM: 'text-[#4CC877]',
    MINT: 'text-[#4CC877]',

    REDEEM: 'text-[#4CC877]',

    SELL: 'text-[#FF2E54]',
    REMOVE: 'text-[#FF2E54]',

    success: 'text-[#4CC877]',
    failed: 'text-[#FF2E54]',
};
const statusColor: Record<string, string> = {
    success: 'bg-green-500',
    failed: 'bg-red-500',
    '': 'bg-gray-500',
};

function shortHash(hash: string, len = 10) {
    if (!hash) return '';
    return `${hash.slice(0, len).toLowerCase()}...${hash.slice(-len).toLowerCase()}`;
}

export default function MobileTransactions({ isMobileHistory }: { isMobileHistory?: boolean }) {
    const router = useRouter()
    const [totalloading, setTotalloading] = useState(true)

    const {
        data,
        loading,
        error,
        setPageIndex,
    } = useMarketTransactions({ pageSize: 10 });
    const pathname = usePathname();
    const { address } = useWallet();
    const isPage = pathname.startsWith('/portfolio/history');
    let transactions = data?.data ?? [];
    transactions = isPage ? transactions : transactions.slice(0, 5)

    useEffect(() => {
        if (loading == false && data?.data) {
            setTotalloading(loading)
        }
    }, [loading, data])
    return (
        <div className={`flex w-[345px] p-[18px] flex-col items-start gap-6 rounded-[24px] bg-[rgba(252,252,252,0.03)] ${isMobileHistory ? 'mt-12' : 'mt-6'}`}>
            <div className="text-[32px] font-[470] text-[#FCFCFC] text-center leading-[100%] tracking-[-1.28px]" style={{ textShadow: '0px 0px 32px rgba(239, 244, 252, 0.56)' }}>
                Latest transactions
            </div>
            <div className="flex flex-col items-start gap-3 self-stretch">
                {totalloading ? (
                    // 加载状态显示骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 self-stretch">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)]"></div>
                            <div className="flex flex-col gap-1 flex-1">
                                <div className="w-24 h-4 rounded bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)]"></div>
                                <div className="w-16 h-3 rounded bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)]"></div>
                            </div>
                            <div className="w-20 h-4 rounded bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)]"></div>
                        </div>
                    ))
                ) : transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                        <div key={index} className="bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] rounded-[12px] p-4">

                            {/* 左侧：图标 + 操作标签 + 时间 */}
                            <div className="flex items-center justify-between gap-3">
                                {/* 图标区域 */}
                                <div className="w-12 h-12 rounded-full bg-[#1A1F2E] flex items-center justify-center border border-[rgba(252,252,252,0.1)]">
                                    <Image
                                        src={transaction.tokenLogo}
                                        alt=""
                                        width={36}
                                        height={36}
                                        className="shrink-0"
                                    />
                                </div>

                                {/* 时间信息 */}
                                <div className="flex-1 flex flex-col gap-1 items-start">
                                    <span
                                        className={`px-1.5 py-1 text-[12px] font-[650] gap-1 inline-flex items-center rounded ${typeColor[transaction.tradeType]} ${textColor[transaction.tradeType]}`}>
                                        <Image
                                            src={(transaction.tradeType == "SELL" || transaction.tradeType == "REMOVE") ? '/arrow-up-right-red.svg' : "/arrow-down-left.svg"}
                                            alt={""}
                                            width={14}
                                            height={14}
                                            className="shrink-0"
                                        />{transaction.tradeType}
                                    </span>
                                    <div className="text-[12px] text-light-gray/40 font-[550] leading-[120%]">
                                        {dayjs(transaction.tradeTime).format('DD.MM.YYYY, HH:mm') || '03.18.2025, 11:22'}
                                    </div>
                                </div>
                                {/* 右侧：数量和价值 */}
                                <div className="flex-1 flex flex-col gap-1 text-right">
                                    <div className="text-[14px] font-[550] text-[#FCFCFC] leading-[120%]">
                                        {transaction.amount ? `${parseFloat(transaction.amount) > 0 ? '' : ''}${Math.abs(parseFloat(transaction.amount)).toFixed(2)} YT sSUI` : '1,125 YT sSUI'}
                                    </div>
                                    <div className="text-[12px] text-light-gray/40 font-[550] leading-[120%]">
                                        ~$3,861.37
                                    </div>
                                </div>
                            </div>

                            {/* 底部信息 */}
                            <div className="mt-[18px] flex justify-between items-center gap-1">
                                {/* 类型和到期时间 */}
                                <div className="flex items-center justify-between gap-1">
                                    <div className="flex h-6 px-1.5 py-1 justify-center items-center gap-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-[#1785B7] text-[12px] font-[650] leading-[100%] tracking-[0.12px] uppercase">
                                        YIELD TOKEN
                                    </div>
                                    <div className="flex h-6 px-1.5 py-1 justify-center items-center gap-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-[12px] font-[650] leading-[100%] tracking-[0.12px] uppercase" style={{ color: 'var(--typo-secondary, rgba(252, 252, 252, 0.40))' }}>
                                        {dayjs(transaction.maturity).format('YYYY-MM-DD') || '2026-02-19'}
                                    </div>
                                </div>

                                {/* 哈希值 */}
                                <div className="text-[14px] text-[#FFF] font-[550] leading-[128%] tracking-[0.14px] underline text-right">
                                    {shortHash(transaction.tx || '', 5)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center w-full py-8">
                        <div className="text-[14px] font-[400] text-[#FCFCFC66]">
                            暂无交易记录
                        </div>
                    </div>
                )}
                {
                    isMobileHistory ? (isPage && data && (
                        <div className="flex justify-center items-center gap-[5px] mt-[6px] text-[12px] font-[600] mx-auto">
        
                            {(() => {
                                const pageIndex = data.page.pageIndex;
                                const pageSize = data.page.pageSize;
                                const totalPages = Math.max(
                                    1,
                                    Math.ceil(data.count / pageSize),
                                );
        
                                return (
                                    <>
                                        {/* FIRST */}
                                        <button
                                            className={`h-6 px-1.5 py-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] ${pageIndex === 1 ? 'text-light-gray/40' : 'text-[#FCFCFC]'} transition font-[650] text-[12px] leading-[100%] tracking-[0.12px] uppercase`}
                                            disabled={pageIndex === 1}
                                            onClick={() => setPageIndex(1)}
                                        >
                                            FIRST
                                        </button>
        
                                        {/* < */}
                                        <button
                                            className={`w-[29px] h-6 px-1.5 py-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-[#1785B7] transition font-[650] text-[12px] leading-[100%] tracking-[0.12px] uppercase ${pageIndex === 1 ? 'text-light-gray/40' : 'text-[#FCFCFC]'}`}
                                            disabled={pageIndex === 1}
                                            onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                        >
                                            &lt;
                                        </button>
        
                                        {/* PAGE X OF Y */}
                                        <div className="flex w-[88px] h-6 px-[6px] py-1 justify-center items-center flex-shrink-0 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-light-gray/40 font-[650] text-[12px] leading-[100%] tracking-[0.12px] uppercase select-none">
                                            PAGE&nbsp;{pageIndex}&nbsp;OF&nbsp;{totalPages}
                                        </div>
        
                                        {/* > */}
                                        <button
                                            className={`w-[29px] h-6 px-[6px] py-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-[#1785B7] transition font-[650] text-[12px] leading-[100%] tracking-[0.12px] uppercase ${pageIndex === totalPages ? 'text-light-gray/40' : 'text-[#FCFCFC]'}`}
                                            disabled={pageIndex === totalPages}
                                            onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                                        >
                                            &gt;
                                        </button>
        
                                        {/* LAST */}
                                        <button
                                            className={`h-6 px-[6px] py-1 rounded-[8px] bg-[rgba(23,133,183,0.10)] text-[#1785B7] transition font-[650] text-[12px] leading-[100%] tracking-[0.12px] uppercase ${pageIndex === totalPages ? 'text-light-gray/40' : 'text-[#FCFCFC]'}`}
                                            disabled={pageIndex === totalPages}
                                            onClick={() => setPageIndex(totalPages)}
                                        >
                                            LAST
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )) : (
                        <div
                            className="flex px-[10px] py-2 justify-center items-center gap-2 self-stretch rounded-[999px] mt-[18px] cursor-pointer"
                            onClick={() => router.push('/portfolio/history')}
                        >
                            <Image src="/protfolio/up-right.svg" alt="" width={17} height={16} />
                            <div className="text-[14px] font-[550] text-[#FCFCFC] leading-[120%] text-center">
                                View full history
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
