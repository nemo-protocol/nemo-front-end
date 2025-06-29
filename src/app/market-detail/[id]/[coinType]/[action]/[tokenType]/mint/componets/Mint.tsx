import Decimal from "decimal.js"
import { network } from "@/config"
import { debounce } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { ContractError } from "@/hooks/types"
import { CoinConfig } from "@/queries/types/market"
import useCoinData from "@/hooks/query/useCoinData"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { showTransactionDialog } from "@/lib/dialog"
import { mintMultiSCoin } from "@/lib/txHelper/coin"
import AmountInput from "../../components/AmountInput"
import { parseErrorMessage } from "@/lib/errorMapping"
import { Transaction } from "@mysten/sui/transactions"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { initPyPosition } from "@/lib/txHelper/position"
import ActionButton from "../../components/ActionButton"
import usePyPositionData from "@/hooks/usePyPositionData"
import useMintPYDryRun from "@/hooks/dryRun/useMintPYDryRun"
import { AmountOutput } from "../../components/AmountOutput"
import SlippageSetting from "../../components/SlippageSetting"
import { useMemo, useState, useCallback, useEffect } from "react"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"
import { mintPY, splitCoinHelper, depositSyCoin } from "@/lib/txHelper"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"
import GuideModal from "./GuideModal"
import { useRouter, useSearchParams } from "next/navigation"

interface Props {
  coinConfig: CoinConfig
}

export default function Mint({ coinConfig }: Props) {
  const [isMinting, setIsMinting] = useState(false)
  const [tokenType, setTokenType] = useState<number>(0)
  const [slippage, setSlippage] = useState("0.5")
  
  const router = useRouter()
  const searchParams = useSearchParams()

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
    tokenType === 0 ? coinConfig.underlyingCoinType : coinConfig.coinType
  )

  const coinName = useMemo(
    () =>
      tokenType === 0 ? coinConfig.underlyingCoinName : coinConfig.coinName,
    [tokenType, coinConfig]
  )

  const coinLogo = useMemo(
    () =>
      tokenType === 0 ? coinConfig.underlyingCoinLogo : coinConfig.coinLogo,
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
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [coinData, decimal])

  const ptBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, item) => total.add(item.ptBalance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

  const ytBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, item) => total.add(item.ytBalance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData, decimal])

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
            const { ptAmount, ytAmount } = await mintDryRun({
              vaultId,
              slippage,
              coinData,
              tokenType,
              mintValue: value,
              pyPositions: pyPositionData,
            })

            setPtAmount(ptAmount)
            setYtAmount(ytAmount)
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

        const { pyPosition, created } = initPyPosition({
          tx,
          coinConfig,
          pyPositions: pyPositionData,
        })

        const limited =
          tokenType === 0
            ? NEED_MIN_VALUE_LIST.some(
                (item) =>
                  item.provider === coinConfig.provider ||
                  item.coinType === coinConfig.coinType
              )
            : false

        const amount = new Decimal(mintValue)
          .mul(new Decimal(10).pow(coinConfig.decimal))
          .toString()

        const [splitCoin, sCoin] =
          tokenType === 0
            ? await mintMultiSCoin({
                tx,
                amount,
                limited,
                vaultId,
                address,
                slippage,
                coinData,
                coinConfig,
                coinAmount: amount,
                splitAmounts: [amount],
              })
            : splitCoinHelper(tx, coinData, [amount], coinConfig.coinType)

        if (sCoin) {
          tx.transferObjects([sCoin], address)
        }

        const syCoin = depositSyCoin(
          tx,
          coinConfig,
          splitCoin,
          coinConfig.coinType
        )

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

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "1") // Switch to redeem mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col items-center gap-y-6">
      <AmountInput
        amount={mintValue}
        onChange={setMintValue}
        price={price}
        setWarning={() => {}}
        name={coinName}
        logo={coinLogo}
        decimal={decimal}
        coinBalance={coinBalance}
        isConnected={isConnected}
        title={"Underlying asset".toUpperCase()}
        disabled={!isConnected}
        coinNameComponent={
          <TokenTypeSelect
            value={tokenType}
            onChange={(value) => {
              setMintValue("")
              setTokenType(value)
            }}
            options={[
              {
                label: coinConfig?.underlyingCoinName || "",
                logo: coinConfig?.underlyingCoinLogo || "",
                value: 0,
              },
              {
                label: coinConfig?.coinName || "",
                logo: coinConfig?.coinLogo || "",
                value: 1,
              },
            ]}
          />
        }
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors" onClick={handleModeSwitch}>
        <ArrowUpDown className="w-5 h-5" />
      </div>

      <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
        <AmountOutput
          balance={ptBalance}
          loading={isInputLoading}
          price={coinConfig.ptPrice}
          logo={coinConfig.ptTokenLogo}
          maturity={coinConfig.maturity}
          name={`PT ${coinConfig.coinName}`}
          title={"Principal Token".toUpperCase()}
          className="bg-transparent rounded-none"
          amount={
            isInputLoading
              ? undefined
              : ptAmount &&
                new Decimal(ptAmount).div(10 ** decimal).toFixed(decimal)
          }
        />
        <div className="px-4">
          <div className="border-t border-light-gray/10" />
        </div>
        <AmountOutput
          balance={ytBalance}
          loading={isInputLoading}
          price={coinConfig.ytPrice}
          logo={coinConfig.ytTokenLogo}
          maturity={coinConfig.maturity}
          name={`YT ${coinConfig.coinName}`}
          title={"Yield Token".toUpperCase()}
          className="bg-transparent rounded-none"
          amount={
            isInputLoading
              ? undefined
              : ytAmount &&
                new Decimal(ytAmount).div(10 ** decimal).toFixed(decimal)
          }
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
        type="green"
      />

      <GuideModal />
    </div>
  )
}
