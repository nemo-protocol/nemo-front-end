"use client"

import { useEffect, useMemo, useState } from "react"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import Tabs from "../components/Tabs"
import AmountInput from "../components/AmountInput"
import { ChevronsDown } from "lucide-react"
import ActionButton from "../components/ActionButton"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { debounce, isValidAmount, formatDecimalValue } from "@/lib/utils"
import useMarketStateData from "@/hooks/useMarketStateData"
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
import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import Decimal from "decimal.js"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import SlippageSetting from "../components/SlippageSetting"
import { CoinData } from "@/types"
import { AmountOutput } from "../components/AmountOutput"
import useQueryConversionRate from "@/hooks/query/useQueryConversionRate"
import { initPyPosition } from "@/lib/txHelper/position"

interface Props {
  coinConfig: CoinConfig
}

export default function LPMarketDetail({ coinConfig }: Props) {
  const [warning, setWarning] = useState("")
  const [error, setError] = useState<string>()
  const [errorDetail, setErrorDetail] = useState<string>()
  const [addValue, setAddValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [tokenType, setTokenType] = useState<number>(0)
  const [lpAmount, setLpAmount] = useState<string>()
  const [lpFeeAmount, setLpFeeAmount] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
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

        //TODO: put tx in @nemoprotocol/contract-sdk
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
    <div className="flex flex-col gap-6">
      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <div className="bg-[#FCFCFC]/[0.03] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          {/* Tab 切换 */}
          <Tabs
            title="Provide liquidity"
            desc="Provide liquidity to the market to earn fees and rewards."
            tabs={[
              { key: "mint", label: "SWAP & SUPPLY" },
              { key: "swap", label: "MINT & SUPPLY", disabled: true },
            ]}
            onChange={(key) => {
              console.log("Selected tab:", key)
            }}
          />

          {/* 输入框 */}
          <AmountInput
            error={error}
            price={price}
            decimal={decimal}
            warning={warning}
            amount={addValue}
            coinName={coinName}
            coinLogo={coinLogo}
            isLoading={isLoading}
            setWarning={setWarning}
            coinBalance={coinBalance}
            isConnected={isConnected}
            errorDetail={errorDetail}
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
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent className="border-none outline-none bg-[#0E0F16]">
                  <SelectGroup>
                    <SelectItem
                      value={"0"}
                      className="cursor-pointer text-white"
                    >
                      {coinConfig?.underlyingCoinName}
                    </SelectItem>
                    <SelectItem
                      value={"1"}
                      className="cursor-pointer text-white"
                    >
                      {coinConfig?.coinName}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            }
          />

          {/* swap icon */}
          <div className="self-center bg-[#FCFCFC]/[0.03] rounded-full p-3 -my-10">
            <ChevronsDown className="w-5 h-5" />
          </div>

          {/* 输出框 */}
          <AmountOutput
            maturity={maturity}
            loading={isCalculating}
            coinConfig={coinConfig}
            name={`LP ${coinConfig.coinName}`}
            value={
              !addValue || !decimal
                ? "--"
                : formatDecimalValue(lpAmount, decimal)
            }
          />

          <div className="divide-y-1 space-y-2 divide-white/10 text-sm text-white/40">
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
                <SlippageSetting
                  slippage={slippage}
                  setSlippage={setSlippage}
                />
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
      </div>
    </div>
  )
}
