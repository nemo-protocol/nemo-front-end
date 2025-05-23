'use client';

import { useState } from 'react';

import TradeTabs from './TradeTabs';

export default function TradeYTCard() {
  const [tradeSize, setTradeSize] = useState(234);
  const [tabs, setTabs] = useState<'yt' | 'pt' | 'mint'>('yt');

  return (
    <div className="bg-[#101823] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-light">Trade YT</h2>
        <span className="text-xs bg-slate-700 rounded-full px-1.5">i</span>
      </div>

      {/* Tab 切换 */}
      <TradeTabs current={tabs} onChange={setTabs} />

      {/* 输入框 */}
      <div className="bg-[#0f1624] rounded-xl p-4 flex justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase">Trade</p>
          <input
            className="bg-transparent text-2xl outline-none w-24"
            value={tradeSize}
            type="number"
            min={0}
            onChange={(e) => setTradeSize(+e.target.value)}
          />
          <p className="text-xs text-slate-500">
            ≈ ${(tradeSize * 2.18).toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">xSUI</p>
          <p className="text-xs text-slate-500">0.00 xSUI</p>
        </div>
      </div>

      {/* swap icon */}
      <div className="self-center bg-[#192130] rounded-full p-3">
        {/* <IoMdSwap className="w-5 h-5" /> */}
      </div>

      {/* 输出框 */}
      <div className="bg-[#0f1624] rounded-xl p-4 flex justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase">Receive</p>
          <p className="text-2xl">{(tradeSize * 53.6).toFixed(3)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg">YT xSUI</p>
          <p className="text-xs text-slate-500">128 days left · 19 Feb 2026</p>
        </div>
      </div>

      {/* 详情行 */}
      <div className="text-sm text-slate-400 flex flex-col gap-2 pt-4 border-t border-slate-800">
        <p className="flex justify-between">
          <span>Yield APY Change</span>
          <span className="text-white">9.98% → 10.00%</span>
        </p>
        <p className="flex justify-between">
          <span>Price</span>
          <span className="text-white">1 xSUI = 0.0000 YT xSUI</span>
        </p>
        <p className="flex justify-between">
          <span>Trading Fees</span>
          <span className="text-white">-</span>
        </p>
        <p className="flex justify-between">
          <span>Slippage</span>
          <span className="text-white">0.5%</span>
        </p>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4 pt-4">
        <button
          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-full flex items-center justify-center gap-2"
        >
          ⨯ Change Network
        </button>
        <button
          className="flex-1 bg-[#1b2738] hover:bg-[#243448] text-white py-3 rounded-full flex items-center justify-center gap-2"
        >
          🧮 Calculate
        </button>
      </div>
    </div>
  );
} 