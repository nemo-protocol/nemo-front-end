import Decimal from "decimal.js"
import { network } from "@/config"
import { useMemo, useState, useCallback, useEffect } from "react"
import useCoinData from "@/hooks/query/useCoinData"
import { Transaction } from "@mysten/sui/transactions"
import { ChevronsDown, Plus } from "lucide-react"
import usePyPositionData from "@/hooks/usePyPositionData"
import { parseErrorMessage } from "@/lib/errorMapping"
import {
  initPyPosition,
  mintPY,
  splitCoinHelper,
  depositSyCoin,
} from "@/lib/txHelper"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { showTransactionDialog } from "@/lib/dialog"
import useMintPYDryRun from "@/hooks/dryRun/useMintPYDryRun"
import { debounce } from "@/lib/utils"
import { ContractError } from "@/hooks/types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { CoinConfig } from "@/queries/types/market"
import AmountInput from "../../components/AmountInput"
import { AmountOutput } from "../../components/AmountOutput"
import ActionButton from "../../components/ActionButton"

interface Props {
  coinConfig: CoinConfig
}

export default function Mint({ coinConfig }: Props) {
  const [isMinting, setIsMinting] = useState(false)

  const { address, signAndExecuteTransaction } = useWallet()

  const isConnected = useMemo(() => !!address, [address])
  const [mintValue, setMintValue] = useState("")

  const { data: pyPositionData, refetch: refetchPyPosition } = usePyPositionData(
    address,
    coinConfig?.pyStateId,
    coinConfig?.maturity,
    coinConfig?.pyPositionTypeList,
  )

  const decimal = useMemo(() => Number(coinConfig?.decimal) || 0, [coinConfig])

  const { data: coinData, refetch: refetchCoinData } = useCoinData(
    address,
    coinConfig.id,
  )
  const coinBalance = useMemo(() => {
    if (coinData?.length) {
      return coinData
        .reduce((total, coin) => total.add(coin.balance), new Decimal(0))
        .div(10 ** decimal)
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const insufficientBalance = useMemo(
    () => new Decimal(coinBalance).lt(mintValue || 0),
    [coinBalance, mintValue],
  )

  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchPyPosition(),
      refetchCoinData(),
    ])
  }, [refetchPyPosition, refetchCoinData])

  const { mutateAsync: mintDryRun } = useMintPYDryRun(coinConfig)

  const [ptAmount, setPtAmount] = useState("")
  const [ytAmount, setYtAmount] = useState("")

  const [isInputLoading, setIsInputLoading] = useState(false)

  const debouncedGetPyOut = useCallback(
    (value: string, decimal: number) => {
      const getPyOut = debounce(async () => {
        if (value && value !== "0" && decimal && coinData?.length) {
          setIsInputLoading(true)
          try {
            const [result] = await mintDryRun({
              mintValue: value,
              coinData,
              pyPositions: pyPositionData,
            })
            setPtAmount(result.ptAmount)
            setYtAmount(result.ytAmount)
          } catch (error) {
            console.error("Dry run error:", error)
            setPtAmount("")
            setYtAmount("")
          } finally {
            setIsInputLoading(false)
          }
        } else {
          setPtAmount("")
          setYtAmount("")
        }
      }, 500)

      getPyOut()
      return getPyOut.cancel
    },
    [coinData, mintDryRun, pyPositionData],
  )

  useEffect(() => {
    const cancelFn = debouncedGetPyOut(mintValue, decimal)
    return () => {
      cancelFn()
    }
  }, [mintValue, decimal, debouncedGetPyOut])

  async function mint() {
    if (
      !insufficientBalance &&
      coinConfig &&
      coinConfig.id &&
      coinData?.length &&
      address
    ) {
      try {
        setIsMinting(true)
        const tx = new Transaction()

        let pyPosition
        let created = false
        if (!pyPositionData?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositionData[0].id)
        }

        const amount = new Decimal(mintValue).mul(10 ** decimal).toString()
        const [splitCoin] = splitCoinHelper(tx, coinData, [amount], coinConfig.id)

        const syCoin = depositSyCoin(tx, coinConfig, splitCoin, coinConfig.id)

        const [priceVoucher] = getPriceVoucher(tx, coinConfig)

        mintPY(tx, coinConfig, syCoin, priceVoucher, pyPosition)

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

        setMintValue("")
      } catch (errorMsg) {
        const { error } = parseErrorMessage(
          (errorMsg as ContractError)?.message ?? errorMsg,
        )
        showTransactionDialog({
          status: "Failed",
          network,
          txId: "",
          message: error,
        })
      } finally {
        setIsMinting(false)
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* TODO: Add animation */}
      <div className="flex flex-col w-full">
        <AmountInput
          amount={mintValue}
          onChange={setMintValue}
          setWarning={() => {}}
          coinName={coinConfig.coinName}
          coinLogo={coinConfig.coinLogo}
          decimal={decimal}
          coinBalance={coinBalance}
          isConnected={isConnected}
          price={coinConfig.underlyingPrice}
          disabled={!isConnected}
        />
      </div>
      <ChevronsDown className="mx-auto my-2" />
      <div className="flex flex-col w-full gap-y-4.5">
        <AmountOutput
          name={`PT ${coinConfig.coinName}`}
          value={isInputLoading ? undefined : ptAmount && new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)}
          loading={isInputLoading}
          maturity={coinConfig.maturity}
          coinConfig={coinConfig}
        />
      </div>
      <Plus className="mx-auto my-2" />
      <AmountOutput
        name={`YT ${coinConfig.coinName}`}
        value={isInputLoading ? undefined : ytAmount && new Decimal(ytAmount).div(10 ** decimal).toFixed(decimal)}
        loading={isInputLoading}
        maturity={coinConfig.maturity}
        coinConfig={coinConfig}
      />
      <div className="mt-7.5 w-full">
        <ActionButton
          btnText="Mint"
          onClick={mint}
          loading={isMinting}
          disabled={mintValue === ""}
        />
      </div>
    </div>
  )
}
