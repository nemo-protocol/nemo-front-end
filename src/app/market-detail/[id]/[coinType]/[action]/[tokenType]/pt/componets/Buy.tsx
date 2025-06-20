"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import Decimal from "decimal.js"
import { ArrowUpDown } from "lucide-react"

import { network } from "@/config"
import { CoinConfig } from "@/queries/types/market"
import { formatDecimalValue, isValidAmount, debounce } from "@/lib/utils"
import { parseErrorMessage, parseGasErrorMessage } from "@/lib/errorMapping"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"

import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import useQueryPtOutBySyInWithVoucher from "@/hooks/dryRun/pt/useQueryPtOutBySyIn"
import useCustomSignAndExecuteTransaction from "@/hooks/useCustomSignAndExecuteTransaction"
import useMarketStateData from "@/hooks/useMarketStateData"
import useInvestRatio from "@/hooks/actions/useInvestRatio"
import useGetApproxPtOutDryRun from "@/hooks/dryRun/useGetApproxPtOutDryRun"
import useSwapExactSyForPtDryRun from "@/hooks/dryRun/useSwapExactSyForPtDryRun"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"
import useQueryPtRatio from "@/hooks/useQueryPtRatio"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"

import AmountInput from "../../components/AmountInput"
import ActionButton from "../../components/ActionButton"
import { AmountOutput } from "../../components/AmountOutput"
import SlippageSetting from "../../components/SlippageSetting"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"

import {
  initPyPosition,
  splitCoinHelper,
  depositSyCoin,
  swapExactSyForPt,
} from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { mintSCoin } from "@/lib/txHelper/coin"
import { redeemPt } from "@/lib/txHelper/pt"
import GuideModal from "../../components/GuideModal"

interface Props {
  coinConfig: CoinConfig
}

export default function Buy({ coinConfig }: Props) {
  const [txId, setTxId] = useState("")
  const [warning, setWarning] = useState("")
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

  const coinType = coinConfig.coinType

  const { address } = useWallet()
  const isConnected = useMemo(() => !!address, [address])

  const { data: marketStateData } = useMarketStateData(
    coinConfig?.marketStateId
  )

  const { isLoading } = useInputLoadingState(swapValue, false)

  const { mutateAsync: queryPtOut } = useQueryPtOutBySyInWithVoucher({
    outerCoinConfig: coinConfig,
  })
  const { mutateAsync: swapExactSyForPtDryRun } =
    useSwapExactSyForPtDryRun(coinConfig)
  const { data: ptYtData, refresh: refreshPtYt } = useCalculatePtYt(
    coinConfig,
    marketStateData
  )
  const { mutateAsync: calculateRatio } = useInvestRatio(coinConfig)
  const { mutateAsync: getApproxPtOut } = useGetApproxPtOutDryRun(coinConfig)
  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()
  const { data: initPtRatio } = useQueryPtRatio(coinConfig, "1000")

  const { data: coinData, refetch: refetchCoinData } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinConfig.coinType
  )

  const { mutateAsync: signAndExecuteTransaction } =
    useCustomSignAndExecuteTransaction()

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

  const coinBalance = useMemo(() => {
    if (coinData?.length) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
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
          item.coinType === coinConfig.coinType
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
            (item) => item.coinType === coinConfig?.coinType
          )?.vaultId
        : "",
    [coinConfig]
  )

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const ptBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, item) => total.add(item.ptBalance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition(), refetchCoinData()])
  }, [refetchPyPosition, refetchCoinData])

  const debouncedGetPtOut = useCallback(
    (value: string, decimal: number, config?: CoinConfig) => {
      const getPtOut = debounce(async () => {
        if (tokenType === 0 && value && new Decimal(value).lt(minValue)) {
          setError(
            `Please enter at least ${minValue} ${coinConfig?.underlyingCoinName}`
          )
          return
        }
        setError(undefined)
        if (
          isValidAmount(value) &&
          decimal &&
          config &&
          coinType &&
          coinConfig &&
          coinData?.length
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
                coinData,
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
              console.log("dryRunError", dryRunError)
              const { error } = parseErrorMessage(
                (dryRunError as Error).message ?? dryRunError
              )
              console.log("error", error)
              setPtRatio(new Decimal(ptValue).div(value).toFixed(4))
              setPtValue(ptValue)
              setError(error)
            }
          } catch (errorMsg) {
            const { error, detail } = parseErrorMessage(
              (errorMsg as Error)?.message ?? errorMsg
            )
            console.log("errorMsg error", errorMsg, error)
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
    ]
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
    return !hasLiquidity || !isValidAmount(swapValue) || !!error
  }, [swapValue, hasLiquidity, error])

  const btnText = useMemo(() => {
    if (!hasLiquidity) {
      return "No liquidity available"
    }
    if (insufficientBalance) {
      return `Insufficient ${coinConfig.coinName} balance`
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

  async function swap() {
    if (
      address &&
      coinType &&
      swapValue &&
      coinConfig &&
      coinData?.length &&
      !insufficientBalance
    ) {
      try {
        setIsSwapping(true)
        const tx = new Transaction()
        const rate = await getConversionRate(coinConfig)
        setConversionRate(rate)
        const swapAmount = new Decimal(swapValue).mul(10 ** decimal).toFixed(0)
        const syAmount = new Decimal(swapAmount)
          .div(tokenType === 0 ? rate : 1)
          .toFixed(0)

        let pyPosition
        let created = false
        if (!pyPositionData?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositionData[0].id)
        }

        const { ptAmount, syAmount: newSyAmount } = await queryPtOut({
          syAmount,
        })

        const minPtOut = new Decimal(ptAmount)
          .mul(1 - new Decimal(slippage).div(100).toNumber())
          .toFixed(0)

        const approxPtOut = await getApproxPtOut({
          netSyIn: newSyAmount,
          minPtOut,
        })

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const actualSwapAmount = new Decimal(newSyAmount)
          .mul(tokenType === 0 ? rate : 1)
          .toFixed(0)

        const [splitCoin] =
          tokenType === 0
            ? [
                await mintSCoin({
                  tx,
                  vaultId,
                  slippage,
                  address,
                  coinData,
                  coinConfig,
                  amount: actualSwapAmount,
                }),
              ]
            : splitCoinHelper(tx, coinData, [actualSwapAmount], coinType)

        const syCoin = depositSyCoin(tx, coinConfig, splitCoin, coinType)

        swapExactSyForPt(
          tx,
          coinConfig,
          syCoin,
          priceVoucher,
          pyPosition,
          minPtOut,
          approxPtOut
        )

        if (coinConfig?.ptTokenType) {
          const ptCoin = redeemPt({
            tx,
            coinConfig,
            pyPosition,
          })
          tx.transferObjects([ptCoin], address)
        }

        if (created) {
          tx.transferObjects([pyPosition], address)
        }

        const res = await signAndExecuteTransaction({
          transaction: tx,
        })

        setTxId(res.digest)
        showTransactionDialog({
          status: "Success",
          network,
          txId: res.digest,
          onClose: () => {
            setTxId("")
          },
        })
        setSwapValue("")

        await refreshData()
        await refreshPtYt()
      } catch (errorMsg) {
        let msg = (errorMsg as Error)?.message ?? errorMsg
        const gasMsg = parseGasErrorMessage(msg)
        if (gasMsg) {
          msg = gasMsg
        } else if (
          msg.includes(
            "Transaction failed with the following error. Dry run failed, could not automatically determine a budget: InsufficientGas in command 5"
          )
        ) {
          msg = "Insufficient PT in the pool."
        } else {
          const { error } = parseErrorMessage(msg)
          msg = error
        }

        showTransactionDialog({
          status: "Failed",
          network,
          txId,
          message: msg,
          onClose: () => {
            setTxId("")
          },
        })
      } finally {
        setIsSwapping(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* TRADE 输入区 用AmountInput组件 */}
      <AmountInput
        error={error}
        title={"Trade".toUpperCase()}
        price={coinConfig?.coinPrice?.toString()}
        decimal={decimal}
        warning={warning}
        amount={swapValue}
        name={
          tokenType === 0
            ? coinConfig?.underlyingCoinName
            : coinConfig?.coinName
        }
        logo={
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
        coinNameComponent={
          <TokenTypeSelect
            value={tokenType}
            options={[
              {
                label: coinConfig?.underlyingCoinName || "",
                logo: coinConfig?.underlyingCoinLogo || "",
                value: 0,
              },
              {
                label: coinConfig?.coinName || "",
                logo: coinConfig?.coinLogo || "",
                value: 1,
              },
            ]}
            onChange={(value) => {
              setSwapValue("")
              setTokenType(value)
            }}
          />
        }
      />

      {/* 切换按钮 */}
      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ArrowUpDown className="w-5 h-5" />
      </div>

      {/* RECEIVE 输出区 用AmountOutput组件 */}
      <AmountOutput
        amount={ptValue}
        balance={ptBalance}
        loading={isCalcPtLoading}
        logo={coinConfig.ptTokenLogo}
        name={`PT ${coinConfig.coinName}`}
      />

      {/* 信息区块 6行 */}
      <div className="space-y-2 text-sm text-light-gray/40">
        <div className="flex justify-between">
          <span>Fixed APY Change</span>
          <span className="text-white">
            {ptYtData?.ptApy
              ? `${new Decimal(ptYtData.ptApy).toFixed(6)} %`
              : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Fixed Return At Maturity</span>
          <span className="text-white">
            <span className="text-white">
              {!swapValue
                ? "--"
                : isCalcPtLoading
                ? "--"
                : decimal && conversionRate && coinConfig?.underlyingPrice
                ? `≈ $${
                    ptValue && decimal && ptValue && conversionRate
                      ? formatDecimalValue(
                          new Decimal(ptValue)
                            .minus(new Decimal(syValue).mul(conversionRate))
                            .mul(coinConfig.underlyingPrice),
                          decimal
                        )
                      : "--"
                  }`
                : "--"}
            </span>

            {isValidAmount(ptValue) && ptValue && decimal && conversionRate ? (
              <span className="text-[#4CC877] ml-2">{`( +${formatDecimalValue(
                new Decimal(ptValue).minus(
                  new Decimal(syValue).mul(conversionRate)
                ),
                decimal
              )} ${coinConfig?.underlyingCoinName} )`}</span>
            ) : (
              ""
            )}
          </span>
        </div>

        <div className="border-b border-light-gray/10"></div>
        <div className="flex justify-between">
          <span>Price</span>
          <span className="text-white">
            {ptRatio
              ? `1 ${coinConfig?.coinName} = ${ptRatio} PT ${coinConfig?.coinName}`
              : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Trading Fees</span>
          <span className="text-white">
            {ptFeeValue
              ? `${formatDecimalValue(ptFeeValue, 2)} ${coinConfig?.coinName}`
              : "--"}
          </span>
        </div>
        <div className="flex justify-between">
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
        type="green"
      />

<GuideModal imageUrl="/assets/images/guide/pt.png" />
    </div>
  )
}
