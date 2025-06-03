"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import Calculator from "../components/Calculator"
import AmountInput from "../components/AmountInput"
import { AmountOutput } from "../components/AmountOutput"
import ActionButton from "../components/ActionButton"
import SlippageSetting from "../components/SlippageSetting"
import Tabs from "../components/Tabs"
import { ChevronsDown } from "lucide-react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useMarketStateData from "@/hooks/useMarketStateData"
import useGetApproxYtOutDryRun from "@/hooks/dryRun/useGetApproxYtOutDryRun"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"
import useQueryYtOutBySyInWithVoucher from "@/hooks/useQueryYtOutBySyInWithVoucher"
import useTradeRatio from "@/hooks/actions/useTradeRatio"
import { parseErrorMessage, parseGasErrorMessage } from "@/lib/errorMapping"
import {
  formatDecimalValue,
  isValidAmount,
  debounce,
  safeDivide,
} from "@/lib/utils"
import { Transaction } from "@mysten/sui/transactions"
import { depositSyCoin, initPyPosition, splitCoinHelper } from "@/lib/txHelper"
import { mintSCoin } from "@/lib/txHelper/coin"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { debugLog, network } from "@/config"
import Decimal from "decimal.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SimpleTabs from "../components/SimpleTabs"

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const [open, setOpen] = useState(false)
  const [tradeValue, setTradeValue] = useState("")
  const [warning, setWarning] = useState("")
  const [error, setError] = useState<string>()
  const [initRatio, setInitRatio] = useState<string>("")
  const [ytRatio, setYtRatio] = useState<string>("")
  const [ytValue, setYtValue] = useState<string>()
  const [ytFeeValue, setYtFeeValue] = useState<string>()
  const [isSwapping, setIsSwapping] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string>()
  const [tokenType, setTokenType] = useState<number>(0)
  const [isCalcYtLoading, setIsCalcYtLoading] = useState(false)
  const [isInitRatioLoading, setIsInitRatioLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [minValue, setMinValue] = useState(0)
  const [currentTab, setCurrentTab] = useState<"buy" | "sell">("buy")

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

  const {
    data: coinData,
    refetch: refetchCoinData,
    isLoading: isBalanceLoading,
  } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinConfig?.coinType
  )

  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()
  const { mutateAsync: calculateRatio } = useTradeRatio(coinConfig)
  const { mutateAsync: queryYtOut } = useQueryYtOutBySyInWithVoucher(coinConfig)
  const getApproxYtOutDryRun = useGetApproxYtOutDryRun(coinConfig)

  const coinName = useMemo(
    () =>
      tokenType === 0 ? coinConfig?.underlyingCoinName : coinConfig?.coinName,
    [tokenType, coinConfig]
  )

  const coinLogo = useMemo(
    () =>
      tokenType === 0 ? coinConfig?.underlyingCoinLogo : coinConfig?.coinLogo,
    [tokenType, coinConfig]
  )

  const price = useMemo(
    () =>
      (tokenType === 0
        ? coinConfig?.underlyingPrice
        : coinConfig?.coinPrice
      )?.toString(),
    [tokenType, coinConfig]
  )

  const decimal = useMemo(() => Number(coinConfig?.decimal), [coinConfig])

  const coinBalance = useMemo(() => {
    if (coinData && coinData?.length && decimal) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const insufficientBalance = useMemo(
    () => new Decimal(coinBalance).lt(tradeValue || 0),
    [coinBalance, tradeValue]
  )

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
      !isValidAmount(tradeValue) ||
      !isValidAmount(ytValue) ||
      !!error
    )
  }, [hasLiquidity, insufficientBalance, tradeValue, ytValue, error])

  const btnText = useMemo(() => {
    if (!hasLiquidity) {
      return "No liquidity available"
    }
    if (insufficientBalance) {
      return `Insufficient ${coinName} balance`
    }
    if (tradeValue === "") {
      return "Please enter an amount"
    }
    return "Buy"
  }, [hasLiquidity, insufficientBalance, tradeValue, coinName])

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
    const cancelFn = debouncedGetYtOut(tradeValue, decimal ?? 0, coinConfig)
    return () => {
      cancelFn()
    }
  }, [tradeValue, decimal, coinConfig, debouncedGetYtOut])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
            (item) => item.coinType === coinConfig?.coinType
          )?.vaultId
        : "",
    [coinConfig]
  )

  const priceImpact = useMemo(() => {
    if (
      !ytValue ||
      !decimal ||
      !tradeValue ||
      !ptYtData?.ytPrice ||
      !coinConfig?.coinPrice ||
      !coinConfig?.underlyingPrice ||
      !price
    ) {
      return
    }

    const outputValue = new Decimal(ytValue).mul(ptYtData.ytPrice)
    const value = outputValue
    const preValue = new Decimal(tradeValue).mul(price)
    const ratio = value.minus(preValue).div(preValue).mul(100)
    return { value, ratio }
  }, [
    ytValue,
    decimal,
    tradeValue,
    ptYtData?.ytPrice,
    coinConfig?.coinPrice,
    coinConfig?.underlyingPrice,
    price,
  ])

  async function swap() {
    if (
      coinConfig?.coinType &&
      address &&
      tradeValue &&
      coinConfig &&
      conversionRate &&
      coinData?.length &&
      !insufficientBalance
    ) {
      try {
        setIsSwapping(true)
        const tx = new Transaction()

        const conversionRate = await getConversionRate(coinConfig)

        const swapAmount = new Decimal(tradeValue).mul(10 ** decimal).toFixed(0)

        const syAmount = new Decimal(swapAmount)
          .div(tokenType === 0 ? conversionRate : 1)
          .toFixed(0)

        const { ytValue } = await queryYtOut(syAmount)

        const minYtOut = new Decimal(ytValue)
          .mul(10 ** decimal)
          .mul(1 - new Decimal(slippage).div(100).toNumber())
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
            : splitCoinHelper(tx, coinData, [swapAmount], coinConfig.coinType)

        const syCoin = depositSyCoin(
          tx,
          coinConfig,
          splitCoin,
          coinConfig.coinType
        )

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

        setTradeValue("")
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
      <Calculator
        open={open}
        inputYT={236}
        maturity={111}
        underlyingPrice={0.1}
        onClose={() => setOpen(false)}
      />

      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 概览指标 */}
          {/* <StatCard coinConfig={coinConfig} /> */}

          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <div className="bg-[#101823] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          {/* Tab栏 用Tabs组件 */}
          <SimpleTabs
            tabs={[
              { key: "buy", label: "BUY" },
              { key: "sell", label: "SELL" },
            ]}
            current={currentTab}
            onChange={key => setCurrentTab(key as "buy" | "sell")}
          />
          {/* 输入区 */}
          <AmountInput
            amount={tradeValue}
            onChange={setTradeValue}
            coinName={coinName}
            coinLogo={coinLogo}
            price={price}
            decimal={decimal}
            coinBalance={coinBalance}
            isConnected={isConnected}
            setWarning={setWarning}
            disabled={!hasLiquidity}
            error={error}
            errorDetail={errorDetail}
            warning={warning}
            isLoading={isCalcYtLoading}
            isBalanceLoading={isBalanceLoading}
            className="mb-2"
            coinNameComponent={
              <Select
                value={tokenType.toString()}
                onValueChange={(value) => {
                  setTradeValue("")
                  setTokenType(Number(value))
                }}
              >
                <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-sm sm:text-base w-fit">
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent className="border-none outline-none bg-[#0E0F16]">
                  <SelectGroup>
                    <SelectItem
                      value={"0"}
                      className="cursor-pointer text-white"
                    >
                      {coinConfig?.underlyingCoinName}
                    </SelectItem>
                    <SelectItem
                      value={"1"}
                      className="cursor-pointer text-white"
                    >
                      {coinConfig?.coinName}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            }
          />
          {/* swap icon */}
          <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
            <ChevronsDown className="w-5 h-5" />
          </div>

          {/* 输出区 */}
          <AmountOutput
            name="YT xSUI"
            value={ytValue}
            maturity={String(new Date("2026-02-19").getTime())}
            coinConfig={{
              coinLogo: coinConfig?.coinLogo,
              coinName: coinConfig?.coinName,
            }}
          />
          {/* 详情行 */}
          <div className="text-sm text-slate-400 flex flex-col gap-2 pt-4 border-t border-slate-800 divide-y divide-white/10">
            <div className="flex justify-between py-1">
              <span>Yield APY Change</span>
              <span className="text-white">
                {ptYtData?.ytApy
                  ? `${formatDecimalValue(ptYtData.ytApy, 6)} %`
                  : "--"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Price</span>
              <span className="text-white">
                {ptYtData?.ytPrice && price
                  ? `1 ${coinName} = ${formatDecimalValue(
                      new Decimal(1).div(ptYtData.ytPrice).mul(price),
                      6
                    )} YT ${coinConfig?.coinName}`
                  : "--"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Trading Fees</span>
              <span className="text-white">
                {ytFeeValue
                  ? `${formatDecimalValue(ytFeeValue, 6)} ${
                      coinConfig?.coinName
                    }`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Slippage</span>
              <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
            </div>
          </div>
          {/* 按钮组 */}
          <div className="flex gap-4 pt-4">
            <div className="flex-1">
              <ActionButton
                btnText={btnText}
                disabled={btnDisabled}
                loading={isSwapping}
                onClick={swap}
              />
            </div>
            
            <button
              className="flex-1 bg-[#1b2738] hover:bg-[#243448] text-white py-3 rounded-full flex items-center justify-center gap-2 text-lg font-semibold"
              onClick={() => setOpen(true)}
            >
              <span className="i-lucide-calculator mr-2" />
              Calculate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
