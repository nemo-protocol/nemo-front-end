import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useSearchParams, useRouter } from "next/navigation"
import { debounce, isValidAmount, formatDecimalValue } from "@/lib/utils"
import { CoinConfig } from "@/queries/types/market"
import { CoinData } from "@/types"
import AmountInput from "../../components/AmountInput"
import { AmountOutput } from "../../components/AmountOutput"
import ActionButton from "../../components/ActionButton"
import SlippageSetting from "../../components/SlippageSetting"
import useMarketStateData from "@/hooks/useMarketStateData"
import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import useQueryConversionRate from "@/hooks/query/useQueryConversionRate"
import { useCalculateLpAmount } from "@/hooks/dryRun/lp/useCalculateLpDryRun"
import { useAddLiquiditySingleSy } from "@/hooks/actions/useAddLiquiditySingleSy"
import { useMintLp } from "@/hooks/actions/useMintLp"
import { showTransactionDialog } from "@/lib/dialog"
import { network } from "@/config"
import { parseErrorMessage } from "@/lib/errorMapping"
import { Transaction, TransactionArgument } from "@mysten/sui/transactions"
import { splitCoinHelper, depositSyCoin } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { mintSCoin } from "@/lib/txHelper/coin"
import { CETUS_VAULT_ID_LIST } from "@/lib/constants"
import { initPyPosition } from "@/lib/txHelper/position"
import Decimal from "decimal.js"
import { TokenTypeSelect } from "../../components/TokenTypeSelect"
import useLpMarketPositionData from "@/hooks/useLpMarketPositionData"
import Image from "next/image"
import SwapSupplyGuideModal from "./SwapSupplyGuideModal"
import MintSupplyGuideModal from "./MintSupplyGuideModal"

interface Props {
  coinConfig: CoinConfig
}

export default function AddLiquidity({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [error, setError] = useState<string>()
  const [ratio, setRatio] = useState<string>()
  const [addValue, setAddValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isAdding, setIsAdding] = useState(false)
  const [ytValue, setYtValue] = useState<string>()
  const [lpValue, setLpValue] = useState<string>()
  const [tokenType, setTokenType] = useState<number>(0)
  const [lpFeeAmount, setLpFeeAmount] = useState<string>()
  const [errorDetail, setErrorDetail] = useState<string>()
  const [isCalculating, setIsCalculating] = useState(false)
  const [action, setAction] = useState<"swap" | "mint">("swap")
  const [addType, setAddType] = useState<"mint" | "seed" | "add">()
  const { account: currentAccount, signAndExecuteTransaction } = useWallet()

  // 添加路由相关hooks
  const searchParams = useSearchParams()
  const router = useRouter()

  const { coinType, maturity } = coinConfig

  const decimal = Number(coinConfig.decimal || 0)

  const address = useMemo(() => currentAccount?.address, [currentAccount])
  const isConnected = useMemo(() => !!address, [address])

  const { data: marketStateData } = useMarketStateData(
    coinConfig?.marketStateId
  )

  const { data: conversionRate } = useQueryConversionRate(coinConfig)

  const { mutateAsync: handleAddLiquiditySingleSy } =
    useAddLiquiditySingleSy(coinConfig)

  const { mutateAsync: handleMintLp } = useMintLp(coinConfig, marketStateData)

  const { data: pyPositionData } = usePyPositionData(
    address,
    coinConfig?.pyStateId,
    coinConfig?.maturity,
    coinConfig?.pyPositionTypeList
  )

  const { data: lppMarketPositionData } = useLpMarketPositionData(
    address,
    coinConfig?.marketStateId,
    coinConfig?.maturity,
    coinConfig?.marketPositionTypeList
  )

  const lpBalance = useMemo(() => {
    if (lppMarketPositionData?.length) {
      return lppMarketPositionData
        .reduce((total, item) => total.add(item.lp_amount), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [lppMarketPositionData])

  const ytBalance = useMemo(() => {
    if (pyPositionData?.length) {
      return pyPositionData
        .reduce((total, item) => total.add(item.ytBalance), new Decimal(0))
        .div(new Decimal(10).pow(decimal))
        .toFixed(decimal)
    }
    return "0"
  }, [pyPositionData])

  const { data: coinData } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinType
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
    () => new Decimal(coinBalance).lt(new Decimal(addValue || 0)),
    [coinBalance, addValue]
  )

  const { isLoading } = useInputLoadingState(addValue, isCalculating)

  const btnDisabled = useMemo(() => {
    return (
      !isValidAmount(addValue) ||
      insufficientBalance ||
      isCalculating ||
      !!error
    )
  }, [addValue, error, insufficientBalance, isCalculating])

  const btnText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient ${coinName} balance`
    }
    if (addValue === "") {
      return "Please enter an amount"
    }
    return "Add"
  }, [insufficientBalance, addValue, coinName])

  const { mutate: calculateLpAmount } = useCalculateLpAmount(
    coinConfig,
    marketStateData
  )

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
          (item) => item.coinType === coinConfig?.coinType
        )?.vaultId
        : "",
    [coinConfig]
  )

  const handleActionChange = (newAction: "swap" | "mint") => {
    setAction(newAction)
    setAddValue("")
    setLpValue("")
    setYtValue("")
    setError("")
    setWarning("")
    setErrorDetail("")

    // 更新URL参数 - 使用数字0对应swap，1对应mint
    const params = new URLSearchParams(searchParams.toString())
    params.set("action", newAction === "swap" ? "0" : "1")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // 初始化时从URL读取action参数
  useEffect(() => {
    const urlAction = searchParams.get("action")
    if (urlAction === "0") {
      setAction("swap")
    } else if (urlAction === "1") {
      setAction("mint")
    }
  }, [searchParams])

  const handleModeSwitch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "1") // Switch to remove mode
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  async function handleSeedLiquidity(
    tx: Transaction,
    addAmount: string,
    tokenType: number,
    coinConfig: CoinConfig,
    coinData: CoinData[],
    coinType: string,
    pyPosition: TransactionArgument,
    address: string,
    minLpAmount: string
  ): Promise<void> {
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
            amount: addAmount,
          }),
        ]
        : splitCoinHelper(tx, coinData, [addAmount], coinType)

    const syCoin = depositSyCoin(tx, coinConfig, splitCoin, coinType)
    const [priceVoucher] = getPriceVoucher(tx, coinConfig)

    const seedLiquidityMoveCall = {
      target: `${coinConfig.nemoContractId}::market::seed_liquidity`,
      arguments: [
        coinConfig.version,
        syCoin,
        minLpAmount,
        priceVoucher,
        pyPosition,
        coinConfig.pyStateId,
        coinConfig.yieldFactoryConfigId,
        coinConfig.marketStateId,
        "0x6",
      ],
      typeArguments: [coinConfig.syCoinType],
    }

    const [lp] = tx.moveCall({
      ...seedLiquidityMoveCall,
      arguments: [
        tx.object(coinConfig.version),
        syCoin,
        tx.pure.u64(minLpAmount),
        priceVoucher,
        pyPosition,
        tx.object(coinConfig.pyStateId),
        tx.object(coinConfig.yieldFactoryConfigId),
        tx.object(coinConfig.marketStateId),
        tx.object("0x6"),
      ],
    })

    tx.transferObjects([lp], tx.pure.address(address))
  }

  async function add() {
    if (
      decimal &&
      addType &&
      address &&
      slippage &&
      lpValue &&
      coinType &&
      coinConfig &&
      conversionRate &&
      marketStateData &&
      coinData?.length &&
      !insufficientBalance
    ) {
      try {
        setIsAdding(true)
        const addAmount = new Decimal(addValue).mul(10 ** decimal).toFixed(0)
        const tx = new Transaction()

        const { pyPosition, created } = initPyPosition({
          tx,
          coinConfig,
          pyPositions: pyPositionData,
        })

        const minLpAmount = new Decimal(lpValue)
          .mul(10 ** decimal)
          .mul(1 - new Decimal(slippage).div(100).toNumber())
          .toFixed(0)

        if (marketStateData.lpSupply === "0") {
          await handleSeedLiquidity(
            tx,
            addAmount,
            tokenType,
            coinConfig,
            coinData,
            coinConfig.coinType,
            pyPosition,
            address,
            minLpAmount
          )
        } else if (action === "mint") {
          await handleMintLp({
            tx,
            vaultId,
            address,
            slippage,
            coinData,
            addAmount,
            tokenType,
            coinConfig,
            pyPosition,
            minLpAmount,
          })
        } else if (action === "swap") {
          await handleAddLiquiditySingleSy({
            tx,
            address,
            vaultId,
            slippage,
            coinData,
            addAmount,
            tokenType,
            pyPosition,
            coinConfig,
            minLpAmount,
            conversionRate,
            coinType: coinConfig.coinType,
          })
        }

        if (created) {
          tx.transferObjects([pyPosition], tx.pure.address(address))
        }

        const res = await signAndExecuteTransaction({
          transaction: tx,
        })

        showTransactionDialog({
          network,
          status: "Success",
          txId: res.digest,
          onClose: async () => {
            // Refresh data after transaction
          },
        })

        setAddValue("")
      } catch (errorMsg) {
        const { error: msg, detail } = parseErrorMessage(
          (errorMsg as Error)?.message ?? ""
        )
        setErrorDetail(detail)
        showTransactionDialog({
          status: "Failed",
          network,
          txId: "",
          message: msg,
        })
      } finally {
        setIsAdding(false)
      }
    }
  }

  useEffect(() => {
    const getLpPosition = debounce(async () => {
      setError("")
      if (
        decimal &&
        coinConfig &&
        pyPositionData &&
        marketStateData &&
        coinData?.length &&
        isValidAmount(addValue)
      ) {
        setIsCalculating(true)
        const inputAmount = new Decimal(addValue).mul(10 ** decimal).toString()
        try {
          calculateLpAmount(
            {
              action,
              vaultId,
              decimal,
              slippage,
              coinData,
              tokenType,
              inputAmount,
              pyPositionData,
            },
            {
              onSuccess: (result) => {
                console.log("result", result)
                setRatio(result.ratio)
                setError(result.error)
                setAddType(result.addType)
                setLpValue(result.lpValue)
                setLpFeeAmount(result.lpFeeAmount)
                setErrorDetail(result.errorDetail)
                if (result.ytValue) {
                  setYtValue(result.ytValue)
                }
              },
              onSettled: () => {
                setIsCalculating(false)
              },
            }
          )
        } catch (error) {
          setIsCalculating(false)
        }
      } else {
        setLpValue(undefined)
      }
    }, 500)

    getLpPosition()
    return () => {
      getLpPosition.cancel()
    }
  }, [
    vaultId,
    decimal,
    slippage,
    coinData,
    addValue,
    tokenType,
    coinConfig,
    pyPositionData,
    marketStateData,
    calculateLpAmount,
  ])

  useEffect(() => {
    if (marketStateData?.lpSupply === "0") {
      setAction("mint")
      // 更新URL参数
      const params = new URLSearchParams(searchParams.toString())
      params.set("action", "1")
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [marketStateData?.lpSupply, searchParams, router])

  return (
    <div className="flex flex-col items-center gap-y-6">
      {/* 二级Tab */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => handleActionChange("swap")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${action === "swap"
            ? "bg-white/10 text-white"
            : "bg-transparent text-white/40 hover:text-white/80"
            }`}
        >
          {`SWAP & SUPPLY`.toLocaleUpperCase()}
        </button>
        <button
          disabled={marketStateData?.lpSupply === "0"}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${action === "mint"
            ? "bg-white/10 text-white"
            : "bg-transparent text-white/40 hover:text-white/80"
            }  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-white/40`}
          onClick={() => handleActionChange("mint")}
        >
          {`MINT & SUPPLY`.toLocaleUpperCase()}
        </button>
      </div>

      <AmountInput
        error={error}
        price={price}
        decimal={decimal}
        warning={warning}
        amount={addValue}
        name={coinName}
        logo={coinLogo}
        isLoading={isLoading}
        setWarning={setWarning}
        coinBalance={coinBalance}
        isConnected={isConnected}
        errorDetail={errorDetail}
        title={"Provide Liquidity".toUpperCase()}
        onChange={(value) => {
          setAddValue(value)
        }}
        coinNameComponent={
          <TokenTypeSelect<number>
            value={tokenType}
            options={[
              {
                label: coinConfig.underlyingCoinName,
                logo: coinConfig.underlyingCoinLogo,
                value: 0,
              },
              {
                label: coinConfig.coinName,
                logo: coinConfig.coinLogo,
                value: 1,
              },
            ]}
            onChange={(value) => {
              setAddValue("")
              setTokenType(value)
            }}
          />
        }
      />

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10 cursor-pointer hover:bg-[#FCFCFC]/[0.06] transition-colors" onClick={handleModeSwitch}>
        <ArrowUpDown className="w-5 h-5" />
      </div>

      {action === "swap" ? (
        <AmountOutput
          balance={lpBalance}
          loading={isCalculating}
          price={coinConfig.lpPrice}
          logo={coinConfig.lpTokenLogo}
          maturity={coinConfig.maturity}
          unit={`LP ${coinConfig.coinName}`}
          name={`LP ${coinConfig.coinName}`}
          title={"LP Position".toUpperCase()}
          amount={
            !lpValue || !decimal ? "" : formatDecimalValue(lpValue, decimal)
          }
        />
      ) : (
        <div className="w-full bg-[#FCFCFC]/[0.03] rounded-2xl">
          <AmountOutput
            balance={ytBalance}
            loading={isCalculating}
            price={coinConfig.ytPrice}
            logo={coinConfig.ytTokenLogo}
            maturity={coinConfig.maturity}
            unit={`YT ${coinConfig.coinName}`}
            name={`YT ${coinConfig.coinName}`}
            title={"YT POSITION".toUpperCase()}
            className="bg-transparent rounded-none"
            amount={
              !ytValue || !decimal ? "" : formatDecimalValue(ytValue, decimal)
            }
          />
          <div className="px-4">
            <div className="border-t border-light-gray/10" />
          </div>
          <AmountOutput
            balance={lpBalance}
            loading={isCalculating}
            price={coinConfig.lpPrice}
            logo={coinConfig.lpTokenLogo}
            maturity={coinConfig.maturity}
            name={`LP ${coinConfig.coinName}`}
            unit={`LP ${coinConfig.coinName}`}
            title={"LP Position".toUpperCase()}
            className="bg-transparent rounded-none"
            amount={
              !lpValue || !decimal ? "" : formatDecimalValue(lpValue, decimal)
            }
          />
        </div>
      )}

      <div className="w-full divide-y-1 space-y-2 divide-white/10 text-sm text-white/40">
        <p className="flex justify-between text-sm pb-2">
          <span>Pool APY Change</span>
          <span className="text-white">X% - Y%</span>
        </p>

        <div className="space-y-2">
          <p className="flex justify-between">
            <span>Price</span>
            <span className="text-white">
              {ratio
                ? `1 ${coinName} = ${formatDecimalValue(ratio, 4)} LP ${coinConfig?.coinName
                }`
                : "--"}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Trading Fees</span>
            <span className="text-white">{lpFeeAmount || "-"}</span>
          </p>
          <div className="flex justify-between">
            <span>Slippage</span>
            <SlippageSetting slippage={slippage} setSlippage={setSlippage} />
          </div>
        </div>
      </div>

      <ActionButton
        onClick={add}
        btnText={btnText}
        disabled={btnDisabled}
        loading={isAdding || isCalculating}
      />

      {action === "swap" ? <SwapSupplyGuideModal /> : <MintSupplyGuideModal />}
    </div>
  )
}
