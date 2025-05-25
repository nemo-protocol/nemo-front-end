"use client"

import AssetHeader from "../components/AssetHeader"
import StatCard from "../components/StatCard"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import ActionButton from "../components/ActionButton"
import SlippageSetting from "../components/SlippageSetting"
import Tabs from "../components/Tabs"
import AmountInput from "../components/AmountInput"
import { AmountOutput } from "../components/AmountOutput"
import { ChevronsDown } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import { Transaction } from "@mysten/sui/transactions"
import { useCoinConfig } from "@/queries"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import { parseErrorMessage, parseGasErrorMessage } from "@/lib/errorMapping"
import {
  formatDecimalValue,
  isValidAmount,
  debounce,
  safeDivide,
} from "@/lib/utils"
import { depositSyCoin, initPyPosition, splitCoinHelper } from "@/lib/txHelper"
import { mintSCoin } from "@/lib/txHelper/coin"
import { useWallet } from "@nemoprotocol/wallet-kit"
import useGetApproxYtOutDryRun from "@/hooks/dryRun/useGetApproxYtOutDryRun"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import { useRatioLoadingState } from "@/hooks/useRatioLoadingState"
import useTradeRatio from "@/hooks/actions/useTradeRatio"
import useQueryYtOutBySyInWithVoucher from "@/hooks/useQueryYtOutBySyInWithVoucher"
import useMarketStateData from "@/hooks/useMarketStateData"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { debugLog, network } from "@/config"
import Decimal from "decimal.js"

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const { coinType, maturity } = useParams()
  const [error, setError] = useState<string>()
  const [initRatio, setInitRatio] = useState<string>("")
  const [ytRatio, setYtRatio] = useState<string>("")
  const [swapValue, setSwapValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [ytValue, setYtValue] = useState<string>()
  const [ytFeeValue, setYtFeeValue] = useState<string>()
  const [isSwapping, setIsSwapping] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string>()
  const [tokenType, setTokenType] = useState<number>(0)
  const [isCalcYtLoading, setIsCalcYtLoading] = useState(false)
  const [isInitRatioLoading, setIsInitRatioLoading] = useState(false)
  const [minValue, setMinValue] = useState(0)

  const { address, signAndExecuteTransaction } = useWallet()
  const isConnected = useMemo(() => !!address, [address])

  const { data: marketStateData } = useMarketStateData(
    coinConfig?.marketStateId
  )

  const conversionRate = useMemo(() => coinConfig?.conversionRate, [coinConfig])

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const { isLoading } = useInputLoadingState(swapValue, false)

  const { isLoading: isRatioLoading } = useRatioLoadingState(
    false || isCalcYtLoading || isInitRatioLoading
  )

  const {
    data: coinData,
    refetch: refetchCoinData,
    isLoading: isBalanceLoading,
  } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinType
  )

  const coinBalance = useMemo(() => {
    if (coinData && coinData?.length && coinConfig?.decimal) {
      return coinData
        .reduce(
          (total, coin) => total.add(new Decimal(coin.balance)),
          new Decimal(0)
        )
        .div(new Decimal(10).pow(Number(coinConfig.decimal)))
        .toFixed(Number(coinConfig.decimal))
    }
    return "0"
  }, [coinData, coinConfig?.decimal])

  const insufficientBalance = useMemo(
    () => new Decimal(coinBalance).lt(new Decimal(swapValue || 0)),
    [coinBalance, swapValue]
  )

  const { mutateAsync: calculateRatio } = useTradeRatio(coinConfig)
  const { mutateAsync: queryYtOut } = useQueryYtOutBySyInWithVoucher(coinConfig)
  const getApproxYtOutDryRun = useGetApproxYtOutDryRun(coinConfig)
  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition(), refetchCoinData()])
  }, [refetchPyPosition, refetchCoinData])

  useEffect(() => {
    if (coinConfig) {
      const minValue = NEED_MIN_VALUE_LIST.find(
        (item) =>
          item.provider === coinConfig.provider ||
          item.coinType === coinConfig.coinType
      )?.minValue
      if (minValue) {
        setMinValue(minValue)
      }
    }
  }, [coinConfig])

  useEffect(() => {
    async function initRatio() {
      if (conversionRate) {
        try {
          setIsInitRatioLoading(true)
          const initialRatio = await calculateRatio(
            tokenType === 0 ? conversionRate : "1"
          )
          setInitRatio(initialRatio)
        } catch (error) {
          console.error("Failed to calculate initial ratio:", error)
        } finally {
          setIsInitRatioLoading(false)
        }
      }
    }
    initRatio()
  }, [calculateRatio, conversionRate, tokenType])

  const debouncedGetYtOut = useCallback(
    (value: string, decimal: number, config?: CoinConfig) => {
      const getYtOut = debounce(async () => {
        if (tokenType === 0 && value && new Decimal(value).lt(minValue)) {
          setError(
            `Please enter at least ${minValue} ${coinConfig?.underlyingCoinName}`
          )
          return
        }
        if (value && decimal && config && conversionRate) {
          setIsCalcYtLoading(true)
          try {
            setError(undefined)
            const swapAmount = new Decimal(value)
              .div(tokenType === 0 ? conversionRate : 1)
              .mul(10 ** decimal)
              .toFixed(0)
            const { ytValue, feeValue } = await queryYtOut(swapAmount)

            setYtValue(ytValue)
            setYtFeeValue(feeValue)
            const ytRatio = safeDivide(ytValue, value, "string")
            setYtRatio(ytRatio)
          } catch (error) {
            const { error: msg, detail } = parseErrorMessage(
              (error as Error)?.message ?? ""
            )
            setError(msg)
            setErrorDetail(detail)
            setYtValue(undefined)
            setYtFeeValue(undefined)
            setYtRatio(initRatio)
          } finally {
            setIsCalcYtLoading(false)
          }
        } else {
          setYtValue(undefined)
          setYtFeeValue(undefined)
          setYtRatio(initRatio)
          setError(undefined)
        }
      }, 500)
      getYtOut()
      return getYtOut.cancel
    },
    [
      tokenType,
      minValue,
      conversionRate,
      coinConfig?.underlyingCoinName,
      queryYtOut,
      initRatio,
    ]
  )

  useEffect(() => {
    const cancelFn = debouncedGetYtOut(swapValue, decimal, coinConfig)
    return () => {
      cancelFn()
    }
  }, [swapValue, coinConfig, debouncedGetYtOut])

  const { data: ptYtData, refetch: refetchPtYt } = useCalculatePtYt(
    coinConfig,
    marketStateData
  )

  const hasLiquidity = useMemo(() => {
    return isValidAmount(marketStateData?.lpSupply)
  }, [marketStateData])

  const btnDisabled = useMemo(() => {
    return (
      !hasLiquidity ||
      insufficientBalance ||
      !isValidAmount(swapValue) ||
      !isValidAmount(ytValue) ||
      !!error
    )
  }, [hasLiquidity, insufficientBalance, swapValue, ytValue, error])

  const btnText = useMemo(() => {
    if (!hasLiquidity) {
      return "No liquidity available"
    }
    if (insufficientBalance) {
      return `Insufficient ${coinConfig?.coinName} balance`
    }
    if (swapValue === "") {
      return "Please enter an amount"
    }
    return "Buy"
  }, [hasLiquidity, insufficientBalance, swapValue, coinConfig?.coinName])

  const priceImpact = useMemo(() => {
    if (
      !ytValue ||
      !coinConfig?.decimal ||
      !swapValue ||
      !ptYtData?.ytPrice ||
      !coinConfig?.coinPrice ||
      !coinConfig?.underlyingPrice
    ) {
      return
    }

    const outputValue = new Decimal(ytValue).mul(ptYtData.ytPrice)
    const value = outputValue
    const preValue = new Decimal(swapValue).mul(coinConfig.underlyingPrice)
    const ratio = value.minus(preValue).div(preValue).mul(100)
    return { value, ratio }
  }, [
    ytValue,
    coinConfig?.decimal,
    ytRatio,
    swapValue,
    initRatio,
    ptYtData?.ytPrice,
    coinConfig?.coinPrice,
    coinConfig?.underlyingPrice,
  ])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
            (item) => item.coinType === coinConfig?.coinType
          )?.vaultId
        : "",
    [coinConfig]
  )

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

  async function swap() {
    if (
      coinType &&
      address &&
      swapValue &&
      coinConfig &&
      conversionRate &&
      coinData?.length &&
      !insufficientBalance
    ) {
      try {
        setIsSwapping(true)
        const tx = new Transaction()

        const conversionRate = await getConversionRate(coinConfig)

        const swapAmount = new Decimal(swapValue)
          .mul(new Decimal(10).pow(Number(coinConfig.decimal)))
          .toFixed(0)

        const syAmount = new Decimal(swapAmount)
          .div(tokenType === 0 ? conversionRate : "1")
          .toFixed(0)

        const { ytValue } = await queryYtOut(syAmount)

        const minYtOut = new Decimal(ytValue)
          .mul(new Decimal(10).pow(Number(coinConfig.decimal)))
          .mul(new Decimal(1).minus(new Decimal(slippage).div(100)))
          .toFixed(0)

        const [splitCoin] =
          tokenType === 0
            ? [
                await mintSCoin({
                  tx,
                  vaultId,
                  address,
                  slippage,
                  coinData,
                  coinConfig,
                  amount: swapAmount,
                }),
              ]
            : splitCoinHelper(tx, coinData, [swapAmount], coinType)

        const syCoin = depositSyCoin(tx, coinConfig, splitCoin, coinType)

        let pyPosition
        let created = false
        if (!pyPositionData?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositionData[0].id)
        }

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const { approxYtOut, netSyTokenization } =
          await getApproxYtOutDryRun.mutateAsync({
            netSyIn: syAmount,
            minYtOut,
          })

        tx.moveCall({
          target: `${coinConfig.nemoContractId}::router::swap_exact_sy_for_yt`,
          arguments: [
            tx.object(coinConfig.version),
            tx.pure.u64(minYtOut),
            tx.pure.u64(approxYtOut),
            tx.pure.u64(netSyTokenization),
            syCoin,
            priceVoucher,
            pyPosition,
            tx.object(coinConfig.pyStateId),
            tx.object(coinConfig.yieldFactoryConfigId),
            tx.object(coinConfig.marketFactoryConfigId),
            tx.object(coinConfig.marketStateId),
            tx.object("0x6"),
          ],
          typeArguments: [coinConfig.syCoinType],
        })

        debugLog("swap_sy_for_exact_yt move call:", {
          target: `${coinConfig.nemoContractId}::router::swap_exact_sy_for_yt`,
          arguments: [
            coinConfig.version,
            minYtOut,
            approxYtOut,
            netSyTokenization,
            "syCoin",
            "priceVoucher",
            "pyPosition",
            coinConfig.pyStateId,
            coinConfig.yieldFactoryConfigId,
            coinConfig.marketFactoryConfigId,
            coinConfig.marketStateId,
            "0x6",
          ],
          typeArguments: [coinConfig.syCoinType],
        })

        if (created) {
          tx.transferObjects([pyPosition], address)
        }

        const res = await signAndExecuteTransaction({
          transaction: tx,
        })

        showTransactionDialog({
          status: "Success",
          network,
          txId: res.digest,
          onClose: async () => {
            await refreshData()
            await refetchPtYt()
          },
        })

        setSwapValue("")
      } catch (errorMsg) {
        const msg = (errorMsg as Error)?.message ?? error
        const gasMsg = parseGasErrorMessage(msg)
        if (gasMsg) {
          showTransactionDialog({
            status: "Failed",
            network,
            txId: "",
            message: gasMsg,
          })
        } else if (
          msg.includes(
            "Transaction failed with the following error. Dry run failed, could not automatically determine a budget: InsufficientGas in command 5"
          )
        ) {
          showTransactionDialog({
            status: "Failed",
            network,
            txId: "",
            message: "Insufficient YT in the pool.",
          })
        } else {
          const { error, detail } = parseErrorMessage(msg || "")
          setErrorDetail(detail)
          showTransactionDialog({
            status: "Failed",
            network,
            txId: "",
            message: error,
          })
        }
      } finally {
        setIsSwapping(false)
      }
    }
  }

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
            price={coinConfig?.ptPrice}
            decimal={decimal}
            warning={warning}
            amount={swapValue}
            coinName={
              tokenType === 0
                ? coinConfig?.underlyingCoinName
                : coinConfig?.coinName
            }
            coinLogo={
              tokenType === 0
                ? coinConfig?.underlyingCoinLogo
                : coinConfig?.coinLogo
            }
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
            loading={isCalcYtLoading}
            coinConfig={{
              coinLogo: coinConfig?.coinLogo,
              coinName: `YT ${coinConfig?.coinName}`,
            }}
            value={ytValue}
            name={`PT ${coinConfig.coinName}`}
          />

          {/* 信息区块 6行 */}
          <div className="divide-y divide-white/10 space-y-2 text-sm text-white/40">
            <div className="flex justify-between py-1">
              <span>Fixed APY Change</span>
              <span className="text-white">5.31% → 4.11%</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Fixed Return</span>
              <span className="text-white">+0.05 SUI</span>
            </div>
            <div className="flex justify-between py-1">
              <span>After 338 days</span>
              <span className="text-white">~ $124125</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Price</span>
              <span className="text-white">1 xSUI = 1.2444 PT xSUI</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Trading Fees</span>
              <span className="text-white">+0.05 SUI</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Slippage</span>
              <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
            </div>
          </div>

          {/* 蓝色大按钮 */}
          <ActionButton
            onClick={swap}
            btnText={btnText}
            disabled={btnDisabled}
            loading={isSwapping}
          />
        </div>
      </div>
    </div>
  )
}
