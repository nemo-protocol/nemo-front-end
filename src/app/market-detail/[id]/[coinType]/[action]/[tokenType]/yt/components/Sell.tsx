"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import Decimal from "decimal.js"
import { ArrowUpDown } from "lucide-react"
import dayjs from "dayjs"

import { network } from "@/config"
import { CoinConfig } from "@/queries/types/market"
import {
  formatDecimalValue,
  isValidAmount,
  safeDivide,
  debounce,
  formatTimeDiff,
} from "@/lib/utils"
import { parseErrorMessage } from "@/lib/errorMapping"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"

import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import useSellYtDryRun from "@/hooks/dryRun/yt/useSellYtDryRun"
import useMarketStateData from "@/hooks/useMarketStateData"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"

import AmountInput from "../../components/AmountInput"
import ActionButton from "../../components/ActionButton"
import SlippageSetting from "../../components/SlippageSetting"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { initPyPosition, redeemSyCoin, swapExactYtForSy } from "@/lib/txHelper"
import { burnSCoin } from "@/lib/txHelper/coin"
import { getPriceVoucher } from "@/lib/txHelper/price"
import Image from "next/image"

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

  const price = useMemo(() => ptYtData?.ytPrice?.toString(), [ptYtData])

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

  const priceImpact = useMemo(() => {
    if (
      !targetValue ||
      !redeemValue ||
      !ptYtData?.ytPrice ||
      !coinConfig?.coinPrice ||
      !coinConfig?.underlyingPrice
    ) {
      return
    }

    const inputValue = new Decimal(redeemValue).mul(ptYtData.ytPrice)

    const outputValue = new Decimal(targetValue).mul(
      receivingType === "underlying"
        ? coinConfig.underlyingPrice ?? "0"
        : coinConfig.coinPrice ?? "0"
    )

    const value = outputValue
    const ratio = safeDivide(
      inputValue.minus(outputValue),
      inputValue,
      "decimal"
    ).mul(100)

    return { value, ratio }
  }, [
    targetValue,
    redeemValue,
    receivingType,
    ptYtData?.ytPrice,
    coinConfig?.coinPrice,
    coinConfig?.underlyingPrice,
  ])

  return (
    <div className="flex flex-col gap-6">
      <AmountInput
        error={error}
        price={price}
        decimal={decimal}
        warning={warning}
        title={"Trade".toUpperCase()}
        coinName={`YT ${coinConfig?.coinName}`}
        amount={redeemValue}
        isLoading={isLoading}
        setWarning={setWarning}
        isConnected={isConnected}
        errorDetail={errorDetail}
        onChange={handleInputChange}
        maturity={coinConfig?.maturity}
        coinLogo={coinConfig?.coinLogo}
        coinBalance={ytBalance}
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ArrowUpDown className="w-5 h-5" />
      </div>

      <div className="bg-[#FCFCFC]/[0.03] rounded-2xl shadow-lg px-6 py-6 w-full flex items-center justify-between min-h-[80px]">
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-xs text-[#FCFCFC]/40 font-medium">RECEIVE</span>
          <div className="mt-2 flex items-baseline gap-x-3 min-w-0">
            <span className="text-xl font-medium text-white truncate">
              {isLoading ? (
                <div className="h-7 sm:h-8 w-36 sm:w-48 bg-[#FCFCFC]/[0.03] animate-pulse rounded" />
              ) : isValidAmount(targetValue) ? (
                formatDecimalValue(targetValue, decimal)
              ) : (
                "--"
              )}
            </span>
            <span className="flex items-baseline gap-x-1 min-w-0">
              {isLoading ? (
                <div className="h-4 w-24 bg-light-gray/10 animate-pulse rounded" />
              ) : priceImpact ? (
                <>
                  <span className="text-base text-light-gray/40 font-medium truncate">
                    ~ ${formatDecimalValue(priceImpact.value, 2)}
                  </span>
                  <span className="text-base font-bold text-[#FF8800] truncate">
                    ({formatDecimalValue(priceImpact.ratio, 2)}%)
                  </span>
                </>
              ) : null}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between h-[60px] min-w-[120px]">
          <div className="flex items-center gap-x-2">
            <span className="text-xl font-[650] text-white truncate">
              <Select
                value={receivingType}
                onValueChange={(value) => {
                  const newTargetValue = convertReceivingValue(
                    targetValue,
                    receivingType,
                    value
                  )
                  setReceivingType(value as "underlying" | "sy")
                  setTargetValue(newTargetValue)
                }}
              >
                <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-xl font-[650] text-white flex items-center gap-x-2 w-fit">
                  <SelectValue>
                    <div className="flex items-center gap-x-2">
                      <span
                        className="max-w-20 truncate"
                        title={
                          receivingType === "underlying"
                            ? coinConfig?.underlyingCoinName
                            : coinConfig?.coinName
                        }
                      >
                        {receivingType === "underlying"
                          ? coinConfig?.underlyingCoinName
                          : coinConfig?.coinName}
                      </span>
                      {(receivingType === "underlying"
                        ? coinConfig?.underlyingCoinLogo
                        : coinConfig?.coinLogo) && (
                        <Image
                          width={20}
                          height={20}
                          src={
                            receivingType === "underlying"
                              ? coinConfig?.underlyingCoinLogo
                              : coinConfig?.coinLogo
                          }
                          alt={
                            receivingType === "underlying"
                              ? coinConfig?.underlyingCoinName
                              : coinConfig?.coinName
                          }
                          className="size-5"
                        />
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-none outline-none bg-[#0E0F16]">
                  <SelectGroup>
                    <SelectItem
                      value="underlying"
                      className="cursor-pointer text-white"
                    >
                      <div className="flex items-center gap-x-1">
                        <span>{coinConfig?.underlyingCoinName}</span>
                        {coinConfig?.underlyingCoinLogo && (
                          <Image
                            width={20}
                            height={20}
                            src={coinConfig.underlyingCoinLogo}
                            alt={coinConfig.underlyingCoinName}
                            className="size-4 sm:size-5"
                          />
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="sy"
                      className="cursor-pointer text-white"
                    >
                      <div className="flex items-center gap-x-1">
                        <span>{coinConfig?.coinName}</span>
                        {coinConfig?.coinLogo && (
                          <Image
                            width={20}
                            height={20}
                            src={coinConfig.coinLogo}
                            alt={coinConfig.coinName}
                            className="size-4 sm:size-5"
                          />
                        )}
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </span>
          </div>
          <span className="text-xs text-[#FCFCFC]/40 mt-1.5 flex items-center gap-x-1">
            {coinConfig?.maturity && (
              <>
                <span>
                  {`${formatTimeDiff(
                    parseInt(coinConfig.maturity)
                  )} LEFT・ ${dayjs(parseInt(coinConfig.maturity)).format(
                    "DD MMM YYYY"
                  )}`}
                </span>
                <Image
                  width={12}
                  height={12}
                  src="/assets/images/date.svg"
                  alt="date"
                />
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <span className="text-light-gray/40">Slippage</span>
        <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
      </div>

      <ActionButton
        btnText="Sell"
        onClick={redeem}
        loading={isRedeeming}
        disabled={btnDisabled}
      />
    </div>
  )
}
