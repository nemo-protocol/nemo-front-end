import Decimal from "decimal.js"
import { network } from "@/config"
import { ArrowUpDown } from "lucide-react"
import { ContractError } from "@/hooks/types"
import { CoinConfig } from "@/queries/types/market"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { showTransactionDialog } from "@/lib/dialog"
import AmountInput from "../../components/AmountInput"
import { Transaction } from "@mysten/sui/transactions"
import { parseErrorMessage } from "@/lib/errorMapping"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import { redeemPy, redeemSyCoin } from "@/lib/txHelper"
import ActionButton from "../../components/ActionButton"
import { initPyPosition } from "@/lib/txHelper/position"
import usePyPositionData from "@/hooks/usePyPositionData"
import { debounce, formatDecimalValue } from "@/lib/utils"
import useMarketStateData from "@/hooks/useMarketStateData"
import { AmountOutput } from "../../components/AmountOutput"
import useRedeemPYDryRun from "@/hooks/dryRun/useRedeemPYDryRun"
import { useMemo, useState, useCallback, useEffect } from "react"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"
import useCoinData from "@/hooks/query/useCoinData"
import GuideModal from "./GuideModal"
import { useRouter, useSearchParams } from "next/navigation"
import { burnSCoin } from "@/lib/txHelper/coin"
import { NO_SUPPORT_UNDERLYING_COINS } from "@/lib/constants"

interface Props {
  coinConfig: CoinConfig
}

export default function Redeem({ coinConfig }: Props) {
  const [outputValue, setOutputValue] = useState("")
  const [redeemValue, setRedeemValue] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const { address, signAndExecuteTransaction } = useWallet()
  const [isInputLoading, setIsInputLoading] = useState(false)
  const [receivingType, setReceivingType] = useState<"underlying" | "sy">(
    "underlying"
  )

  const router = useRouter()
  const searchParams = useSearchParams()

  const { data: coinData } = useCoinData(
    address,
    receivingType === "underlying"
      ? coinConfig?.underlyingCoinType
      : coinConfig.id
  )

  const isConnected = useMemo(() => !!address, [address])

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const decimal = useMemo(() => Number(coinConfig?.decimal), [coinConfig])

  const ptBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return formatDecimalValue(
        pyPositionData
          .reduce((total, coin) => total.add(coin.ptBalance), new Decimal(0))
          .div(10 ** decimal),
        decimal
      )
    }
    return "0"
  }, [pyPositionData, decimal])

  const ytBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return formatDecimalValue(
        pyPositionData
          .reduce((total, coin) => total.add(coin.ytBalance), new Decimal(0))
          .div(10 ** decimal),
        decimal
      )
    }
    return "0"
  }, [pyPositionData, decimal])

  const coinBalance = useMemo(() => {
    if (coinData?.length) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const insufficientPtBalance = useMemo(() => {
    return new Decimal(ptBalance).lt(redeemValue || 0)
  }, [ptBalance, redeemValue])

  const insufficientYtBalance = useMemo(() => {
    return new Decimal(ytBalance).lt(redeemValue || 0)
  }, [ytBalance, redeemValue])

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition()])
  }, [refetchPyPosition])

  const { data: marketState } = useMarketStateData(coinConfig?.marketStateId)

  const { data: ptYtData, refetch: refetchPtYtData } = useCalculatePtYt(
    coinConfig,
    marketState
  )

  const { mutateAsync: redeemDryRun } = useRedeemPYDryRun(coinConfig)

  const debouncedGetRedeemOut = useCallback(
    (value: string, decimal: number) => {
      const getRedeemOut = debounce(async () => {
        if (value && value !== "0" && decimal) {
          setIsInputLoading(true)
          try {
            const amount = new Decimal(value)
              .mul(new Decimal(10).pow(coinConfig.decimal))
              .toString()

            const { outputValue } = await redeemDryRun({
              ptAmount: amount,
              ytAmount: amount,
              pyPositions: pyPositionData,
              receivingType,
            })
            setOutputValue(outputValue)
          } catch (error) {
            console.error("Dry run error:", error)
            setOutputValue("")
          } finally {
            setIsInputLoading(false)
          }
        } else {
          setOutputValue("")
        }
      }, 500)

      getRedeemOut()
      return getRedeemOut.cancel
    },
    [redeemDryRun, pyPositionData, receivingType]
  )

  useEffect(() => {
    const cancelFn = debouncedGetRedeemOut(redeemValue, decimal)
    return () => {
      cancelFn()
    }
  }, [redeemValue, decimal, debouncedGetRedeemOut])

  async function redeem() {
    if (
      receivingType === "underlying" &&
      (coinConfig?.provider === "Cetus" ||
        NO_SUPPORT_UNDERLYING_COINS.some(
          (item) => item.coinType === coinConfig?.coinType
        ))
    ) {
      throw new Error(
        `Underlying protocol error, try to withdraw to ${coinConfig.coinName}.`
      )
    }
    if (
      !insufficientPtBalance &&
      !insufficientYtBalance &&
      coinConfig &&
      coinConfig.coinType &&
      address &&
      redeemValue
    ) {
      try {
        setIsRedeeming(true)
        const tx = new Transaction()

        const { pyPosition, created } = initPyPosition({
          tx,
          coinConfig,
          pyPositions: pyPositionData,
        })

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        const amount = new Decimal(redeemValue)
          .mul(new Decimal(10).pow(coinConfig.decimal))
          .toString()

        const syCoin = redeemPy(
          tx,
          coinConfig,
          amount,
          amount,
          priceVoucher,
          pyPosition
        )

        const yieldToken = redeemSyCoin(tx, coinConfig, syCoin)

        if (receivingType === "underlying") {
          const underlyingCoin = await burnSCoin({
            tx,
            address,
            coinConfig,
            amount: "0",
            vaultId: "0",
            slippage: "0",
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
            await Promise.all([refreshData(), refetchPtYtData()])
          },
        })

        setRedeemValue("")
      } catch (errorMsg) {
        const { error } = parseErrorMessage(
          (errorMsg as ContractError)?.message ?? errorMsg
        )
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

  const coinName = useMemo(
    () =>
      receivingType === "underlying"
        ? coinConfig?.underlyingCoinName
        : coinConfig?.coinName,
    [receivingType, coinConfig]
  )

  const coinLogo = useMemo(
    () =>
      receivingType === "underlying"
        ? coinConfig?.underlyingCoinLogo
        : coinConfig?.coinLogo,
    [receivingType, coinConfig]
  )

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "0") // Switch to mint mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col items-center gap-y-6">
      <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
        <AmountInput
          decimal={decimal}
          amount={redeemValue}
          setWarning={() => {}}
          coinBalance={ptBalance}
          disabled={!isConnected}
          isConnected={isConnected}
          price={ptYtData?.ptPrice}
          onChange={setRedeemValue}
          logo={coinConfig.ptTokenLogo}
          maturity={coinConfig.maturity}
          name={`PT ${coinConfig.coinName}`}
          className="bg-transparent rounded-none"
          title={"Principle Token".toUpperCase()}
        />
        <div className="px-4">
          <div className="border-t border-light-gray/10" />
        </div>
        <AmountInput
          decimal={decimal}
          amount={redeemValue}
          setWarning={() => {}}
          coinBalance={ytBalance}
          disabled={!isConnected}
          isConnected={isConnected}
          onChange={setRedeemValue}
          price={ptYtData?.ytPrice}
          logo={coinConfig.ytTokenLogo}
          maturity={coinConfig.maturity}
          name={`YT ${coinConfig.coinName}`}
          title={"Yield Token".toUpperCase()}
          className="bg-transparent rounded-none"
        />
      </div>
      <div
        className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors"
        onClick={handleModeSwitch}
      >
        <ArrowUpDown className="w-5 h-5" />
      </div>
      <AmountOutput
        name={coinName}
        amount={outputValue}
        balance={coinBalance}
        loading={isInputLoading}
        title={"Underlying asset".toUpperCase()}
        logo={
          receivingType === "underlying"
            ? coinConfig.underlyingCoinLogo
            : coinConfig.coinLogo
        }
        price={
          receivingType === "underlying"
            ? coinConfig.underlyingPrice
            : coinConfig.coinPrice
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
              setRedeemValue("")
              setReceivingType(value as "underlying" | "sy")
            }}
          />
        }
      />
      <ActionButton
        btnText={
          insufficientPtBalance
            ? "Insufficient PT Balance"
            : insufficientYtBalance
            ? "Insufficient YT Balance"
            : "Redeem"
        }
        type="red"
        onClick={redeem}
        loading={isRedeeming}
        disabled={
          redeemValue === "" || insufficientPtBalance || insufficientYtBalance
        }
      />
      <GuideModal />
    </div>
  )
}
