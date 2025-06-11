import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import { LpPosition, PyPosition } from '@/hooks/types';
import { PortfolioItem } from '@/queries/types/market';
import React, { useEffect } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { formatPortfolioNumber } from '@/lib/utils';
import ReactDOM from 'react-dom';



interface Props {
    open: boolean;
    onClose: () => void;
    onClaimAll: () => void;
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
    claimLoading: boolean
}

/**
 * 一个完全与业务解耦的弹窗组件：
 * open        —— 是否可见
 * rewards     —— 表格数据
 * onClose     —— 点击遮罩 / X 按钮关闭
 * onClaimAll  —— 底部「Claim All」按钮回调
 */
const UnclaimedRewardModal: React.FC<Props> = ({
    open,
    filteredLists,
    pyPositionsMap,
    lpPositionsMap,
    marketStates,
    ytReward,
    lpReward,
    onClose,
    onClaimAll,
    claimLoading
}) => {
    // 禁用背景滚动
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
    }, [open]);

    if (!open) return null;

    // 使用 Portal 渲染到 <body>
    return <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
    >
        <div
            className="w-full max-w-3xl  rounded-xl p-6 text-white shadow-2xl border border-[#6D7177] bg-[#0c0d0f]"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 头部 */}
            <header className="mb-4 flex items-center justify-between">
                <div className="text-[32px] font-[470] font-serif font-Medium  font-[#FCFCFC]">Unclaimed Reward</div>
                <button
                    className="text-xl text-gray-400 transition-colors hover:text-gray-200"
                    onClick={onClose}
                >
                    <Image
                        src={'/close.svg'}
                        alt={""}
                        width={18}
                        height={18}
                        className="shrink-0"
                    />
                </button>
            </header>

            {/* 表格 */}
            <div className="scrollbar-thin bg-[#141618] py-4 pl-6 rounded-xl scrollbar-track-transparent mt-4 scrollbar-thumb-gray-700 overflow-y-auto">
                <table className="w-full  text-sm">
                    <thead>
                        <tr className="text-left text-[12px] font-[600] text-white/60">
                            <th className="py-2">Type</th>
                            <th className="py-2">Asset</th>
                            <th className="py-2">Maturity</th>
                            <th className="py-2">Reward</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLists.yt.map((item, index) => {
                            return <tr key={index} className=" text-[14px] font-[500] text-[#FCFCFC]">
                                <td className="py-3 ">
                                    {"YT Yield"}
                                </td>
                                <td className="py-3  flex gap-x-2">
                                    <Image
                                        src={item.coinLogo}
                                        alt={""}
                                        width={24}
                                        height={24}
                                        className="shrink-0"
                                    />YT {item.coinName}</td>

                                <td className="py-3">
                                    <div className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]`}>
                                        {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                    </div>
                                </td>
                                <td className="py-3  flex gap-x-2 font-[500] text-[14px] text-[#FCFCFC]"><Image
                                    src={item.underlyingCoinLogo}
                                    alt={""}
                                    width={24}
                                    height={24}
                                    className="shrink-0"
                                />{item.underlyingCoinName}</td>

                                <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                                    <span>
                                        {new Decimal(ytReward?.[item.id] || 0).mul(item.conversionRate).lt(0.01) && "<"}
                                        {formatPortfolioNumber(new Decimal(ytReward?.[item.id] || 0).mul(item.conversionRate))}
                                    </span>

                                </td>
                                <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">


                                    ~{new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice).lt(0.01) && "<"}
                                    ${formatPortfolioNumber(new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice))}

                                </td>

                            </tr>
                        })}
                        {lpReward && filteredLists.lp.map((item, index) => {
                            return marketStates[item.marketStateId]?.rewardMetrics.map((rewardMetric) => (lpReward[item.id + rewardMetric.tokenName] != "0" &&
                                <tr key={index + rewardMetric?.tokenType} className=" text-[14px] font-[500] text-[#FCFCFC]">
                                    <td className="py-3 ">
                                        {"Incentive"}
                                    </td>
                                    <td className="py-3  flex gap-x-2">
                                        <Image
                                            src={item.coinLogo}
                                            alt={""}
                                            width={24}
                                            height={24}
                                            className="shrink-0"
                                        />LP {item.coinName}</td>

                                    <td className="py-3">
                                        <div className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]`}>
                                            {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
                                        </div>
                                    </td>
                                    <td className="py-3  flex gap-x-2 font-[500] text-[14px] text-[#FCFCFC]"><Image
                                        src={rewardMetric.tokenLogo}
                                        alt={""}
                                        width={24}
                                        height={24}
                                        className="shrink-0"
                                    />{rewardMetric.tokenName}</td>

                                    <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                                        <span>
                                            {new Decimal(lpReward[item.id + rewardMetric.tokenName]).lt(0.01) && "<"}

                                            {formatPortfolioNumber(lpReward[item.id + rewardMetric.tokenName])}

                                        </span>

                                    </td>
                                    <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
                                        ~{new Decimal(lpReward[item.id + rewardMetric.tokenName]).mul(rewardMetric.tokenPrice).lt(0.01) && "<"}
                                        ${formatPortfolioNumber(new Decimal(lpReward[item.id + rewardMetric.tokenName]).mul(rewardMetric.tokenPrice))}
                                    </td>
                                </tr>
                            )
                            )
                        }
                        )
                        }
                    </tbody>
                </table>
            </div>

            {/* Claim All */}
            <button
                className="mt-5 w-full rounded-[16px] bg-[#2b76e4] py-2 text-[14px] font-[500] transition disabled:cursor-not-allowed disabled:opacity-40 relative"
                disabled={!claimLoading}
                onClick={onClaimAll}
            >
                {!claimLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                        <svg
                            className="h-4 w-4 animate-spin text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="opacity-25"
                            />

                            <path
                                d="M12 2 a 10 10 0 0 1 10 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                className="opacity-75"
                            />
                        </svg>
                        <span>Claiming</span>
                    </span>
                ) : (
                    'Claim All'
                )}
            </button>
        </div>
    </div>
};

export default UnclaimedRewardModal;
