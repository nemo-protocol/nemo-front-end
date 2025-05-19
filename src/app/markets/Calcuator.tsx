'use client';

import { useMemo, useState } from 'react';

type Props = {
  /** 市场的平均 APY，用来与目标 APY 做比较 */
  averageFutureAPY?: number; // 默认 20%
};

export default function Calculator({ averageFutureAPY = 20 }: Props) {
  /* =============== 输入状态 =============== */
  const [tradeSize, setTradeSize] = useState<number>(234); // 假设 234 美元
  const [token] = useState('xSUI');                       // 只有一个币可选
  const [targetAPY, setTargetAPY] = useState<number>(20); // 目标 APY (%)

  /* =============== 计算逻辑 =============== */
  const result = useMemo(() => {
    // 假设买 YT 的收益 = (目标 APY – 市场平均 APY)
    const netProfitYT         = tradeSize * (targetAPY - averageFutureAPY) / 100;
    const netProfitUnderlying = tradeSize * averageFutureAPY / 100;

    return {
      netProfitYT,
      netProfitUnderlying,
      effectiveApyYT: (netProfitYT         / tradeSize) * 100,
      effectiveApyUA: (netProfitUnderlying / tradeSize) * 100,
    };
  }, [tradeSize, targetAPY, averageFutureAPY]);

  /* =============== UI =============== */
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-slate-100">
      {/* ------------------- 标题 ------------------- */}
      <h2 className="text-3xl md:text-4xl font-light mb-8 flex items-center gap-1">
        Yield calculator
        <span className="text-[10px] border rounded-full px-1.5">i</span>
      </h2>

      {/* ------------------- 输入卡片 ------------------- */}
      <div className="bg-[#0f1624] rounded-xl p-6 grid md:grid-cols-2 gap-8">
        {/* 左侧：交易大小 */}
        <div>
          <label className="text-xs tracking-widest text-slate-400 uppercase">
            Trade
          </label>

          <div className="flex items-baseline gap-2 mt-2">
            <input
              type="number"
              className="bg-transparent text-2xl outline-none w-28"
              value={tradeSize}
              min={0}
              onChange={(e) => setTradeSize(+e.target.value)}
            />
            <span className="text-lg">{token}</span>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            ≈ $
            {tradeSize.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* 右侧：目标 APY */}
        <div>
          <label className="text-xs tracking-widest text-slate-400 uppercase">
            Target average future APY
          </label>

          <div className="flex items-baseline gap-2 mt-2">
            <input
              type="number"
              className="bg-transparent text-2xl outline-none w-20"
              value={targetAPY}
              min={0}
              max={100}
              onChange={(e) => setTargetAPY(+e.target.value)}
            />
            <span className="text-xl">%</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={targetAPY}
            onChange={(e) => setTargetAPY(+e.target.value)}
            className="w-full mt-6 accent-blue-500"
          />
        </div>
      </div>

      {/* 平均 APY 说明 */}
      <p className="mt-4 text-sm text-slate-400">
        Average Future APY&nbsp;
        <span className="text-white font-semibold">
          {averageFutureAPY}%
        </span>
      </p>

      {/* 计算按钮（这里只是装饰，实际计算已实时完成） */}
      <button
        className="w-full mt-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2 select-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          className="w-4 h-4"
          viewBox="0 0 16 16"
        >
          <path d="M10.854 3.646a.5.5 0 0 0-.708 0L4.793 9H7.5a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1-.5-.5V5.5a.5.5 0 0 1 1 0v2.707l5.354-5.353a.5.5 0 0 0 0-.708z" />
        </svg>
        Calculate
      </button>

      {/* ------------------- 结果 ------------------- */}
      <section className="mt-14">
        <h3 className="text-3xl font-light mb-2 flex items-center gap-1">
          Calculation result
          <span className="text-[10px] border rounded-full px-1.5">i</span>
        </h3>
        <p className="text-sm text-slate-500">
          All calculations are approximate
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Net Profit */}
          <div className="bg-[#0f1624] rounded-xl p-6">
            <h4 className="text-2xl font-light mb-6 flex items-center gap-1">
              Net profit
              <span className="text-[10px] border rounded-full px-1.5">i</span>
            </h4>

            <div className="flex justify-between text-lg">
              <div>
                <p className="text-sm text-slate-400">Buy YT</p>
                <p>${result.netProfitYT.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Hold underlying asset</p>
                <p>${result.netProfitUnderlying.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Effective APY */}
          <div className="bg-[#0f1624] rounded-xl p-6">
            <h4 className="text-2xl font-light mb-6 flex items-center gap-1">
              Effective APY
              <span className="text-[10px] border rounded-full px-1.5">i</span>
            </h4>

            <div className="flex justify-between text-lg">
              <div>
                <p className="text-sm text-slate-400">Buy YT</p>
                <p>{result.effectiveApyYT.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Hold underlying asset</p>
                <p>{result.effectiveApyUA.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
