"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import Decimal from "decimal.js"
import { ChevronsDown, Info } from "lucide-react"

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
import {
  CETUS_VAULT_ID_LIST,
  NEED_MIN_VALUE_LIST,
  UNSUPPORTED_UNDERLYING_COINS,
} from "@/lib/constants"

import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import useSellPtDryRun from "@/hooks/dryRun/pt/useSellPtDryRun"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { redeemSyCoin, swapExactPtForSy, splitCoinHelper } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { burnSCoin } from "@/lib/txHelper/coin"
import { burnPt } from "@/lib/txHelper/pt"
import { initPyPosition } from "@/lib/txHelper/position"
import Image from "next/image"

interface Props {
  coinConfig: CoinConfig
}

export default function Sell({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [syAmount, setSyAmount] = useState("")
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

  const { mutateAsync: sellPtDryRun } = useSellPtDryRun(coinConfig)
  const { data: ptCoins } = useCoinData(address, coinConfig?.ptTokenType)

  const debouncedGetSyOut = useCallback(
    (value: string, decimal: number) => {
      const getSyOut = debounce(async () => {
        if (isValidAmount(value) && decimal && coinConfig?.conversionRate) {
          try {
            const inputAmount = new Decimal(value).mul(10 ** decimal).toString()
            const { outputValue, syAmount } = await sellPtDryRun({
              vaultId,
              slippage,
              ptCoins,
              minSyOut: "0",
              receivingType: "sy",
              ptAmount: inputAmount,
              pyPositions: pyPositionData,
            })
            setSyAmount(syAmount)

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
                )} PT ${coinConfig.coinName}`
              )
            } else {
              setError(undefined)
            }
          } catch (errorMsg) {
            const { error, detail } = parseErrorMessage(
              (errorMsg as Error)?.message
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
      sellPtDryRun,
      vaultId,
      slippage,
      pyPositionData,
      ptCoins,
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

  const ptTokenBalance = useMemo(() => {
    if (coinConfig?.ptTokenType && ptCoins?.length) {
      return ptCoins
        ?.reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [ptCoins, decimal, coinConfig?.ptTokenType])

  const ptPositionBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        ?.reduce((total, coin) => total.add(coin.ptBalance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

  const ptBalance = useMemo(
    () => new Decimal(ptPositionBalance).add(ptTokenBalance).toString(),
    [ptPositionBalance, ptTokenBalance]
  )

  const insufficientBalance = useMemo(
    () => new Decimal(Number(ptBalance)).lt(redeemValue || 0),
    [ptBalance, redeemValue]
  )

  const handleInputChange = (value: string) => {
    setRedeemValue(value)
  }

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition()])
  }, [refetchPyPosition])

  async function redeem() {
    if (!insufficientBalance && coinConfig && address && syAmount) {
      try {
        setIsRedeeming(true)
        const tx = new Transaction()

        const { pyPosition, created } = initPyPosition({
          tx,
          coinConfig,
          pyPositions: pyPositionData,
        })

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const inputAmount = new Decimal(redeemValue)
          .mul(10 ** decimal)
          .toString()

        const minSyOut = new Decimal(syAmount)
          .mul(new Decimal(1).sub(new Decimal(slippage).div(100)))
          .toFixed(0)

        if (coinConfig?.ptTokenType && ptCoins?.length) {
          const [ptCoin] = splitCoinHelper(
            tx,
            ptCoins,
            [inputAmount],
            coinConfig.ptTokenType
          )
          burnPt({
            tx,
            coinConfig,
            ptCoin,
            pyPosition,
          })
        }

        const syCoin = swapExactPtForSy(
          tx,
          coinConfig,
          inputAmount,
          pyPosition,
          priceVoucher,
          minSyOut
        )

        const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

        if (
          receivingType === "underlying" &&
          !UNSUPPORTED_UNDERLYING_COINS.includes(coinConfig?.coinType)
        ) {
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

  const price = useMemo(() => ptYtData?.ptPrice?.toString(), [ptYtData])

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
      !ptYtData?.ptPrice ||
      !coinConfig?.coinPrice ||
      !coinConfig?.underlyingPrice
    ) {
      return
    }

    const inputValue = new Decimal(redeemValue).mul(ptYtData.ptPrice)
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
    ptYtData?.ptPrice,
    coinConfig?.coinPrice,
    coinConfig?.underlyingPrice,
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
      </div>
      <AmountInput
        error={error}
        price={price}
        decimal={decimal}
        warning={warning}
        coinName={`PT ${coinConfig?.coinName}`}
        amount={redeemValue}
        isLoading={isLoading}
        setWarning={setWarning}
        isConnected={isConnected}
        errorDetail={errorDetail}
        onChange={handleInputChange}
        maturity={coinConfig?.maturity}
        coinLogo={coinConfig?.coinLogo}
        isConfigLoading={false}
        coinBalance={
          coinConfig?.ptTokenType ? ptTokenBalance : ptPositionBalance
        }
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ChevronsDown className="w-5 h-5" />
      </div>

      <div className="rounded-lg sm:rounded-xl border border-[#2D2D48] px-3 sm:px-4 py-4 sm:py-6 w-full text-xs sm:text-sm">
        <div className="flex flex-col items-end gap-y-0.5 sm:gap-y-1">
          <div className="flex items-center justify-between w-full h-[24px] sm:h-[28px]">
            <span>Receiving</span>
            <span>
              {isLoading ? (
                <Skeleton className="h-6 sm:h-7 w-36 sm:w-48 bg-[#2D2D48]" />
              ) : (
                <div className="flex items-center gap-x-1 sm:gap-x-1.5">
                  <span>
                    {isValidAmount(targetValue)
                      ? `≈ ${formatDecimalValue(targetValue, decimal)}`
                      : "0"}
                  </span>
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
                    <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-sm sm:text-base w-fit">
                      <SelectValue>
                        <div className="flex items-center gap-x-1">
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
                              width={16}
                              height={16}
                              className="size-4 sm:size-5"
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
                                src={coinConfig.underlyingCoinLogo}
                                alt={coinConfig.underlyingCoinName}
                                width={16}
                                height={16}
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
                                src={coinConfig.coinLogo}
                                alt={coinConfig.coinName}
                                width={16}
                                height={16}
                                className="size-4 sm:size-5"
                              />
                            )}
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </span>
          </div>
          {isLoading ? (
            <div className="text-[10px] sm:text-xs">
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 bg-[#2D2D48]" />
            </div>
          ) : priceImpact ? (
            <div className="flex items-center gap-x-1 text-[10px] sm:text-xs">
              {priceImpact.ratio.gt(5) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className={`size-2.5 sm:size-3 cursor-pointer ${
                          priceImpact.ratio.gt(15)
                            ? "text-red-500"
                            : priceImpact.ratio.gt(5)
                            ? "text-yellow-500"
                            : "text-white/60"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#12121B] max-w-[280px] sm:max-w-[500px] text-xs sm:text-sm">
                      <p>
                        Price Impact Alert: Price impact is too high. Please
                        consider adjusting the transaction size.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span
                className={`text-[10px] sm:text-xs ${
                  priceImpact.ratio.gt(15)
                    ? "text-red-500"
                    : priceImpact.ratio.gt(5)
                    ? "text-yellow-500"
                    : "text-white/60"
                }`}
              >
                ${formatDecimalValue(priceImpact.value, 4)}
              </span>
              <span
                className={`text-[10px] sm:text-xs ${
                  priceImpact.ratio.gt(15)
                    ? "text-red-500"
                    : priceImpact.ratio.gt(5)
                    ? "text-yellow-500"
                    : "text-white/60"
                }`}
              >
                ({formatDecimalValue(priceImpact.ratio, 4)}%)
              </span>
            </div>
          ) : null}
        </div>
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
