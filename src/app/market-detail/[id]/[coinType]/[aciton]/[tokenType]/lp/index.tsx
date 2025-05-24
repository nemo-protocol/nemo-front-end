"use client"

import { useEffect, useMemo, useState } from "react"
import AssetHeader from "../components/AssetHeader"
import StatCard from "../components/StatCard"
import YieldChart from "../components/YieldChart"
import { CoinConfig } from "@/queries/types/market"
import Tabs from "../components/Tabs"
import AmountInput from "../components/AmountInput"
import { ChevronsDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import ActionButton from "../components/ActionButton"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useParams, useRouter } from "next/navigation"
import { formatDecimalValue, isValidAmount } from "@/lib/utils"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useMarketStateData from "@/hooks/useMarketStateData"
import { useAddLiquidityRatio } from "@/hooks/actions/useAddLiquidityRatio"
import { useCalculateLpAmount } from "@/hooks/dryRun/lp/useCalculateLpDryRun"
import { useAddLiquiditySingleSy } from "@/hooks/actions/useAddLiquiditySingleSy"
import { useMintLp } from "@/hooks/actions/useMintLp"
import { showTransactionDialog } from "@/lib/dialog"
import { network } from "@/config"
import { parseErrorMessage } from "@/lib/errorMapping"
import { Transaction } from "@mysten/sui/transactions"
import { initPyPosition, splitCoinHelper, depositSyCoin } from "@/lib/txHelper"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { mintSCoin } from "@/lib/txHelper/coin"
import { CETUS_VAULT_ID_LIST } from "@/lib/constants"
import useCoinData from "@/hooks/query/useCoinData"
import usePyPositionData from "@/hooks/usePyPositionData"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import { useRatioLoadingState } from "@/hooks/useRatioLoadingState"
import Decimal from "decimal.js"
import dayjs from "dayjs"
// import useQueryConversionRate from "@/hooks/query/useQueryConversionRate"
import { useQueryConversionRate } from "@nemoprotocol/contract-sdk"

interface Props {
  coinConfig: CoinConfig
}

export default function YTMarketDetail({ coinConfig }: Props) {
  const router = useRouter()
  const [warning, setWarning] = useState("")
  const [error, setError] = useState("")
  const [errorDetail, setErrorDetail] = useState("")
  const params = useParams()
  const coinType = params.coinType as string
  const maturity = params.maturity as string
  const [addValue, setAddValue] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [tokenType, setTokenType] = useState<number>(0)
  const [lpAmount, setLpAmount] = useState<string>()
  const [lpFeeAmount, setLpFeeAmount] = useState<string>()
  const [ytAmount, setYtAmount] = useState<string>()
  const [isAdding, setIsAdding] = useState(false)
  const { account: currentAccount, signAndExecuteTransaction } = useWallet()
  const [isCalculating, setIsCalculating] = useState(false)
  const [ratio, setRatio] = useState<string>()
  const [addType, setAddType] = useState<"mint" | "seed" | "add">()

  const address = useMemo(() => currentAccount?.address, [currentAccount])
  const isConnected = useMemo(() => !!address, [address])

  const { data: marketStateData, isLoading: isMarketStateDataLoading } =
    useMarketStateData(coinConfig?.marketStateId)

  const { data: conversionRate } = useQueryConversionRate(coinConfig)

  useEffect(() => {
    console.log("conversionRate", conversionRate)
  }, [conversionRate])

  const { mutateAsync: handleAddLiquiditySingleSy } =
    useAddLiquiditySingleSy(coinConfig)

  const { mutateAsync: handleMintLp } = useMintLp(coinConfig, marketStateData)

  const { data: pyPositionData } = usePyPositionData(
    address,
    coinConfig?.pyStateId,
    coinConfig?.maturity,
    coinConfig?.pyPositionTypeList
  )

  const { data: coinData, isLoading: isBalanceLoading } = useCoinData(
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

  const { data: ptYtData } = useCalculatePtYt(coinConfig, marketStateData)
  const [ptRatio, syRatio] = useMemo(() => {
    if (
      ptYtData?.ptTvl &&
      ptYtData?.syTvl &&
      !new Decimal(ptYtData.ptTvl).isZero() &&
      !new Decimal(ptYtData.syTvl).isZero()
    ) {
      const totalTvl = new Decimal(ptYtData.ptTvl).add(
        new Decimal(ptYtData.syTvl)
      )
      return [
        new Decimal(ptYtData.ptTvl).div(totalTvl).mul(100).toFixed(2),
        new Decimal(ptYtData.syTvl).div(totalTvl).mul(100).toFixed(2),
      ]
    }
    return ["0", "0"]
  }, [ptYtData])

  const { isLoading } = useInputLoadingState(addValue, isCalculating)

  const { isLoading: isRatioLoading } = useRatioLoadingState(isCalculating)

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

  const { mutateAsync: calculateRatio } = useAddLiquidityRatio(
    coinConfig,
    marketStateData
  )

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
    coinData: any[],
    coinType: string,
    pyPosition: any,
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
      coinType &&
      slippage &&
      lpAmount &&
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

        let pyPosition
        let created = false
        if (!pyPositionData?.length) {
          created = true
          pyPosition = initPyPosition(tx, coinConfig)
        } else {
          pyPosition = tx.object(pyPositionData[0].id)
        }

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
            coinType,
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
            coinType,
            coinData,
            addAmount,
            tokenType,
            pyPosition,
            coinConfig,
            minLpAmount,
            conversionRate,
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

  return (
    <div className="flex flex-col gap-6">
      {/* token 标题 */}
      <AssetHeader coinConfig={coinConfig} />

      {/* 主布局 */}
      <div className="mt-6 grid lg:grid-cols-4 gap-6">
        {/* 左侧  (span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 概览指标 */}
          <StatCard coinConfig={coinConfig} />

          <div className="bg-[rgba(252,252,252,0.03)] rounded-xl p-6">
            {/* Chart */}
            <YieldChart coinConfig={coinConfig} />
          </div>
        </div>

        {/* 右侧 Trade 面板 */}
        <div className="bg-[#101823] rounded-xl lg:col-span-2 p-6 flex flex-col gap-6">
          {/* Tab 切换 */}
          <Tabs
            title="Provide liquidity"
            desc="Provide liquidity to the market to earn fees and rewards."
            tabs={[
              { key: "mint", label: "MINT & SUPPLY" },
              { key: "pt", label: "MINT & SUPPLY" },
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
            amount={addValue}
            coinName={coinName}
            coinLogo={coinLogo}
            isLoading={isLoading}
            coinBalance={coinBalance}
            isConnected={isConnected}
            warning={warning}
            errorDetail={errorDetail}
            setWarning={setWarning}
            onChange={(value) => {
              setAddValue(value)
            }}
          />

          {/* swap icon */}
          <div className="self-center bg-[#192130] rounded-full p-3">
            <ChevronsDown className="w-5 h-5" />
          </div>

          {/* 输出框 */}
          <div className="bg-[#0f1624] rounded-xl p-4 flex justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Receive</p>
              <p className="text-2xl">
                {!addValue ? (
                  "--"
                ) : isCalculating ? (
                  <Skeleton className="h-6 w-36 bg-[#2D2D48]" />
                ) : !decimal ? (
                  "--"
                ) : (
                  `≈ ${formatDecimalValue(lpAmount, decimal)} LP ${
                    coinConfig?.coinName
                  }`
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg">YT {coinConfig?.coinName}</p>
              <p className="text-xs text-slate-500">
                {dayjs(Number(coinConfig?.maturity ?? 0)).format("MMM DD YYYY")}
              </p>
            </div>
          </div>

          {/* 详情行 */}
          <div className="text-sm text-slate-400 flex flex-col gap-2 pt-4 border-t border-slate-800">
            <p className="flex justify-between">
              <span>Yield APY Change</span>
              <span className="text-white">
                {ptYtData?.poolApy
                  ? `${Number(ptYtData.poolApy).toFixed(6)}%`
                  : "--"}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Price</span>
              <span className="text-white">
                {ratio
                  ? `1 ${coinName} = ${ratio} LP ${coinConfig?.coinName}`
                  : "--"}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Trading Fees</span>
              <span className="text-white">{lpFeeAmount || "-"}</span>
            </p>
            <p className="flex justify-between">
              <span>Slippage</span>
              <span className="text-white">{slippage}%</span>
            </p>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-4 pt-4">
            <ActionButton
              onClick={add}
              btnText={btnText}
              disabled={btnDisabled}
              loading={isAdding || isCalculating}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
