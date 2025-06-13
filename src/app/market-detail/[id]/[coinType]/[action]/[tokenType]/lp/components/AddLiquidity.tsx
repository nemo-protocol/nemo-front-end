import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { debounce, isValidAmount, formatDecimalValue } from "@/lib/utils"
import { CoinConfig } from "@/queries/types/market"
import { CoinData } from "@/types"
import AmountInput from "../../components/AmountInput"
import { AmountOutput } from "../../components/AmountOutput"
import ActionButton from "../../components/ActionButton"
import SlippageSetting from "../../components/SlippageSetting"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
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
import Image from "next/image"

interface Props {
  coinConfig: CoinConfig
}

export default function LpForm({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [error, setError] = useState<string>()
  const [errorDetail, setErrorDetail] = useState<string>()
  const [addValue, setAddValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [tokenType, setTokenType] = useState<number>(0)
  const [lpAmount, setLpAmount] = useState<string>()
  const [lpFeeAmount, setLpFeeAmount] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
  const [subTab, setSubTab] = useState("provide")
  const { account: currentAccount, signAndExecuteTransaction } = useWallet()
  const [isCalculating, setIsCalculating] = useState(false)
  const [ratio, setRatio] = useState<string>()
  const [addType, setAddType] = useState<"mint" | "seed" | "add">()

  const coinType = coinConfig.coinType
  const maturity = coinConfig.maturity

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

  const decimal = useMemo(() => Number(coinConfig?.decimal || 0), [coinConfig])

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
      lpAmount &&
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

        const minLpAmount = new Decimal(lpAmount)
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
        } else if (
          addType === "mint" ||
          new Decimal(marketStateData.totalSy).mul(0.4).lt(addAmount)
        ) {
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
        } else {
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
          status: "Success",
          network,
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
                setLpAmount(result.lpAmount)
                setLpFeeAmount(result.lpFeeAmount)
                setErrorDetail(result.errorDetail)
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
        setLpAmount(undefined)
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

  return (
    <div className="flex flex-col items-center gap-y-6">
      {/* 二级Tab */}
      <div className="flex gap-2 w-full">
        <button
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
            subTab === "provide"
              ? "bg-white/10 text-white"
              : "bg-transparent text-white/40 hover:text-white/80"
          }`}
          onClick={() => setSubTab("provide")}
        >
          PROVIDE LIQUIDITY
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
            subTab === "lp"
              ? "bg-white/10 text-white"
              : "bg-transparent text-white/40 hover:text-white/80"
          }`}
          onClick={() => setSubTab("lp")}
        >
          LP POSITION
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
          <Select
            value={tokenType.toString()}
            onValueChange={(value) => {
              setAddValue("")
              setTokenType(Number(value))
            }}
          >
            <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-sm sm:text-base w-fit">
              <SelectValue>
                <div className="flex items-center gap-x-1">
                  <span
                    className="max-w-20 truncate"
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
                    {coinConfig?.coinLogo && (
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

      <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
        <ArrowUpDown className="w-5 h-5" />
      </div>

      {/* subTab === "lp" 依然条件渲染 */}
      {subTab === "lp" && (
        <>{/* 这里可以放 LP POSITION 相关内容，暂时用 AmountOutput 占位 */}</>
      )}

      <AmountOutput
        maturity={maturity}
        loading={isCalculating}
        logo={coinConfig.lpTokenLogo}
        name={`LP ${coinConfig.coinName}`}
        title={"LP Position".toUpperCase()}
        value={
          !addValue || !decimal ? "--" : formatDecimalValue(lpAmount, decimal)
        }
      />

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
                ? `1 ${coinName} = ${formatDecimalValue(ratio, 4)} LP ${
                    coinConfig?.coinName
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
    </div>
  )
}
