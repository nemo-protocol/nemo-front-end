"use client"
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useMarketTransactions } from '@/hooks/useMarketTransactions';
import { isExpired } from './Assets';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import EmptyData from '@/components/ui/empty';
import { useWallet } from '@nemoprotocol/wallet-kit';


const typeColor: Record<string, string> = {
    BUY: 'bg-[rgba(76,200,119,0.1)]',
    ADD: 'bg-[rgba(76,200,119,0.1)]',
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
    return `${hash.slice(0, len)}…${hash.slice(-len)}`;
}

export default function Transactions() {
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
        <>{<div className="mt-10 mx-7.5 px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">

            {!isPage && <div className="flex gap-8 items-center justify-between mb-6">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Latest transactions</div>

                {data && data.count > 5 && <Link href="/portfolio/history" className="ursor-pointer px-2.5 py-1.5 gap-2 items-center rounded-[16px]
                                    transition-colors duration-200 text-[14px] font-[500]
                                   text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)] cursor-pointer inline-flex">
                    <ArrowUpRight className='size-4' />View full history
                </Link>}
            </div>}

            <div className="w-full overflow-x-auto">
                <table className={`w-max min-w-[calc(100vw-128px)] border-collapse  border-separate ${transactions.length === 0 ? 'border-spacing-y-4' : "border-spacing-y-0.5"}`}>
                    <thead className="text-white/60">
                        <tr>
                            <th className="py-2  w-[15%] text-left text-[12px] font-[600]">DATE</th>
                            <th className="py-2 w-[13%] text-left text-[12px] font-[600]">MATURITY</th>
                            <th className="py-2 w-[15%] text-left text-[12px] font-[600]">ASSET</th>
                            <th className="py-2 w-[13%] text-left text-[12px] font-[600]">TYPE</th>
                            <th className="py-2 w-[12%] text-left text-[12px] font-[600]">AMOUNT</th>
                            <th className="py-2 w-[15%] text-left text-[12px] font-[600]">LINK</th>
                            <th className="py-2 text-right text-[12px] font-[600]">STATUS</th>
                        </tr>
                    </thead>

                    <tbody className="text-[#FCFCFC]">
                        {transactions.map((tx, index) => (
                            <tr key={tx.id} className="">
                                <td className="py-3 text-[14px] font-[500]">
                                    {dayjs(Number(tx.tradeTime)).format('YYYY-MM-DD HH:mm')}
                                </td>
                                <td className="py-3">
                                    <div className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex 
                                            ${isExpired(tx.maturity.toString()) ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]' : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'}`}>
                                        {dayjs(Number(tx.maturity)).format("YYYY-MM-DD")}
                                    </div>
                                </td>
                                <td className="py-3 text-[20px] flex gap-1 font-[500]">
                                    {tx.tokenLogo && <Image
                                        src={tx.tokenLogo || ""}
                                        alt={""}
                                        width={24}
                                        height={24}
                                        className="shrink-0"
                                    />}{tx.asset}</td>

                                <td className="py-3 ">
                                    <span
                                        className={`px-1.5 py-1 text-[12px] font-[600] gap-1 inline-flex items-center rounded ${typeColor[tx.tradeType]} ${textColor[tx.tradeType]}`}>
                                        <Image
                                            src={(tx.tradeType == "SELL" || tx.tradeType == "REMOVE") ? '/arrow-up-right-red.svg' : "/arrow-down-left.svg"}
                                            alt={""}
                                            width={14}
                                            height={14}
                                            className="shrink-0"
                                        />{tx.tradeType}
                                    </span>
                                </td>

                                <td className="py-3 text-[14px] font-[500] ">
                                    {Number(tx.amount).toLocaleString()}
                                </td>

                                <td className="py-3">
                                    <Link
                                        href={`https://suiscan.xyz/mainnet/tx/${tx.tx}`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="text-[#ffffff] text-[14px] font-[500] cursor-pointer underline"
                                    >
                                        {shortHash(tx.tx)}
                                    </Link>
                                </td>

                                <td className="py-3 text-right">
                                    <span
                                        className={`px-1.5 py-1 text-[12px] font-[600] gap-1 inline-flex items-center rounded ${typeColor[tx.processType]} ${textColor[tx.processType]}`}>
                                        {tx.processType === 'success' ? 'COMPLETED'
                                            : tx.processType === 'failed' ? 'FAILED'
                                                : tx.processType || 'UNKNOWN'}
                                    </span>
                                </td>
                            </tr>
                        ))}

                        {(totalloading && transactions.length == 0) && [0, 0, 0, 0, 0, 0].map((item, index) => (
                            <tr key={index} className="w-full h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4 overflow-hidden">
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
                <div className='w-full flex items-center'>{((transactions.length == 0 && !totalloading)) && <EmptyData />}</div>
            </div>


            {isPage && data && (
                <div className="flex justify-end gap-3 text-[12px] font-[600] mt-6 transition-all duration-200">

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
                                    className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${!(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                                    disabled={pageIndex === 1}
                                    onClick={() => setPageIndex(1)}
                                >
                                    FIRST
                                </button>

                                {/* < */}
                                <button
                                    className={`w-8  py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${!(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                                    disabled={pageIndex === 1}
                                    onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                >
                                    &lt;
                                </button>

                                {/* PAGE X OF Y */}
                                <div className="px-4 py-1 rounded bg-[#1b1f25] opacity-60  text-[#FCFCFC]/60 select-none">
                                    PAGE&nbsp;{pageIndex}&nbsp;OF&nbsp;{totalPages}
                                </div>

                                {/* > */}
                                <button
                                    className={`w-8  py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${!(pageIndex === totalPages) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                                    disabled={pageIndex === totalPages}
                                    onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                                >
                                    &gt;
                                </button>

                                {/* LAST */}
                                <button
                                    className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${!(pageIndex === totalPages) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                                    disabled={pageIndex === totalPages}
                                    onClick={() => setPageIndex(totalPages)}
                                >
                                    LAST
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}


        </div>}</>
    );
}
