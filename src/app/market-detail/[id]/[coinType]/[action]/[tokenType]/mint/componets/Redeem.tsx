import Decimal from "decimal.js"
import { network } from "@/config"
import { useMemo, useState, useCallback, useEffect } from "react"
import { Transaction } from "@mysten/sui/transactions"
import usePyPositionData from "@/hooks/usePyPositionData"
import { ArrowUpDown } from "lucide-react"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import { parseErrorMessage } from "@/lib/errorMapping"
import { redeemPy, redeemSyCoin } from "@/lib/txHelper"
import { useWallet } from "@nemoprotocol/wallet-kit"
import useRedeemPYDryRun from "@/hooks/dryRun/useRedeemPYDryRun"
import { debounce, formatDecimalValue } from "@/lib/utils"
import useMarketStateData from "@/hooks/useMarketStateData"
import { ContractError } from "@/hooks/types"
import { showTransactionDialog } from "@/lib/dialog"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { CoinConfig } from "@/queries/types/market"
import AmountInput from "../../components/AmountInput"
import { AmountOutput } from "../../components/AmountOutput"
import ActionButton from "../../components/ActionButton"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import { initPyPosition } from "@/lib/txHelper/position"

interface Props {
  coinConfig: CoinConfig
}

export default function Redeem({ coinConfig }: Props) {
  const [redeemValue, setRedeemValue] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isInputLoading, setIsInputLoading] = useState(false)
  const [syValue, setSyValue] = useState("")
  const [tokenType, setTokenType] = useState<number>(0)

  const { address, signAndExecuteTransaction } = useWallet()
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

            const { syValue } = await redeemDryRun({
              ptAmount: amount,
              ytAmount: amount,
              pyPositions: pyPositionData,
            })
            setSyValue(syValue)
          } catch (error) {
            console.error("Dry run error:", error)
            setSyValue("")
          } finally {
            setIsInputLoading(false)
          }
        } else {
          setSyValue("")
        }
      }, 500)

      getRedeemOut()
      return getRedeemOut.cancel
    },
    [redeemDryRun, pyPositionData]
  )

  useEffect(() => {
    const cancelFn = debouncedGetRedeemOut(redeemValue, decimal)
    return () => {
      cancelFn()
    }
  }, [redeemValue, decimal, debouncedGetRedeemOut])

  async function redeem() {
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

        tx.transferObjects([yieldToken], address)

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
      tokenType === 0 ? coinConfig?.underlyingCoinName : coinConfig?.coinName,
    [tokenType, coinConfig]
  )

  return (
    <div className="flex flex-col items-center gap-y-6">
      <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
        <AmountInput
          title={"Principle Token".toUpperCase()}
          className="bg-transparent rounded-none"
          amount={redeemValue}
          onChange={setRedeemValue}
          setWarning={() => {}}
          coinName={`PT ${coinConfig.coinName}`}
          coinLogo={coinConfig.coinLogo}
          decimal={decimal}
          coinBalance={ptBalance}
          isConnected={isConnected}
          price={ptYtData?.ptPrice}
          disabled={!isConnected}
        />
        <div className="px-4">
          <div className="border-t border-light-gray/10" />
        </div>
        <AmountInput
          title={"Yield Token".toUpperCase()}
          className="bg-transparent rounded-none"
          amount={redeemValue}
          onChange={setRedeemValue}
          setWarning={() => {}}
          coinName={`YT ${coinConfig.coinName}`}
          coinLogo={coinConfig.coinLogo}
          decimal={decimal}
          coinBalance={ytBalance}
          isConnected={isConnected}
          price={ptYtData?.ytPrice}
          disabled={!isConnected}
        />
      </div>
      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ArrowUpDown className="w-5 h-5" />
      </div>
      <AmountOutput
        name={coinName}
        title={"Underlying asset".toUpperCase()}
        value={isInputLoading ? undefined : syValue}
        loading={isInputLoading}
        maturity={coinConfig.maturity}
        coinConfig={coinConfig}
        coinNameComponent={
          <Select
            value={tokenType.toString()}
            onValueChange={(value) => {
              setRedeemValue("")
              setTokenType(Number(value))
            }}
          >
            <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-sm sm:text-base w-fit">
              <SelectValue placeholder="Select token type" />
            </SelectTrigger>
            <SelectContent className="border-none outline-none bg-[#0E0F16]">
              <SelectGroup>
                <SelectItem value={"0"} className="cursor-pointer text-white">
                  {coinConfig?.underlyingCoinName}
                </SelectItem>
                <SelectItem value={"1"} className="cursor-pointer text-white">
                  {coinConfig?.coinName}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />
      <div className="mt-7.5 w-full">
        <ActionButton
          btnText={
            insufficientPtBalance
              ? "Insufficient PT Balance"
              : insufficientYtBalance
              ? "Insufficient YT Balance"
              : "Redeem"
          }
          onClick={redeem}
          loading={isRedeeming}
          disabled={
            redeemValue === "" || insufficientPtBalance || insufficientYtBalance
          }
        />
      </div>
    </div>
  )
}
