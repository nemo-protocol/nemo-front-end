import Decimal from "decimal.js"
import { network } from "@/config"
import { ArrowUpDown } from "lucide-react"
import { ContractError } from "@/hooks/types"
import { CoinConfig } from "@/queries/types/market"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useSearchParams, useRouter } from "next/navigation"
import { showTransactionDialog } from "@/lib/dialog"
import { CETUS_VAULT_ID_LIST } from "@/lib/constants"
import useRedeemLp from "@/hooks/actions/useRedeemLp"
import { parseErrorMessage } from "@/lib/errorMapping"
import AmountInput from "../../components/AmountInput"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import ActionButton from "../../components/ActionButton"
import usePyPositionData from "@/hooks/usePyPositionData"
import useMarketStateData from "@/hooks/useMarketStateData"
import useBurnLpDryRun from "@/hooks/dryRun/useBurnLpDryRun"
import { AmountOutput } from "../../components/AmountOutput"
import SlippageSetting from "../../components/SlippageSetting"
import useSellPtDryRun from "@/hooks/dryRun/pt/useSellPtDryRun"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import { useMemo, useState, useEffect, useCallback } from "react"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"
import useLpMarketPositionData from "@/hooks/useLpMarketPositionData"
import { debounce, isValidAmount, formatDecimalValue } from "@/lib/utils"
import useCoinData from "@/hooks/query/useCoinData"
import SwapSupplyGuideModal from "./SwapSupplyGuideModal"
import MintSupplyGuideModal from "./MintSupplyGuideModal"

interface Props {
  coinConfig: CoinConfig
}

export default function Remove({ coinConfig }: Props) {
  const [lpValue, setLpValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [error, setError] = useState<string>()
  const [ptValue, setPtValue] = useState("")
  const { account: currentAccount } = useWallet()
  const [inputWarning, setInputWarning] = useState<string>()
  const [outputWarning, setOutputWarning] = useState<string>()
  const [targetValue, setTargetValue] = useState("")
  const [isRemoving, setIsRemoving] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string>()
  const [isInputLoading, setIsInputLoading] = useState(false)
  const [action, setAction] = useState<"swap" | "redeem">("swap")
  const [receivingType, setReceivingType] = useState<"underlying" | "sy">(
    "underlying"
  )

  const searchParams = useSearchParams()
  const router = useRouter()

  const handleActionChange = (newAction: "swap" | "redeem") => {
    setAction(newAction)
    setLpValue("")
    setTargetValue("")
    setPtValue("")
    setError(undefined)
    setInputWarning(undefined)
    setOutputWarning(undefined)
    setErrorDetail(undefined)

    const params = new URLSearchParams(searchParams.toString())
    params.set("action", newAction === "swap" ? "0" : "1")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const urlAction = searchParams.get("action")
    if (urlAction === "0") {
      setAction("swap")
    } else if (urlAction === "1") {
      setAction("redeem")
    }
  }, [searchParams])

  const address = useMemo(() => currentAccount?.address, [currentAccount])
  const isConnected = useMemo(() => !!address, [address])
  const decimal = useMemo(() => Number(coinConfig?.decimal), [coinConfig])
  const { data: marketState } = useMarketStateData(coinConfig?.marketStateId)

  const { data: ptYtData, refresh: refreshPtYt } = useCalculatePtYt(
    coinConfig,
    marketState
  )

  const { mutateAsync: burnLpDryRun } = useBurnLpDryRun(coinConfig)

  const { data: coinData } = useCoinData(
    address,
    receivingType === "underlying"
      ? coinConfig?.underlyingCoinType
      : coinConfig?.coinType
  )

  const { data: lppMarketPositionData, refetch: refetchLpPosition } =
    useLpMarketPositionData(
      address,
      coinConfig?.marketStateId,
      coinConfig?.maturity,
      coinConfig?.marketPositionTypeList
    )

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const coinBalance = useMemo(() => {
    return coinData
      ?.reduce((total, item) => total.add(item.balance), new Decimal(0))
      .div(new Decimal(10).pow(decimal))
      .toString()
  }, [coinData])

  const ytBalance = useMemo(() => {
    return pyPositionData
      ?.reduce((total, item) => total.add(item.ytBalance), new Decimal(0))
      .div(new Decimal(10).pow(decimal))
      .toString()
  }, [pyPositionData])

  const ptBalance = useMemo(() => {
    return pyPositionData
      ?.reduce((total, item) => total.add(item.ptBalance), new Decimal(0))
      .div(new Decimal(10).pow(decimal))
      .toString()
  }, [pyPositionData])

  const { isLoading } = useInputLoadingState(lpValue, false)

  const lpCoinBalance = useMemo(() => {
    if (lppMarketPositionData?.length) {
      return lppMarketPositionData
        .reduce((total, item) => total.add(item.lp_amount), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(9)
    }
    return "0"
  }, [decimal, lppMarketPositionData])

  const insufficientBalance = useMemo(
    () => new Decimal(lpCoinBalance).lt(new Decimal(lpValue || 0)),
    [lpCoinBalance, lpValue]
  )

  const lpPrice = useMemo(() => {
    if (ptYtData?.lpPrice) {
      return new Decimal(ptYtData.lpPrice).toString()
    }
    return "0"
  }, [ptYtData?.lpPrice])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
            (item) => item.coinType === coinConfig?.coinType
          )?.vaultId
        : "",
    [coinConfig]
  )

  const { mutateAsync: sellPtDryRun } = useSellPtDryRun(coinConfig)

  const debouncedGetSyOut = useCallback(
    (value: string, decimal: number) => {
      const getSyOut = debounce(async () => {
        setError(undefined)
        setInputWarning(undefined)
        setOutputWarning(undefined)
        if (value && value !== "0" && decimal) {
          setIsInputLoading(true)
          try {
            const lpAmount = new Decimal(value).mul(10 ** decimal).toFixed(0)
            const [{ ptAmount, ptValue, outputValue }] = await burnLpDryRun({
              slippage,
              vaultId,
              lpAmount,
              receivingType,
            })

            if (action === "swap") {
              try {
                const { outputValue: swappedOutputValue } = await sellPtDryRun({
                  slippage,
                  vaultId,
                  ptAmount,
                  minSyOut: "0",
                  receivingType,
                  pyPositions: pyPositionData,
                })

                const targetValue = new Decimal(outputValue)
                  .add(swappedOutputValue)
                  .toFixed(decimal)
                setTargetValue(targetValue)
              } catch (error) {
                setTargetValue(outputValue)
                setInputWarning(
                  `Returning ${ptValue} PT ${coinConfig?.coinName}.`
                )
                setOutputWarning(
                  `PT could be sold at the market, or it could be redeemed after maturity with a fixed return.`
                )
                console.log("sellPtDryRun error", error)
              }
            } else {
              setPtValue(ptValue)
              setTargetValue(outputValue)
            }
          } catch (errorMsg) {
            const { error: msg, detail } = parseErrorMessage(
              (errorMsg as ContractError)?.message ?? errorMsg
            )
            setErrorDetail(detail)
            setError(msg)
            console.log("burnLpDryRun error", errorMsg)
          } finally {
            setIsInputLoading(false)
          }
        } else {
          setTargetValue("")
        }
      }, 500)
      getSyOut()
      return getSyOut.cancel
    },
    [
      action,
      vaultId,
      slippage,
      burnLpDryRun,
      sellPtDryRun,
      receivingType,
      pyPositionData,
      coinConfig?.coinName,
    ]
  )
  const btnText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient LP ${coinConfig?.coinName} balance`
    }
    if (lpValue === "") {
      return "Please enter an amount"
    }
    if (coinConfig?.tradeStatus === "0") {
      return "Trade Paused"
    }
    return "Remove"
  }, [
    insufficientBalance,
    lpValue,
    coinConfig?.coinName,
    coinConfig?.tradeStatus,
  ])
  const btnDisabled = useMemo(() => {
    return (
      !!error ||
      lpValue === "" ||
      insufficientBalance ||
      !isValidAmount(lpValue) ||
      coinConfig?.tradeStatus === "0"
    )
  }, [error, lpValue, insufficientBalance, coinConfig?.tradeStatus])
  useEffect(() => {
    const cancelFn = debouncedGetSyOut(lpValue, decimal ?? 0)
    return () => {
      cancelFn()
    }
  }, [lpValue, decimal, debouncedGetSyOut, receivingType])
  const refreshData = useCallback(async () => {
    await Promise.all([refetchLpPosition(), refetchPyPosition()])
  }, [refetchLpPosition, refetchPyPosition])
  const { mutateAsync: redeemLp } = useRedeemLp(coinConfig, marketState)
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

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "0") // Switch to add mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  async function remove() {
    if (
      decimal &&
      address &&
      coinConfig?.coinType &&
      ytBalance &&
      coinConfig &&
      pyPositionData &&
      !insufficientBalance &&
      lppMarketPositionData?.length &&
      coinConfig?.tradeStatus === "1"
    ) {
      try {
        setIsRemoving(true)
        const lpAmount = new Decimal(lpValue).mul(10 ** decimal).toFixed(0)
        const { digest } = await redeemLp({
          vaultId,
          slippage,
          lpAmount,
          ytBalance,
          coinConfig,
          receivingType,
          pyPositions: pyPositionData,
          lpPositions: lppMarketPositionData,
        })
        if (digest)
          showTransactionDialog({
            status: "Success",
            network,
            txId: digest,
            onClose: async () => {
              await refreshData()
              await refreshPtYt()
            },
          })
        setLpValue("")
      } catch (errorMsg) {
        const { error: msg, detail } = parseErrorMessage(
          (errorMsg as ContractError)?.message ?? errorMsg
        )
        setErrorDetail(detail)
        showTransactionDialog({
          status: "Failed",
          network,
          txId: "",
          message: msg,
        })
      } finally {
        setIsRemoving(false)
      }
    }
  }

  useEffect(() => {
    console.log("action", action)
  }, [action])

  return (
    <div className="flex flex-col items-center gap-y-6">
      <div className="flex gap-2 w-full">
        <button
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
            action === "swap"
              ? "bg-white/10 text-white"
              : "bg-transparent text-white/40 hover:text-white/80"
          }`}
          onClick={() => handleActionChange("swap")}
        >
          {`swap & remove`.toLocaleUpperCase()}
        </button>
        <button
          onClick={() => handleActionChange("redeem")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
            action === "redeem"
              ? "bg-white/10 text-white"
              : "bg-transparent text-white/40 hover:text-white/80"
          }`}
        >
          {`redeem & remove`.toLocaleUpperCase()}
        </button>
      </div>
      <AmountInput
        error={error}
        price={lpPrice}
        decimal={decimal}
        amount={lpValue}
        isLoading={isLoading}
        onChange={setLpValue}
        warning={inputWarning}
        isConnected={isConnected}
        errorDetail={errorDetail}
        coinBalance={lpCoinBalance}
        setWarning={setInputWarning}
        logo={coinConfig?.lpTokenLogo}
        maturity={coinConfig.maturity}
        name={`LP ${coinConfig?.coinName}`}
        title={"Remove Liquidity".toUpperCase()}
      />
      <div
        className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors"
        onClick={handleModeSwitch}
      >
        <ArrowUpDown className="w-5 h-5" />
      </div>
      {action === "swap" ? (
        <AmountOutput
          balance={coinBalance}
          loading={isInputLoading}
          price={coinConfig.underlyingPrice}
          name={
            receivingType === "underlying"
              ? coinConfig?.underlyingCoinName || ""
              : coinConfig?.coinName || ""
          }
          logo={
            receivingType === "underlying"
              ? coinConfig?.underlyingCoinLogo
              : coinConfig?.coinLogo
          }
          title={"RECEIVE"}
          amount={targetValue && formatDecimalValue(targetValue, decimal)}
          coinNameComponent={
            <div className="flex items-center gap-x-1">
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
            </div>
          }
          warningDetail={outputWarning}
        />
      ) : (
        <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
          <AmountOutput
            balance={coinBalance}
            loading={isInputLoading}
            warningDetail={outputWarning}
            price={coinConfig.underlyingPrice}
            className="bg-transparent rounded-none"
            name={
              receivingType === "underlying"
                ? coinConfig?.underlyingCoinName || ""
                : coinConfig?.coinName || ""
            }
            logo={
              receivingType === "underlying"
                ? coinConfig?.underlyingCoinLogo
                : coinConfig?.coinLogo
            }
            title={"Underlying asset".toLocaleUpperCase()}
            amount={targetValue && formatDecimalValue(targetValue, decimal)}
            coinNameComponent={
              <div className="flex items-center gap-x-1">
                <TokenTypeSelect
                  value={receivingType}
                  options={[
                    {
                      label: coinConfig.underlyingCoinName,
                      logo: coinConfig.underlyingCoinLogo,
                      value: "underlying",
                    },
                    {
                      label: coinConfig.coinName,
                      logo: coinConfig.coinLogo,
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
              </div>
            }
          />
          <AmountOutput
            balance={ptBalance}
            loading={isInputLoading}
            price={coinConfig.ptPrice}
            logo={coinConfig.ptTokenLogo}
            maturity={coinConfig.maturity}
            name={`PT ${coinConfig.coinName}`}
            title={"PT asset".toLocaleUpperCase()}
            className="bg-transparent rounded-none"
            amount={ptValue && formatDecimalValue(ptValue, decimal)}
          />
        </div>
      )}

      <div className="w-full divide-y-1 space-y-2 divide-white/10 text-sm text-white/40">
        <p className="flex justify-between text-sm pb-2">
          <span>Pool APY Change</span>
          <span className="text-white">X% - Y%</span>
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Slippage</span>
            <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
          </div>
        </div>
      </div>
      <ActionButton
        onClick={remove}
        btnText={btnText}
        loading={isRemoving}
        type="red"
        disabled={btnDisabled}
      />

      {action === "swap" ? <SwapSupplyGuideModal /> : <MintSupplyGuideModal />}
    </div>
  )
}
