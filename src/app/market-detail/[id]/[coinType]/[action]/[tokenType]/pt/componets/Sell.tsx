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
import { TokenTypeSelect } from "../../components/TokenTypeSelect"
import { AmountOutput } from "../../components/AmountOutput"

import { redeemSyCoin, swapExactPtForSy, splitCoinHelper } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { burnSCoin } from "@/lib/txHelper/coin"
import { burnPt } from "@/lib/txHelper/pt"
import { initPyPosition } from "@/lib/txHelper/position"
import GuideModal from "../../components/GuideModal"

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

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "0") // Switch to buy mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <AmountInput
        error={error}
        price={price}
        decimal={decimal}
        warning={warning}
        title={"Trade".toUpperCase()}
        name={`PT ${coinConfig?.coinName}`}
        amount={redeemValue}
        isLoading={isLoading}
        setWarning={setWarning}
        isConnected={isConnected}
        errorDetail={errorDetail}
        onChange={handleInputChange}
        maturity={coinConfig?.maturity}
        logo={coinConfig.ptTokenLogo}
        isConfigLoading={false}
        coinBalance={
          coinConfig?.ptTokenType ? ptTokenBalance : ptPositionBalance
        }
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
        warningDetail={
          priceImpact
            ? `~ $${formatDecimalValue(
                priceImpact.value,
                2
              )} (${formatDecimalValue(priceImpact.ratio, 2)}%)`
            : undefined
        }
      />

      <div className="flex justify-between">
        <span className="text-light-gray/40">Slippage</span>
        <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
      </div>

      <ActionButton
        btnText="Sell"
        onClick={redeem}
        loading={isRedeeming}
        disabled={btnDisabled}
        type="red"
      />

      <GuideModal imageUrl="/assets/images/guide/pt.png" />
    </div>
  )
}
