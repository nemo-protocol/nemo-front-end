"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import Decimal from "decimal.js"
import { ArrowUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { network } from "@/config"
import { CoinConfig } from "@/queries/types/market"
import {
  formatDecimalValue,
  isValidAmount,
  safeDivide,
  debounce,
} from "@/lib/utils"
import { parseErrorMessage } from "@/lib/errorMapping"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"

import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import useSellYtDryRun from "@/hooks/dryRun/yt/useSellYtDryRun"
import useMarketStateData from "@/hooks/useMarketStateData"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useCoinData from "@/hooks/query/useCoinData"

import AmountInput from "../../components/AmountInput"
import ActionButton from "../../components/ActionButton"
import SlippageSetting from "../../components/SlippageSetting"
import { AmountOutput } from "../../components/AmountOutput"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"

import { initPyPosition, redeemSyCoin, swapExactYtForSy } from "@/lib/txHelper"
import { burnSCoin } from "@/lib/txHelper/coin"
import { getPriceVoucher } from "@/lib/txHelper/price"
import Image from "next/image"
import Calculator from "../../components/Calculator"
import GuideModal from "../../components/GuideModal"
import useQuerySyRatio from "@/hooks/useQuerySyRatio"

interface Props {
  coinConfig: CoinConfig
}

export default function Sell({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [syValue, setSyValue] = useState("")
  const [error, setError] = useState<string>()
  const [slippage, setSlippage] = useState("0.5")
  const [redeemValue, setRedeemValue] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [nowRatio, setNowRatio] = useState<string>()
  const [inputValue, setInputValue] = useState<Decimal>()

  const [errorDetail, setErrorDetail] = useState<string>()
  const [receivingType, setReceivingType] = useState<"underlying" | "sy">(
    "underlying"
  )
  const [minValue, setMinValue] = useState(0)

  const { address, signAndExecuteTransaction } = useWallet()
  const isConnected = useMemo(() => !!address, [address])

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
          (item) => item.coinType === coinConfig?.coinType
        )?.vaultId
        : "",
    [coinConfig]
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

  const { mutateAsync: sellYtDryRun } = useSellYtDryRun(coinConfig)

  const debouncedGetSyOut = useCallback(
    (value: string, decimal: number) => {
      const getSyOut = debounce(async () => {
        if (isValidAmount(value) && decimal && coinConfig?.conversionRate) {
          try {
            const inputAmount = new Decimal(value).mul(10 ** decimal).toString()
            const { outputValue } = await sellYtDryRun({
              vaultId,
              slippage,
              minSyOut: "0",
              receivingType: "sy",
              ytAmount: inputAmount,
              pyPositions: pyPositionData,
            })
            setSyValue(outputValue)

            const targetValue = formatDecimalValue(
              new Decimal(outputValue).mul(
                receivingType === "underlying" ? coinConfig.conversionRate : 1
              ),
              decimal
            )

            setTargetValue(targetValue)
            setNowRatio(new Decimal(value).div(outputValue).toFixed(6))

            if (
              new Decimal(targetValue).lt(minValue) &&
              receivingType === "underlying"
            ) {
              setError(
                `Please enter at least ${formatDecimalValue(
                  new Decimal(value).mul(minValue).div(targetValue),
                  decimal
                )} YT ${coinConfig.coinName}`
              )
            } else {
              setError(undefined)
            }
          } catch (errorMsg) {
            const { error, detail } = parseErrorMessage(
              (errorMsg as Error)?.message ?? ""
            )
            setError(error)
            setErrorDetail(detail)
            setTargetValue("")
          }
        } else {
          setTargetValue("")
          setError(undefined)
          setErrorDetail(undefined)
        }
      }, 500)
      getSyOut()
      return getSyOut.cancel
    },
    [
      coinConfig?.conversionRate,
      coinConfig?.coinName,
      sellYtDryRun,
      vaultId,
      slippage,
      pyPositionData,
      receivingType,
      minValue,
    ]
  )

  useEffect(() => {
    const cancelFn = debouncedGetSyOut(redeemValue, decimal)
    return () => {
      cancelFn()
    }
  }, [redeemValue, decimal, debouncedGetSyOut])

  const ytBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, coin) => total.add(coin.ytBalance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

  const insufficientBalance = useMemo(
    () => new Decimal(Number(ytBalance)).lt(redeemValue || 0),
    [ytBalance, redeemValue]
  )

  const handleInputChange = (value: string) => {
    setRedeemValue(value)
  }

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition()])
  }, [refetchPyPosition])

  async function redeem() {
    if (!insufficientBalance && coinConfig && address && syValue) {
      try {
        setIsRedeeming(true)
        const tx = new Transaction()

        let pyPosition
        let created = false
        if (!pyPositionData?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositionData[0].id)
        }

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const inputAmount = new Decimal(redeemValue)
          .mul(10 ** decimal)
          .toString()

        const minSyOut = new Decimal(syValue)
          .mul(10 ** decimal)
          .mul(new Decimal(1).sub(new Decimal(slippage).div(100)))
          .toFixed(0)

        const syCoin = swapExactYtForSy(
          tx,
          coinConfig,
          inputAmount,
          pyPosition,
          priceVoucher,
          minSyOut
        )

        const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

        if (receivingType === "underlying") {
          const underlyingCoin = await burnSCoin({
            tx,
            amount: "",
            vaultId,
            address,
            slippage,
            coinConfig,
            sCoin: yieldToken,
          })
          tx.transferObjects([underlyingCoin], address)
        } else {
          tx.transferObjects([yieldToken], address)
        }

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
          },
        })

        setRedeemValue("")
        setTargetValue("")
      } catch (errorMsg) {
        const { error, detail } = parseErrorMessage(
          (errorMsg as Error)?.message ?? ""
        )
        setErrorDetail(detail)
        showTransactionDialog({
          status: "Failed",
          network,
          txId: "",
          message: error,
        })
      } finally {
        setIsRedeeming(false)
      }
    }
  }

  const { data: marketState } = useMarketStateData(coinConfig?.marketStateId)

  const { data: ptYtData } = useCalculatePtYt(coinConfig, marketState)

  const price = useMemo(() => inputValue ? inputValue.div(redeemValue).toString() : "0", [ptYtData, inputValue])

  const { isLoading } = useInputLoadingState(redeemValue, false)

  const convertReceivingValue = useCallback(
    (value: string, fromType: string, toType: string) => {
      if (!value || !decimal || !coinConfig?.conversionRate) return ""

      const conversionRate = new Decimal(coinConfig.conversionRate)

      if (fromType === "underlying" && toType === "sy") {
        return new Decimal(value).div(conversionRate).toString()
      } else if (fromType === "sy" && toType === "underlying") {
        return new Decimal(value).mul(conversionRate).toString()
      }
      return value
    },
    [decimal, coinConfig]
  )

  const btnDisabled = useMemo(() => {
    return !!error || !isValidAmount(redeemValue) || !isValidAmount(targetValue)
  }, [redeemValue, targetValue, error])
  const { data: initSyRatio } = useQuerySyRatio(coinConfig, "1000")

  const priceImpact = useMemo(() => {
    if (
      !targetValue ||
      !redeemValue ||
      !ptYtData?.ptPrice ||
      !coinConfig?.coinPrice ||
      !coinConfig?.underlyingPrice ||
      !initSyRatio ||
      !nowRatio
    ) {
      return
    }

    const _ratio = new Decimal(nowRatio).minus(initSyRatio?.initSyRatioByYt).div(initSyRatio?.initSyRatioByYt).mul(100)

    console.log(`RatioCalc: (${nowRatio} - ${initSyRatio?.initSyRatioByYt})/${nowRatio} * 100 = ${_ratio.toFixed(4)} `)

    const outputValue = new Decimal(targetValue).mul(
      receivingType === "underlying"
        ? (coinConfig.underlyingPrice ?? "0")
        : (coinConfig.coinPrice ?? "0"),
    )
    const inputValue = new Decimal(outputValue).div(1 + Number(_ratio) * 0.01)
    setInputValue(inputValue)
    const ratio = outputValue.minus(inputValue).div(inputValue).mul(100)

    const value = outputValue

    return { value, ratio }
  }, [
    targetValue,
    redeemValue,
    receivingType,
    ptYtData?.ptPrice,
    ptYtData?.ytPrice,
    coinConfig?.coinPrice,
    coinConfig?.underlyingPrice,
  ])

  const [open, setOpen] = useState(false)
  const [calculatorInput, setCalculatorInput] = useState(targetValue)
  useEffect(() => {
    setCalculatorInput(targetValue)
  }, [targetValue])

  const { data: coinData } = useCoinData(
    address,
    receivingType === "underlying"
      ? coinConfig?.underlyingCoinType
      : coinConfig.coinType
  )

  const coinBalance = useMemo(() => {
    if (coinData?.length) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "0") // Switch to buy mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <Calculator
        open={open}
        inputYT={calculatorInput}
        outputYT={Number(redeemValue)}
        coinConfig={coinConfig}
        onClose={() => setOpen(false)}
        coinName={coinConfig?.underlyingCoinName}
        rate={
          ptYtData?.ytPrice &&
          price &&
          formatDecimalValue(
            new Decimal(1)
              .div(ptYtData.ytPrice)
              .mul(coinConfig?.underlyingPrice),
            6
          )
        }
        setTradeValue={setCalculatorInput}
      />
      <AmountInput
        error={error}
        price={price}
        decimal={decimal}
        warning={warning}
        amount={redeemValue}
        isLoading={isLoading}
        coinBalance={coinBalance}
        setWarning={setWarning}
        isConnected={isConnected}
        errorDetail={errorDetail}
        onChange={handleInputChange}
        title={"Trade".toUpperCase()}
        logo={coinConfig?.ytTokenLogo}
        maturity={coinConfig?.maturity}
        name={`YT ${coinConfig?.coinName}`}
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors" onClick={handleModeSwitch}>
        <ArrowUpDown className="w-5 h-5" />
      </div>

      <AmountOutput
        amount={
          isLoading
            ? undefined
            : isValidAmount(targetValue)
              ? formatDecimalValue(targetValue, decimal)
              : undefined
        }
        loading={isLoading}
        balance={coinBalance}
        title="RECEIVE"
        name={
          receivingType === "underlying"
            ? coinConfig.underlyingCoinName
            : coinConfig.coinName
        }
        logo={
          receivingType === "underlying"
            ? coinConfig.underlyingCoinLogo
            : coinConfig.coinLogo
        }
        coinNameComponent={
          <TokenTypeSelect
            value={receivingType}
            options={[
              {
                label: coinConfig?.underlyingCoinName || "",
                logo: coinConfig?.underlyingCoinLogo || "",
                value: "underlying",
              },
              {
                label: coinConfig?.coinName || "",
                logo: coinConfig?.coinLogo || "",
                value: "sy",
              },
            ]}
            onChange={(value) => {
              const newTargetValue = convertReceivingValue(
                targetValue,
                receivingType,
                value
              )
              setReceivingType(value as "underlying" | "sy")
              setTargetValue(newTargetValue)
            }}
          />
        }
        priceImpact={priceImpact}


      />

      <div className="flex justify-between">
        <span className="text-light-gray/40">Slippage</span>
        <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
      </div>

      <div className="flex gap-4">
        <ActionButton
          btnText="Sell"
          onClick={redeem}
          loading={isRedeeming}
          disabled={btnDisabled}
          type="red"
        />
        <div
          className="px-4 sm:px-8 font-[500]  bg-[rgba(252,252,252,0.03)] transition hover:text-white/50 hover:bg-[rgba(252,252,252,0.01)] text-white rounded-full w-full h-[42px] text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2"
          onClick={() => {
            setOpen(true)
          }}
        >
          <Image
            src={"/calculator.svg"}
            alt={""}
            width={16}
            height={16}
            className="shrink-0"
          />
          Calculate
        </div>
      </div>
      <GuideModal imageUrl="/assets/images/guide/yt.png" />
    </div>
  )
}
