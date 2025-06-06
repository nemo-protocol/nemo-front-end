import Decimal from "decimal.js"
import { network } from "@/config"
import { useMemo, useState, useCallback, useEffect } from "react"
import useCoinData from "@/hooks/query/useCoinData"
import { Transaction } from "@mysten/sui/transactions"
import { ArrowUpDown } from "lucide-react"
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
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import { CETUS_VAULT_ID_LIST } from "@/lib/constants"
import SlippageSetting from "../../components/SlippageSetting"

interface Props {
  coinConfig: CoinConfig
}

export default function Mint({ coinConfig }: Props) {
  const [isMinting, setIsMinting] = useState(false)
  const [tokenType, setTokenType] = useState<number>(0)
  const [slippage, setSlippage] = useState("0.5")

  const { address, signAndExecuteTransaction } = useWallet()

  const isConnected = useMemo(() => !!address, [address])
  const [mintValue, setMintValue] = useState("")

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList
    )

  const decimal = useMemo(() => Number(coinConfig?.decimal) || 0, [coinConfig])

  const { data: coinData, refetch: refetchCoinData } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinConfig.id
  )

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
    [coinBalance, mintValue]
  )

  const refreshData = useCallback(async () => {
    await Promise.all([refetchPyPosition(), refetchCoinData()])
  }, [refetchPyPosition, refetchCoinData])

  const { mutateAsync: mintDryRun } = useMintPYDryRun(coinConfig)

  const [ptAmount, setPtAmount] = useState("")
  const [ytAmount, setYtAmount] = useState("")

  const [isInputLoading, setIsInputLoading] = useState(false)

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
            (item) => item.coinType === coinConfig?.coinType
          )?.vaultId
        : "",
    [coinConfig]
  )

  const debouncedGetPyOut = useCallback(
    (value: string, decimal: number) => {
      const getPyOut = debounce(async () => {
        if (value && value !== "0" && decimal && coinData?.length) {
          setIsInputLoading(true)
          try {
            const [result] = await mintDryRun({
              vaultId,
              slippage,
              coinData,
              tokenType,
              mintValue: value,
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
    [coinData, mintDryRun, pyPositionData]
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
        const [splitCoin] = splitCoinHelper(
          tx,
          coinData,
          [amount],
          tokenType === 0 ? coinConfig.underlyingCoinType : coinConfig.id
        )

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
          (errorMsg as ContractError)?.message ?? errorMsg
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
    <div className="flex flex-col items-center gap-y-6">
      <AmountInput
        amount={mintValue}
        title={"Underlying asset".toUpperCase()}
        onChange={setMintValue}
        setWarning={() => {}}
        coinName={coinName}
        coinLogo={coinLogo}
        decimal={decimal}
        coinBalance={coinBalance}
        isConnected={isConnected}
        price={price}
        disabled={!isConnected}
        coinNameComponent={
          <Select
            value={tokenType.toString()}
            onValueChange={(value) => {
              setMintValue("")
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

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ArrowUpDown className="w-5 h-5" />
      </div>

      <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
        <AmountOutput
          title={"Principle Token".toUpperCase()}
          className="bg-transparent rounded-none"
          name={`PT ${coinConfig.coinName}`}
          value={
            isInputLoading
              ? undefined
              : ptAmount &&
                new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)
          }
          loading={isInputLoading}
          maturity={coinConfig.maturity}
          coinConfig={coinConfig}
        />
        <div className="px-4">
          <div className="border-t border-light-gray/10" />
        </div>
        <AmountOutput
          title={"Yield Token".toUpperCase()}
          className="bg-transparent rounded-none"
          name={`YT ${coinConfig.coinName}`}
          value={
            isInputLoading
              ? undefined
              : ytAmount &&
                new Decimal(ytAmount).div(10 ** decimal).toFixed(decimal)
          }
          loading={isInputLoading}
          maturity={coinConfig.maturity}
          coinConfig={coinConfig}
        />
      </div>
      <div className="flex justify-between w-full">
        <span className="text-light-gray/40">Slippage</span>
        <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
      </div>

      <ActionButton
        btnText="Mint"
        onClick={mint}
        loading={isMinting}
        disabled={mintValue === ""}
      />
    </div>
  )
}
