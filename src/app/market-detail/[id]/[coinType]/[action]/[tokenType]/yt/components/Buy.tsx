"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { Transaction } from "@mysten/sui/transactions"
import Decimal from "decimal.js"
import { ArrowUpDown } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import { network } from "@/config"
import { CoinConfig } from "@/queries/types/market"
import { formatDecimalValue, isValidAmount, debounce } from "@/lib/utils"
import { parseErrorMessage, parseGasErrorMessage } from "@/lib/errorMapping"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"

import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useGetApproxYtOutDryRun from "@/hooks/dryRun/useGetApproxYtOutDryRun"
import useGetConversionRateDryRun from "@/hooks/dryRun/useGetConversionRateDryRun"
import useQueryYtOutBySyInWithVoucher from "@/hooks/useQueryYtOutBySyInWithVoucher"
import useMarketStateData from "@/hooks/useMarketStateData"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"

import AmountInput from "../../components/AmountInput"
import ActionButton from "../../components/ActionButton"
import SlippageSetting from "../../components/SlippageSetting"
import { AmountOutput } from "../../components/AmountOutput"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { depositSyCoin, initPyPosition, splitCoinHelper } from "@/lib/txHelper"
import { mintSCoin } from "@/lib/txHelper/coin"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { debugLog } from "@/config"
import Calculator from "../../components/Calculator"
import GuideModal from "../../components/GuideModal"

interface Props {
  coinConfig: CoinConfig
}

export default function Buy({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [tradeValue, setTradeValue] = useState("")
  const [error, setError] = useState<string>()
  const [ytValue, setYtValue] = useState<string>()
  const [ytFeeValue, setYtFeeValue] = useState<string>()
  const [isSwapping, setIsSwapping] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string>()
  const [tokenType, setTokenType] = useState<number>(0)
  const [isCalcYtLoading, setIsCalcYtLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [minValue, setMinValue] = useState(0)

  const { address, signAndExecuteTransaction } = useWallet()
  const isConnected = useMemo(() => !!address, [address])

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

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

  const ytBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, item) => total.add(item.ytBalance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

  const {
    data: coinData,
    refetch: refetchCoinData,
    isLoading: isBalanceLoading,
  } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinConfig?.coinType
  )

  const { mutateAsync: getConversionRate } = useGetConversionRateDryRun()
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
          } catch (error) {
            const { error: msg, detail } = parseErrorMessage(
              (error as Error)?.message ?? ""
            )
            setError(msg)
            setErrorDetail(detail)
            setYtValue(undefined)
            setYtFeeValue(undefined)
          } finally {
            setIsCalcYtLoading(false)
          }
        } else {
          setYtValue(undefined)
          setYtFeeValue(undefined)
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

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "1") // Switch to sell mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

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
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <Calculator
        open={open}
        inputYT={tradeValue}
        outputYT={Number(ytValue)}
        coinConfig={coinConfig}
        onClose={() => setOpen(false)}
        coinName={coinName}
        rate={
          ptYtData?.ytPrice &&
          price &&
          formatDecimalValue(new Decimal(1).div(ptYtData.ytPrice).mul(price), 6)
        }
        setTradeValue={setTradeValue}
      />
      <AmountInput
        title={"Trade".toUpperCase()}
        amount={tradeValue}
        onChange={setTradeValue}
        name={coinName}
        logo={coinLogo}
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
              <SelectValue>
                <div className="flex items-center gap-x-1">
                  <span
                    className="max-w-20 truncate text-xl"
                    title={
                      tokenType === 0
                        ? coinConfig?.underlyingCoinName
                        : coinConfig?.coinName
                    }
                  >
                    {tokenType === 0
                      ? coinConfig?.underlyingCoinName
                      : coinConfig?.coinName}
                  </span>
                  {(tokenType === 0
                    ? coinConfig?.underlyingCoinLogo
                    : coinConfig?.coinLogo) && (
                    <Image
                      src={
                        tokenType === 0
                          ? coinConfig?.underlyingCoinLogo
                          : coinConfig?.coinLogo
                      }
                      alt={
                        tokenType === 0
                          ? coinConfig?.underlyingCoinName
                          : coinConfig?.coinName
                      }
                      className="size-4 sm:size-5"
                      width={20}
                      height={20}
                    />
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-none outline-none bg-light-gray/10">
              <SelectGroup>
                <SelectItem value="0" className="cursor-pointer text-white ">
                  <div className="flex items-center gap-x-1">
                    <span>{coinConfig?.underlyingCoinName}</span>
                    {coinConfig?.underlyingCoinLogo && (
                      <Image
                        src={coinConfig.underlyingCoinLogo}
                        alt={coinConfig.underlyingCoinName}
                        className="size-4 sm:size-5"
                        width={20}
                        height={20}
                      />
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="1" className="cursor-pointer text-white ">
                  <div className="flex items-center gap-x-1">
                    <span>{coinConfig?.coinName}</span>
                    {coinConfig?.ytTokenLogo && (
                      <Image
                        src={coinConfig.coinLogo}
                        alt={coinConfig.coinName}
                        className="size-4 sm:size-5"
                        width={20}
                        height={20}
                      />
                    )}
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors" onClick={handleModeSwitch}>
        <ArrowUpDown className="w-5 h-5" />
      </div>

      <AmountOutput
        amount={ytValue}
        loading={isCalcYtLoading}
        logo={coinConfig.ytTokenLogo}
        balance={ytBalance}
        name={`YT ${coinConfig.coinName}`}
      />

      <div className="text-sm text-slate-400 flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-light-gray/40">Yield APY Change</span>
          <span className="text-white">
            {ptYtData?.ytApy
              ? `${formatDecimalValue(ptYtData.ytApy, 6)} %`
              : "--"}
          </span>
        </div>
        <div className="border-b border-light-gray/10"></div>
        <div className="flex justify-between">
          <span className="text-light-gray/40">Price</span>
          <span className="text-white">
            {ptYtData?.ytPrice && price
              ? `1 ${coinName} = ${formatDecimalValue(
                  new Decimal(1).div(ptYtData.ytPrice).mul(price),
                  6
                )} YT ${coinConfig?.coinName}`
              : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-gray/40">Trading Fees</span>
          <span className="text-white">
            {ytFeeValue
              ? `${formatDecimalValue(ytFeeValue, 6)} ${coinConfig?.coinName}`
              : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-gray/40">Slippage</span>
          <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
        </div>
      </div>
      <div className="flex gap-4">
        <ActionButton
          btnText={btnText}
          disabled={btnDisabled}
          loading={isSwapping}
          onClick={swap}
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
