"use client"

import AssetHeader from '../components/AssetHeader'
import StatCard from '../components/StatCard'
import YieldChart from '../components/YieldChart'
import { CoinConfig } from '@/queries/types/market'
import ActionButton from '../components/ActionButton'
import SlippageSetting from '../components/SlippageSetting'
import Tabs from '../components/Tabs'
import AmountInput from '../components/AmountInput'
import { AmountOutput } from '../components/AmountOutput'
import { ChevronsDown } from 'lucide-react'
import { useMemo, useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { parseErrorMessage } from "@/lib/errorMapping"
import { formatDecimalValue, isValidAmount, debounce } from "@/lib/utils"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import { useRatioLoadingState } from "@/hooks/useRatioLoadingState"
import useQueryPtOutBySyInWithVoucher from "@/hooks/dryRun/pt/useQueryPtOutBySyIn"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useCustomSignAndExecuteTransaction from "@/hooks/useCustomSignAndExecuteTransaction"
import useMarketStateData from "@/hooks/useMarketStateData"
import useInvestRatio from "@/hooks/actions/useInvestRatio"
import useGetApproxPtOutDryRun from "@/hooks/dryRun/useGetApproxPtOutDryRun"
import useSwapExactSyForPtDryRun from "@/hooks/dryRun/useSwapExactSyForPtDryRun"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"
import useQueryPtRatio from "@/hooks/useQueryPtRatio"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import useCoinData from "@/hooks/query/useCoinData"

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const [txId, setTxId] = useState("")
  const [warning, setWarning] = useState("")
  const { coinType, maturity } = useParams()
  const [error, setError] = useState<string>()
  const [swapValue, setSwapValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [ptValue, setPtValue] = useState<string>()
  const [ptFeeValue, setPtFeeValue] = useState<string>()
  const [isSwapping, setIsSwapping] = useState(false)
  const [tokenType, setTokenType] = useState<number>(0)
  const [errorDetail, setErrorDetail] = useState<string>()
  const [isCalcPtLoading, setIsCalcPtLoading] = useState(false)
  const [isInitRatioLoading, setIsInitRatioLoading] = useState(false)
  const [conversionRate, setConversionRate] = useState<string>()
  const [ptRatio, setPtRatio] = useState<string>()
  const [syValue, setSyValue] = useState("")
  const [minValue, setMinValue] = useState(0)

  const { mutateAsync: signAndExecuteTransaction } = useCustomSignAndExecuteTransaction()
  const { address } = useWallet()
  const isConnected = useMemo(() => !!address, [address])

  const { data: marketStateData } = useMarketStateData(coinConfig?.marketStateId)

  const { isLoading } = useInputLoadingState(swapValue, false)
  const { isLoading: isRatioLoading } = useRatioLoadingState(false || isCalcPtLoading || isInitRatioLoading)

  const { mutateAsync: queryPtOut } = useQueryPtOutBySyInWithVoucher({
    outerCoinConfig: coinConfig,
  })
  const { mutateAsync: swapExactSyForPtDryRun } = useSwapExactSyForPtDryRun(coinConfig)
  const { data: ptYtData, refresh: refreshPtYt } = useCalculatePtYt(coinConfig, marketStateData)
  const { mutateAsync: calculateRatio } = useInvestRatio(coinConfig)
  const { mutateAsync: getApproxPtOut } = useGetApproxPtOutDryRun(coinConfig)
  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()
  const { data: initPtRatio } = useQueryPtRatio(coinConfig, "1000")

  const { data: coinData } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinType
  )

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

  const coinBalance = useMemo(() => {
    if (coinData?.length) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const insufficientBalance = useMemo(
    () => new Decimal(coinBalance).lt(new Decimal(swapValue || 0)),
    [coinBalance, swapValue]
  )

  useEffect(() => {
    if (coinConfig) {
      const minValue = NEED_MIN_VALUE_LIST.find(
        (item) =>
          item.provider === coinConfig.provider ||
          item.coinType === coinConfig.coinType,
      )?.minValue
      if (minValue) {
        setMinValue(minValue)
      }
    }
  }, [coinConfig])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
            (item) => item.coinType === coinConfig?.coinType,
          )?.vaultId
        : "",
    [coinConfig],
  )

  const debouncedGetPtOut = useCallback(
    (value: string, decimal: number, config?: CoinConfig) => {
      const getPtOut = debounce(async () => {
        if (tokenType === 0 && value && new Decimal(value).lt(minValue)) {
          setError(
            `Please enter at least ${minValue} ${coinConfig?.underlyingCoinName}`,
          )
          return
        }
        setError(undefined)
        if (
          isValidAmount(value) &&
          decimal &&
          config &&
          coinType &&
          coinConfig
        ) {
          setIsCalcPtLoading(true)
          try {
            const rate = await getConversionRate(coinConfig)
            setConversionRate(rate)
            const swapAmount = new Decimal(value).mul(10 ** decimal).toFixed(0)

            const syAmount = new Decimal(swapAmount)
              .div(tokenType === 0 ? rate : 1)
              .toFixed(0)

            const {
              ptValue,
              syValue,
              tradeFee,
              syAmount: newSyAmount,
            } = await queryPtOut({ syAmount })

            setSyValue(syValue)
            setPtFeeValue(tradeFee)

            const minPtOut = new Decimal(ptValue)
              .mul(10 ** decimal)
              .mul(1 - new Decimal(slippage).div(100).toNumber())
              .toFixed(0)

            const approxPtOut = await getApproxPtOut({
              netSyIn: syAmount,
              minPtOut,
            })

            const actualSwapAmount = new Decimal(newSyAmount)
              .mul(tokenType === 0 ? rate : 1)
              .toFixed(0)

            try {
              const newPtValue = await swapExactSyForPtDryRun({
                vaultId,
                coinData: [],
                slippage,
                coinType,
                minPtOut,
                tokenType,
                approxPtOut,
                swapAmount: actualSwapAmount,
              })

              const ptRatio = new Decimal(ptValue).div(value).toFixed(4)
              setPtRatio(ptRatio)
              setPtValue(newPtValue)
            } catch (dryRunError) {
              const { error } = parseErrorMessage(
                (dryRunError as Error).message ?? dryRunError,
              )
              setPtRatio(new Decimal(ptValue).div(value).toFixed(4))
              setPtValue(ptValue)
              setError(error)
            }
          } catch (errorMsg) {
            const { error, detail } = parseErrorMessage(
              (errorMsg as Error)?.message ?? errorMsg,
            )
            setError(error)
            setErrorDetail(detail)
            setPtValue(undefined)
            setPtFeeValue(undefined)
          } finally {
            setIsCalcPtLoading(false)
          }
        } else {
          setPtValue(undefined)
          setPtFeeValue(undefined)
          setError(undefined)
        }
      }, 500)
      getPtOut()
      return getPtOut.cancel
    },
    [
      vaultId,
      minValue,
      slippage,
      coinType,
      tokenType,
      coinConfig,
      queryPtOut,
      getApproxPtOut,
      getConversionRate,
      swapExactSyForPtDryRun,
    ],
  )

  useEffect(() => {
    const cancelFn = debouncedGetPtOut(swapValue, decimal, coinConfig)
    return () => {
      cancelFn()
    }
  }, [swapValue, coinConfig, debouncedGetPtOut, decimal])

  useEffect(() => {
    async function initRatio() {
      try {
        setIsInitRatioLoading(true)
        const rate = await getConversionRate(coinConfig)
        setConversionRate(rate)
      } catch (error) {
        console.error("Failed to calculate initial ratio:", error)
      } finally {
        setIsInitRatioLoading(false)
      }
    }
    if (coinConfig) {
      initRatio()
    }
  }, [calculateRatio, getConversionRate, tokenType, coinConfig])

  const hasLiquidity = useMemo(() => {
    return isValidAmount(marketStateData?.lpSupply)
  }, [marketStateData])

  const btnDisabled = useMemo(() => {
    return (
      !hasLiquidity ||
      !isValidAmount(swapValue) ||
      !!error
    )
  }, [swapValue, hasLiquidity, error])

  const btnText = useMemo(() => {
    if (!hasLiquidity) {
      return "No liquidity available"
    }
    if (swapValue === "") {
      return "Please enter an amount"
    }
    return "Invest"
  }, [hasLiquidity, swapValue])

  const priceImpact = useMemo(() => {
    if (
      !ptValue ||
      !initPtRatio ||
      !ptRatio ||
      !swapValue ||
      !coinConfig?.coinPrice ||
      !ptYtData?.ptPrice
    ) {
      return undefined
    }

    const outputValue = new Decimal(ptValue).mul(ptYtData?.ptPrice)
    const value = outputValue
    const preValue = new Decimal(swapValue).mul(coinConfig?.coinPrice)
    const ratio = value.minus(preValue).div(preValue).mul(100)

    return { value, ratio }
  }, [
    ptValue,
    initPtRatio,
    ptRatio,
    swapValue,
    coinConfig?.coinPrice,
    ptYtData?.ptPrice,
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* token 标题 */}
      <AssetHeader coinConfig={coinConfig} />

      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 概览指标 */}
          <StatCard coinConfig={coinConfig} />
          
          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          {/* Tab栏 用Tabs组件 */}
          <Tabs
            title="PRINCIPLE TOKEN"
            tabs={[
              { key: "yt", label: "YIELD TOKEN" },
              { key: "pt", label: "PRINCIPLE TOKEN" },
              { key: "mint", label: "MINT" },
            ]}
            defaultTab="pt"
            onChange={() => {}}
          />

          {/* TRADE 输入区 用AmountInput组件 */}
          <AmountInput
            error={error}
            price={coinConfig?.coinPrice?.toString()}
            decimal={decimal}
            warning={warning}
            amount={swapValue}
            coinName={tokenType === 0 ? coinConfig?.underlyingCoinName : coinConfig?.coinName}
            coinLogo={tokenType === 0 ? coinConfig?.underlyingCoinLogo : coinConfig?.coinLogo}
            isLoading={isLoading}
            setWarning={setWarning}
            coinBalance={coinBalance}
            isConnected={isConnected}
            errorDetail={errorDetail}
            onChange={(value) => setSwapValue(value)}
          />

          {/* 切换按钮 */}
          <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
            <ChevronsDown className="w-5 h-5" />
          </div>

          {/* RECEIVE 输出区 用AmountOutput组件 */}
          <AmountOutput
            maturity={coinConfig?.maturity}
            loading={isCalcPtLoading}
            coinConfig={{ coinLogo: coinConfig?.coinLogo, coinName: `PT ${coinConfig?.coinName}` }}
            name={`PT ${coinConfig?.coinName}`}
            value={ptValue}
          />

          {/* 信息区块 6行 */}
          <div className="divide-y divide-white/10 space-y-2 text-sm text-white/40">
            <div className="flex justify-between py-1">
              <span>Fixed APY Change</span>
              <span className="text-white">
                {ptYtData?.ptApy ? `${new Decimal(ptYtData.ptApy).toFixed(6)} %` : "--"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Fixed Return</span>
              <span className="text-white">
                {isValidAmount(ptValue) && ptValue && decimal && conversionRate
                  ? `+${formatDecimalValue(
                      new Decimal(ptValue).minus(
                        new Decimal(syValue).mul(conversionRate),
                      ),
                      decimal,
                    )} ${coinConfig?.underlyingCoinName}`
                  : "--"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>After {dayjs(parseInt(coinConfig?.maturity || Date.now().toString())).diff(dayjs(), "day")} days</span>
              <span className="text-white">
                {!swapValue ? (
                  "--"
                ) : isCalcPtLoading ? (
                  "--"
                ) : decimal && conversionRate && coinConfig?.underlyingPrice ? (
                  `≈ $${
                    ptValue && decimal && ptValue && conversionRate
                      ? formatDecimalValue(
                          new Decimal(ptValue)
                            .minus(new Decimal(syValue).mul(conversionRate))
                            .mul(coinConfig.underlyingPrice),
                          decimal,
                        )
                      : "--"
                  }`
                ) : (
                  "--"
                )}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Price</span>
              <span className="text-white">
                {ptRatio ? `1 ${coinConfig?.coinName} = ${ptRatio} PT ${coinConfig?.coinName}` : "--"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Trading Fees</span>
              <span className="text-white">{ptFeeValue || "--"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Slippage</span>
              <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
            </div>
          </div>

          {/* 蓝色大按钮 */}
          <ActionButton
            onClick={() => {}}
            btnText={btnText}
            disabled={btnDisabled}
            loading={isSwapping}
          />
        </div>
      </div>
    </div>
  )
} 