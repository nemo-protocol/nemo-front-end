import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import Slider from '@/components/Slider';
import { CoinConfig } from '@/queries/types/market';
import { formatDecimalValue } from '@/lib/utils';
import { getMaturityStat } from './StatCard';

type Props = {
  averageFutureAPY?: number;
  open: boolean;
  onClose: () => void;
  inputYT: number;
  outputYT: number;
  coinConfig: CoinConfig
};
export interface CalcEffectiveApyParams {
  netProfit: number;
  ytAmount: number;
  input: number;
  underlyingPrice: number;
  targetApy: number;
}


export function calcEffectiveApyBuyYT(
  {
    netProfit,
    ytAmount,
    input,
    underlyingPrice,
    targetApy,
  }: CalcEffectiveApyParams,
): number {
  if (
    ytAmount <= 0 ||
    input <= 0 ||
    underlyingPrice <= 0
  ) {
    throw new Error('ytAmount, underlyingAmount, underlyingPrice must be positive.');
  }

  const base1 = 1 + netProfit / (ytAmount * underlyingPrice);

  const base2 = 1 + netProfit / (input * underlyingPrice);

  if (base1 <= 0 || base2 <= 0) {
    throw new Error('Invalid base for logarithm / power.');
  }
  const exponent = Math.log(1 + targetApy) / Math.log(base2) - 1;

  const effectiveApy = Math.pow(base1, exponent);

  return effectiveApy;
}

export default function Calculator({
  open,
  averageFutureAPY,
  onClose,
  inputYT,
  outputYT,
  coinConfig
}: Props) {
  const [tradeSize, setTradeSize] = useState<number>(inputYT);
  const [targetAPY, setTargetAPY] = useState<number>(20);
  const [calculatedResults, setCalculatedResults] = useState<any>(null); // State to hold calculation results
  const [showResults, setShowResults] = useState(false); // State to manage result visibility


  const [yieldOpen, setYieldOpen] = useState(false);
  const [calculationOpen, setCalculationOpen] = useState(false)
  const [profitOpen, setProfitOpen] = useState(false)
  const [effectiveOpen, setEffectiveOpen] = useState(false)


  if (!open) return null;

  // Function to handle calculations
  const handleCalculate = () => {
    const underlyingPrice = Number(coinConfig.underlyingPrice)
    const now = Date.now();
    const maturity = Math.max(0, Math.ceil((Number(coinConfig.maturity) - now) / 86_400_000)-1)
    const netProfitYT = (outputYT * targetAPY * 0.01) * (maturity / 365) - inputYT * underlyingPrice;
    const netProfitUnderlying = (inputYT * underlyingPrice * targetAPY * maturity * 0.01) / 365;

    const apr = (netProfitYT) * (365 / maturity) / inputYT * underlyingPrice
    const effectiveApyYT = (Math.pow((1+apr/(365/maturity)), (365/maturity))-1)*100
    console.log(outputYT, underlyingPrice, targetAPY, maturity, inputYT, netProfitYT,apr)

   
    const effectiveApyUA = targetAPY;

    setCalculatedResults({
      netProfitYT,
      netProfitUnderlying,
      effectiveApyYT,
      effectiveApyUA,
    });
    setShowResults(true); // Show results after calculating
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080d16]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[100vh]  rounded-xl text-slate-100">
        <button className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="px-0 py-0">
          <div className="flex gap-1">
            <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] font-normal font-serif">{"Yield calculator"}</h1>

            <div className="relative mt-1">
              <button
                onClick={() => setYieldOpen(o => !o)}
                className="text-xs rounded-full
                     inline-flex justify-center leading-none
                     w-4 h-8 select-none cursor-pointer"
              >
                <Image
                  src={"/tip.svg"}
                  alt={""}
                  width={16}
                  height={16}
                  className="shrink-0"
                />
              </button>

              {yieldOpen && (
                <div
                  className="
              absolute top-0 left-0.5 ml-4 w-[480px]  rounded-xl border
              border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
              animate-fade-in z-10
            "
                >
                  {"The Yield Calculator helps you to predict the potential returns from various strategies on Nemo."}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-8 ">
            <div className="bg-[rgba(252,252,252,0.03)] flex justify-between rounded-xl py-6 px-4 ">
              <div>
                <label className="text-[12px] font-[650] text-[#FCFCFC66] uppercase">Trade</label>
                <div className="flex items-baseline gap-1.5 mt-0">
                  <span className="text-[20px] text-[#FCFCFC]">{inputYT}</span>
                  <span className="text-[12px] text-[#FCFCFC66]">~ ${formatDecimalValue(Number(inputYT) * Number(coinConfig.underlyingPrice), 6)}</span>
                </div>
              </div>
              <div className="text-lg flex gap-2 items-center">{coinConfig.underlyingCoinName}
                <Image src={coinConfig.underlyingCoinLogo} alt={""} width={20} height={20} className="shrink-0" />
              </div>
            </div>
            <div className="bg-[rgba(252,252,252,0.03)] rounded-xl py-4 ">
              <div className='px-4 '>
                <label className="text-[12px] font-[650] text-[#FCFCFC66] uppercase">Target average future APY</label>
                <div className="flex items-baseline gap-2 mt-0 mb-1">
                  <input type="number" className="bg-transparent text-[20px] appearance-none text-[#FCFCFC] outline-none w-40" value={targetAPY} min={0} max={100} onChange={(e) => setTargetAPY(+e.target.value)} />
                  <span className="text-xl text-[#FCFCFC66]">%</span>
                </div>
              </div>
              <Slider value={targetAPY} min={0} max={100} step={0.5} onChange={setTargetAPY} />
            </div>
          </div>
          <p className="mt-6 text-sm text-[#FCFCFC66] font-[550]">
            Average Future APY&nbsp;
            <span className="text-[#FCFCFC] ml-2.5 font-[550]">{targetAPY}%</span>
          </p>
          <button
            className="w-full mt-6 h-[42px] rounded-[16px] cursor-pointer bg-[#2E81FCE5] hover:bg-[#2E81FCc5] transition flex items-center justify-center gap-2 select-none text-[14px] text-[#FCFCFC] font-[550]"
            onClick={handleCalculate}  // Call handleCalculate on button click
            disabled={!outputYT||!inputYT}
          >
            <Image src={"/calculator.svg"} alt={""} width={16} height={16} className="shrink-0" />
            Calculate
          </button>
          {showResults && calculatedResults && (  // Display results if calculatedResults is available
            <section className="mt-12">
              <div className="flex gap-1">
                <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] font-normal font-serif">{" Calculation result"}</h1>

                <div className="relative mt-1">
                  <button
                    onClick={() => setCalculationOpen(o => !o)}
                    className="text-xs rounded-full
                     inline-flex justify-center leading-none
                     w-4 h-8 select-none cursor-pointer"
                  >
                    <Image
                      src={"/tip.svg"}
                      alt={""}
                      width={16}
                      height={16}
                      className="shrink-0"
                    />
                  </button>

                  {calculationOpen && (
                    <div
                      className="
              absolute top-0 left-0.5 ml-4 w-[480px]  rounded-xl border
              border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
              animate-fade-in z-10
            "
                    >
                      {"The results show the values under the expected APY."}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-[#FCFCFC66] mt-4 font-[550]">All calculations are approximate</div>
              <div className="grid md:grid-cols-2 gap-2 mt-6">
                {/* Net Profit */}
                <div className="bg-[#FCFCFC08] rounded-xl p-6">
                  <div className="flex gap-1">
                    <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] font-normal font-serif">{"Net profit"}</h1>

                    <div className="relative mt-1">
                      <button
                        onClick={() => setProfitOpen(o => !o)}
                        className="text-xs rounded-full
                     inline-flex justify-center leading-none
                     w-4 h-8 select-none cursor-pointer"
                      >
                        <Image
                          src={"/tip.svg"}
                          alt={""}
                          width={16}
                          height={16}
                          className="shrink-0"
                        />
                      </button>

                      {profitOpen && (
                        <div
                          className="
              absolute top-0 left-0.5 ml-4 w-[480px]  rounded-xl border
              border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
              animate-fade-in z-10
            "
                        >
                          {"The Net Profit module compares the expected profit of buying YT users versus holders, under the expected APY at maturity."}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex mt-10 justify-between text-lg">
                    <div>
                      <div className="text-[20px] font-[550] text-[#FCFCFC]">${calculatedResults.netProfitYT.toFixed(3)}</div>
                      <div className="text-[12px] font-[650] text-[#FCFCFC66] mt-0">Buy YT</div>
                    </div>
                    <div>
                      <div className="text-[20px] font-[550] text-[#FCFCFC]">${calculatedResults.netProfitUnderlying.toFixed(3)}</div>
                      <div className="text-[12px] font-[650] text-[#FCFCFC66] mt-0">Hold underlying asset</div>
                    </div>
                  </div>
                </div>
                {/* Effective APY */}
                <div className="bg-[#FCFCFC08] rounded-xl p-6">
                  <div className="flex gap-1">
                    <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] font-normal font-serif">{"Effective APY"}</h1>

                    <div className="relative mt-1">
                      <button
                        onClick={() => setEffectiveOpen(o => !o)}
                        className="text-xs rounded-full
                     inline-flex justify-center leading-none
                     w-4 h-8 select-none cursor-pointer"
                      >
                        <Image
                          src={"/tip.svg"}
                          alt={""}
                          width={16}
                          height={16}
                          className="shrink-0"
                        />
                      </button>

                      {effectiveOpen && (
                        <div
                          className="
              absolute top-0 left-0.5 ml-4 w-[480px]  rounded-xl border
              border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
              animate-fade-in z-10
            "
                        >
                          {"The Effective APY module compares the expected APY of users buying YT versus holding the underlying asset."}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex mt-10 justify-between">
                    <div>
                      <div className="text-[20px] font-[550] text-[#FCFCFC]">{calculatedResults.effectiveApyYT.toFixed(2)}%</div>
                      <div className="text-[12px] font-[650] text-[#FCFCFC66] mt-0">Buy YT</div>
                    </div>
                    <div>
                      <div className="text-[20px] font-[550] text-[#FCFCFC]">{calculatedResults.effectiveApyUA.toFixed(2)}%</div>
                      <div className="text-[12px] font-[650] text-[#FCFCFC66] mt-0">Hold underlying asset</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}