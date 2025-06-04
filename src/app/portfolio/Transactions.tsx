import React from 'react';
import dayjs from 'dayjs';
import { useMarketTransactions } from '@/hooks/useMarketTransactions';
import { isExpired } from './Assets';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';


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
    /* 每页 10 条，自动拉取 */
    const {
        data,
        loading,
        error,
        setPageIndex,
    } = useMarketTransactions({ pageSize: 10 });
    const pathname = usePathname();   
    const isPage = pathname.startsWith('/portfolio/history');
    if (error) return <div className="text-center mt-8 text-red-500">{error.message}</div>;

    const transactions = data?.data ?? [];

    return (
        <>{transactions.length !== 0 &&<div className="mt-10 mx-auto mx-7.5 px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">

            {!isPage && <div className="flex gap-8 items-center justify-between mb-6">
                <div className="text-[32px] font-serif font-normal font-[470] text-[#FCFCFC]">Latest transactions</div>

                <Link href="/portfolio/history" className="ursor-pointer px-2.5 py-1.5 gap-2 items-center rounded-[16px]
                                    transition-colors duration-200 text-[14px] font-[550]
                                   text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)] cursor-pointer inline-flex">
                    <ArrowUpRight className='size-4' />View full history
                </Link>
            </div>}

            <div className="overflow-x-auto">
                <table className={`min-w-full border-collapse  border-separate ${transactions.length === 0 ? 'border-spacing-y-4' : "border-spacing-y-0.5"}`}>
                    <thead className="text-white/60">
                        <tr>
                            <th className="py-2  w-[180px] text-left text-[12px] font-[650]">DATE</th>
                            <th className="py-2 w-[180px] text-left text-[12px] font-[650]">MATURITY</th>
                            <th className="py-2 w-[180px] text-left text-[12px] font-[650]">ASSET</th>
                            <th className="py-2 w-[180px] text-left text-[12px] font-[650]">TYPE</th>
                            <th className="py-2 w-[180px] text-left text-[12px] font-[650]">AMOUNT</th>
                            <th className="py-2 text-left text-[12px] font-[650]">LINK</th>
                            <th className="py-2 text-right text-[12px] font-[650]">STATUS</th>
                        </tr>
                    </thead>

                    <tbody className="text-[#FCFCFC]">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="">
                                <td className="py-3 text-[14px] font-[550]">
                                    {dayjs(Number(tx.tradeTime)).format('YYYY-MM-DD HH:mm')}
                                </td>
                                <td className="py-3">
                                    <div className={`text-[12px] font-[650] py-1 px-1.5 rounded-[8px] inline-flex 
                                            ${isExpired(tx.maturity.toString()) ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]' : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'}`}>
                                        {dayjs(Number(tx.maturity)).format("YYYY-MM-DD")}
                                    </div>
                                </td>
                                <td className="py-3 text-[20px] font-[550]">{tx.asset}</td>

                                <td className="py-3 ">
                                    <span
                                        className={`px-1.5 py-1 text-[12px] font-[650] gap-1 inline-flex items-center rounded ${typeColor[tx.tradeType]} ${textColor[tx.tradeType]}`}>
                                        <Image
                                            src={(tx.tradeType == "SELL" || tx.tradeType == "REMOVE") ? '/arrow-up-right-red.svg' : "/arrow-down-left.svg"}
                                            alt={""}
                                            width={14}
                                            height={14}
                                            className="shrink-0"
                                        />{tx.tradeType}
                                    </span>
                                </td>

                                <td className="py-3 text-[14px] font-[550] ">
                                    {Number(tx.amount).toLocaleString()}
                                </td>

                                <td className="py-3">
                                    <Link
                                        href={`https://suiscan.xyz/mainnet/tx/${tx.tx}`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="text-[#ffffff] text-[14px] font-[550] cursor-pointer underline"
                                    >
                                        {shortHash(tx.tx)}
                                    </Link>
                                </td>

                                <td className="py-3 text-right">
                                    <span
                                        className={`px-1.5 py-1 text-[12px] font-[650] gap-1 inline-flex items-center rounded ${typeColor[tx.processType]} ${textColor[tx.processType]}`}>
                                        {tx.processType === 'success' ? 'COMPLETED'
                                            : tx.processType === 'failed' ? 'FAILED'
                                                : tx.processType || 'UNKNOWN'}
                                    </span>
                                </td>
                            </tr>
                        ))}

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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* <div className="flex justify-center gap-6 mt-6">
                <button
                    className="px-3 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-30"
                    disabled={data?.page.pageIndex === 1}
                    onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                >
                    Prev
                </button>

                <button
                    className="px-3 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-30"
                    disabled={transactions.length < (data?.page.pageSize ?? 10)}
                    onClick={() => setPageIndex(p => p + 1)}
                >
                    Next
                </button>
            </div> */}


        </div>}</>
    );
}
