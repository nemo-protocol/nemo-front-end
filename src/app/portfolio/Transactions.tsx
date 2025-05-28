import React from 'react';

const transactionsData = [
    {
        date: '2025-03-09 13:00',
        maturity: '2026-02-19',
        asset: 'YT sSUI',
        type: 'BUY',
        amount: '51,125 ~ $72,648.625',
        link: '0x91f.....379b7',
        status: 'COMPLETED',
    },
    {
        date: '2025-03-09 13:00',
        maturity: '2026-02-19',
        asset: 'YT sSUI',
        type: 'SELL',
        amount: '1,251,125 ~ $479,180.875',
        link: '0x91f.....379b7',
        status: 'FAILED',
    },
    {
        date: '2025-03-09 13:00',
        maturity: '2026-02-19',
        asset: 'LP sSUI',
        type: 'ADD',
        amount: '1,821,251,125 ~ $180,303,861.375',
        link: '0x91f.....379b7',
        status: 'COMPLETED',
    },
    {
        date: '2025-03-09 13:00',
        maturity: '2026-02-19',
        asset: 'LP sSUI',
        type: 'REMOVE',
        amount: '1,821,251,125 ~ $180,303,861.375',
        link: '0x91f.....379b7',
        status: 'COMPLETED',
    },
    {
        date: '2025-03-09 13:00',
        maturity: '2025-04-19',
        asset: 'PT sSUI',
        type: 'REDEEM',
        amount: '1,821,251,125 ~ $180,303,861.375',
        link: '0x91f.....379b7',
        status: 'COMPLETED',
    },
    {
        date: '2025-03-09 13:00',
        maturity: '2026-02-19',
        asset: 'LP sSUI',
        type: 'CLAIM',
        amount: '1,821,251,125 ~ $180,303,861.375',
        link: '0x91f.....379b7',
        status: 'COMPLETED',
    },
];

export default function Transactions() {
    return (
        <div className="mt-10 mx-auto max-w-7xl px-4">
            <h2 className="text-2xl font-semibold text-[#FCFCFC] mb-4">Latest Transactions</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-[#0c1119]">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">DATE</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">MATURITY</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">ASSET</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">TYPE</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">AMOUNT</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">LINK</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-[#FCFCFC]">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#0f151c]">
                        {transactionsData.map((transaction, index) => (
                            <tr key={index} className="hover:bg-[#1b1f25] transition duration-300">
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">{transaction.date}</td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">{transaction.maturity}</td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">{transaction.asset}</td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">
                                    <span className={`px-2 py-1 rounded ${transaction.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {transaction.type}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">{transaction.amount}</td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">
                                    <a href="#" className="text-blue-500 hover:underline">{transaction.link}</a>
                                </td>
                                <td className="px-4 py-2 text-sm text-[#FCFCFC]">
                                    <span className={`px-2 py-1 rounded ${transaction.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {transaction.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <a href="#" className="text-blue-500 hover:underline">View full history</a>
            </div>
        </div>
    );
}
