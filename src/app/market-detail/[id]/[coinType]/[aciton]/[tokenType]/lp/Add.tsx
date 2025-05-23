import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useMemo, useState, useEffect, useCallback } from "react"
import useCoinData from "@/hooks/query/useCoinData"
import TradeInfo from "@/components/TradeInfo"
import PoolSelect from "@/components/PoolSelect"
import { ChevronsDown, Info } from "lucide-react"
import AmountInput from "@/components/AmountInput"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { network, debugLog } from "@/config"
import ActionButton from "@/components/ActionButton"
import { Transaction, TransactionArgument } from "@mysten/sui/transactions"
import { parseErrorMessage } from "@/lib/errorMapping"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useParams, useNavigate } from "react-router-dom"
import useInputLoadingState from "@/hooks/useInputLoadingState"
import usePyPositionData from "@/hooks/usePyPositionData"
import { useCoinConfig } from "@/queries"
import {
  formatDecimalValue,
  debounce,
  isValidAmount,
  formatLargeNumber,
} from "@/lib/utils"
import { useRatioLoadingState } from "@/hooks/useRatioLoadingState"
import { showTransactionDialog } from "@/lib/dialog"
import { CoinConfig } from "@/queries/types/market"
import useMarketStateData from "@/hooks/useMarketStateData"
import type { CoinData } from "@/types"
import { getPriceVoucher } from "@/lib/txHelper/price"
import { useCalculatePtYt } from "@/hooks/usePtYtRatio"
import useQueryConversionRate from "@/hooks/query/useQueryConversionRate"
import { useAddLiquidityRatio } from "@/hooks/actions/useAddLiquidityRatio"
import { useCalculateLpAmount } from "@/hooks/dryRun/lp/useCalculateLpDryRun"
import { useAddLiquiditySingleSy } from "@/hooks/actions/useAddLiquiditySingleSy"
import { useMintLp } from "@/hooks/actions/useMintLp"
import { initPyPosition, splitCoinHelper, depositSyCoin } from "@/lib/txHelper"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import { mintSCoin } from "@/lib/txHelper/coin"
import { CETUS_VAULT_ID_LIST } from "@/lib/constants"

export default function SingleCoin() {
  const navigate = useNavigate()
  const [warning, setWarning] = useState("")
  const [error, setError] = useState("")
  const [errorDetail, setErrorDetail] = useState("")
  const { coinType, maturity } = useParams()
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

  const {
    data: coinConfig,
    isLoading: isConfigLoading,
    refetch: refetchCoinConfig,
  } = useCoinConfig(coinType, maturity, address)

  const { data: conversionRate, error: conversionRateError } =
    useQueryConversionRate(coinConfig)

  useEffect(() => {
    if (conversionRateError) {
      setError(conversionRateError.message)
    }
  }, [conversionRateError])

  const { mutateAsync: handleAddLiquiditySingleSy } =
    useAddLiquiditySingleSy(coinConfig)

  const { data: marketStateData, isLoading: isMarketStateDataLoading } =
    useMarketStateData(coinConfig?.marketStateId)

  const { mutateAsync: handleMintLp } = useMintLp(coinConfig, marketStateData)

  const { data: pyPositionData, refetch: refetchPyPosition } =
    usePyPositionData(
      address,
      coinConfig?.pyStateId,
      coinConfig?.maturity,
      coinConfig?.pyPositionTypeList,
    )

  const {
    data: coinData,
    refetch: refetchCoinData,
    isLoading: isBalanceLoading,
  } = useCoinData(
    address,
    tokenType === 0 ? coinConfig?.underlyingCoinType : coinType,
  )

  const coinName = useMemo(
    () =>
      tokenType === 0 ? coinConfig?.underlyingCoinName : coinConfig?.coinName,
    [tokenType, coinConfig],
  )

  const coinLogo = useMemo(
    () =>
      tokenType === 0 ? coinConfig?.underlyingCoinLogo : coinConfig?.coinLogo,
    [tokenType, coinConfig],
  )

  const price = useMemo(
    () =>
      (tokenType === 0
        ? coinConfig?.underlyingPrice
        : coinConfig?.coinPrice
      )?.toString(),
    [tokenType, coinConfig],
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
    [coinBalance, addValue],
  )

  const { data: ptYtData, refresh: refreshPtYt } = useCalculatePtYt(
    coinConfig,
    marketStateData,
  )
  const [ptRatio, syRatio] = useMemo(() => {
    if (
      ptYtData?.ptTvl &&
      ptYtData?.syTvl &&
      !new Decimal(ptYtData.ptTvl).isZero() &&
      !new Decimal(ptYtData.syTvl).isZero()
    ) {
      const totalTvl = new Decimal(ptYtData.ptTvl).add(
        new Decimal(ptYtData.syTvl),
      )
      return [
        new Decimal(ptYtData.ptTvl).div(totalTvl).mul(100).toFixed(2),
        new Decimal(ptYtData.syTvl).div(totalTvl).mul(100).toFixed(2),
      ]
    }
    return ["0", "0"]
  }, [ptYtData])

  const { isLoading } = useInputLoadingState(
    addValue,
    isConfigLoading || isCalculating,
  )

  const { isLoading: isRatioLoading } = useRatioLoadingState(
    isConfigLoading || isCalculating,
  )

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
    marketStateData,
  )

  const { mutate: calculateLpAmount } = useCalculateLpAmount(
    coinConfig,
    marketStateData,
  )

  // FIXME: update handleRefresh
  const handleRefresh = useCallback(async () => {
    try {
      setIsCalculating(true)
      const newRatio = await calculateRatio()
      setRatio(
        tokenType === 0
          ? new Decimal(newRatio).mul(conversionRate || 0).toString()
          : newRatio,
      )
    } catch (error) {
      console.error("Failed to refresh ratio:", error)
      setRatio("")
    } finally {
      setIsCalculating(false)
    }
  }, [calculateRatio, conversionRate, tokenType])

  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchCoinConfig(),
      refetchPyPosition(),
      refetchCoinData(),
    ])
  }, [refetchCoinConfig, refetchPyPosition, refetchCoinData])

  useEffect(() => {
    if (coinConfig && marketStateData) {
      handleRefresh()
    }
  }, [coinConfig, handleRefresh, marketStateData])

  const vaultId = useMemo(
    () =>
      coinConfig?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
          (item) => item.coinType === coinConfig?.coinType,
        )?.vaultId
        : "",
    [coinConfig],
  )

  const debouncedGetLpPosition = useCallback(
    (value: string, decimal: number, config: CoinConfig | undefined) => {
      const getLpPosition = debounce(async () => {
        setError("")
        if (
          config &&
          decimal &&
          isValidAmount(value) &&
          coinData?.length &&
          pyPositionData &&
          marketStateData
        ) {
          setIsCalculating(true)
          const inputAmount = new Decimal(value).mul(10 ** decimal).toString()
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
                  setAddType(result.addType)
                  setLpAmount(result.lpAmount)
                  setYtAmount(result.ytAmount)
                  setLpFeeAmount(result.lpFeeAmount)
                  setRatio(result.ratio)
                  setError(result.error || "")
                  setErrorDetail(result.errorDetail || "")
                },
                onSettled: () => {
                  setIsCalculating(false)
                },
              },
            )
          } catch (error) {
            setIsCalculating(false)
          }
        } else {
          setLpAmount(undefined)
          setYtAmount(undefined)
        }
      }, 500)
      getLpPosition()
      return getLpPosition.cancel
    },
    [
      coinData,
      pyPositionData,
      marketStateData,
      calculateLpAmount,
      vaultId,
      slippage,
      tokenType,
    ],
  )

  useEffect(() => {
    const cancelFn = debouncedGetLpPosition(addValue, decimal ?? 0, coinConfig)
    return () => {
      cancelFn()
    }
  }, [addValue, decimal, coinConfig, debouncedGetLpPosition])

  async function handleSeedLiquidity(
    tx: Transaction,
    addAmount: string,
    tokenType: number,
    coinConfig: CoinConfig,
    coinData: CoinData[],
    coinType: string,
    pyPosition: TransactionArgument,
    address: string,
    minLpAmount: string,
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
    debugLog("seed_liquidity move call:", seedLiquidityMoveCall)

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
          console.log("handleSeedLiquidity")

          await handleSeedLiquidity(
            tx,
            addAmount,
            tokenType,
            coinConfig,
            coinData,
            coinType,
            pyPosition,
            address,
            minLpAmount,
          )
        } else if (
          addType === "mint" ||
          new Decimal(marketStateData.totalSy).mul(0.4).lt(addAmount)
        ) {
          console.log("handleMintLp")
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
          console.log("handleAddLiquiditySingleSy")

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
            await refreshData()
            await refreshPtYt()
          },
        })

        setAddValue("")
      } catch (errorMsg) {
        const { error: msg, detail } = parseErrorMessage(
          (errorMsg as Error)?.message ?? "",
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
    <div className="w-full md:w-[500px] lg:w-full bg-[#0E0F16] rounded-xl md:rounded-2xl xl:rounded-[40px] p-3 sm:p-4 lg:p-6 border border-white/[0.07]">
      <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-4 sm:gap-8">
        {/* Left Panel */}
        <div className="space-y-3 sm:space-y-4">
          <PoolSelect
            coinType={coinType}
            maturity={maturity}
            onChange={(coinAddress, maturity) => {
              navigate(`/market/detail/${coinAddress}/${maturity}/add`, {
                replace: true,
              })
            }}
          />

          {/* Add Liquidity Panel */}
          <div className="bg-[#12121B] rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-white/[0.07]">
            <div className="flex flex-col items-center gap-y-3 sm:gap-y-4">
              <h2 className="text-center text-base sm:text-xl">
                Add Liquidity
              </h2>

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
                isConfigLoading={isConfigLoading}
                isBalanceLoading={isBalanceLoading}
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

              <ChevronsDown className="size-5 sm:size-6" />

              <div className="rounded-lg sm:rounded-xl border border-[#2D2D48] px-3 sm:px-4 py-4 sm:py-6 w-full text-xs sm:text-sm">
                <div className="flex flex-col items-end gap-y-1">
                  <div className="flex items-center justify-between w-full h-[24px] sm:h-[28px] gap-x-4">
                    <span className="shrink-0">LP Position</span>
                    <span className="flex items-center gap-x-1 sm:gap-x-1.5">
                      {!addValue ? (
                        "--"
                      ) : isCalculating ? (
                        <Skeleton className="h-6 sm:h-7 w-36 sm:w-48 bg-[#2D2D48]" />
                      ) : !decimal ? (
                        "--"
                      ) : (
                        <>
                          {"≈  " + formatDecimalValue(lpAmount, decimal)} LP{" "}
                          {coinConfig?.coinName}
                          {coinConfig?.coinLogo && (
                            <img
                              src={coinConfig.coinLogo}
                              alt={coinConfig.coinName}
                              className="size-[24px] sm:size-[28px]"
                            />
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {(ytAmount ||
                    (isCalculating &&
                      marketStateData &&
                      new Decimal(marketStateData.totalSy)
                        .mul(0.4)
                        .lt(
                          new Decimal(addValue || "0")
                            .mul(10 ** (decimal || 0))
                            .toString(),
                        ))) && (
                      <div className="flex items-center justify-between w-full h-[24px] sm:h-[28px] text-xs sm:text-sm text-white/60">
                        <span>YT Receive</span>
                        <span className="flex items-center gap-x-1 sm:gap-x-1.5">
                          {!addValue ? (
                            "--"
                          ) : isCalculating ? (
                            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 bg-[#2D2D48]" />
                          ) : !decimal ? (
                            "--"
                          ) : (
                            <>
                              {formatDecimalValue(ytAmount, decimal)} YT{" "}
                              {coinConfig?.coinName}
                            </>
                          )}
                        </span>
                      </div>
                    )}
                </div>

                <hr className="border-t border-[#2D2D48] my-4 sm:my-6" />

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-x-1">
                    <span>Total APY</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-2.5 sm:size-3 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#20283C] rounded-md border-none">
                          <p className="text-xs sm:text-sm">
                            Total APY includes trading fees and farming rewards.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="underline text-xs sm:text-sm">
                    {ptYtData?.poolApy
                      ? `${Number(ptYtData.poolApy).toFixed(6)}%`
                      : "--"}
                  </span>
                </div>
              </div>

              <TradeInfo
                ratio={ratio}
                slippage={slippage}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                setSlippage={setSlippage}
                isRatioLoading={isRatioLoading}
                coinName={
                  tokenType === 0
                    ? coinConfig?.underlyingCoinName
                    : coinConfig?.coinName
                }
                targetCoinName={`LP ${coinConfig?.coinName}`}
                tradeFee={lpFeeAmount}
              />

              <ActionButton
                onClick={add}
                btnText={btnText}
                disabled={btnDisabled}
                loading={isAdding || isCalculating}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {/* Right Panel Header */}
          <div className="grid grid-cols-3 mb-3 sm:mb-4 lg:mb-5">
            <div className="text-center">
              <p className="text-sm sm:text-lg lg:text-xl font-normal">
                {ptYtData?.tvl
                  ? `$${formatDecimalValue(ptYtData?.tvl || 0, 2)}`
                  : "--"}
              </p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-white/60">
                TVL
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg lg:text-xl font-normal">
                {dayjs(Number(coinConfig?.maturity ?? 0)).format("MMM DD YYYY")}
              </p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-white/60">
                Maturity
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg lg:text-xl font-normal">
                {ptYtData?.poolApy
                  ? `${formatLargeNumber(ptYtData.poolApy, 6)}%`
                  : "--"}
              </p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-white/60">
                Total APY
              </p>
            </div>
          </div>

          <div className="bg-[#12121B] rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-white/[0.07]">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {/* Pool Capacity */}
              {isValidAmount(marketStateData?.marketCap) && (
                <div className="border border-[#2D2D48] rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6 relative">
                  <h3 className="text-base sm:text-lg lg:text-xl font-normal mb-4 sm:mb-6 lg:mb-8">
                    Pool Capacity
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {isMarketStateDataLoading ? (
                          <Skeleton className="h-2 w-full bg-[#2D2D48]" />
                        ) : marketStateData ? (
                          <Progress
                            className="h-2 bg-[#2DF4DD] cursor-pointer"
                            indicatorClassName="bg-[#2C62D8]"
                            value={new Decimal(marketStateData.totalSy)
                              .div(marketStateData.marketCap)
                              .mul(100)
                              .toNumber()}
                          />
                        ) : (
                          <span>No data</span>
                        )}
                      </TooltipTrigger>

                      {/* Tooltip with bottom alignment and arrow */}
                      <TooltipContent
                        className="bg-[#12121B] border border-[#2D2D48] rounded-lg p-2 sm:p-3 text-xs sm:text-sm relative mb-2"
                        side="top"
                        align="end"
                        sideOffset={5}
                      >
                        <div className="text-white space-y-1">
                          <div>
                            Total Capacity:{" "}
                            {marketStateData?.marketCap && decimal
                              ? `${new Decimal(marketStateData.marketCap)
                                .div(10 ** decimal)
                                .toFixed(2)} ${coinConfig?.coinName}`
                              : "--"}
                          </div>
                          <div>
                            Filled:{" "}
                            {marketStateData
                              ? `${new Decimal(marketStateData.totalSy)
                                .div(new Decimal(marketStateData.marketCap))
                                .mul(100)
                                .toFixed(2)}%`
                              : "--"}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* Pool Ratio */}
              <div className="border border-[#2D2D48] rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6">
                <h3 className="text-sm sm:text-lg lg:text-xl font-normal mb-4 sm:mb-6 lg:mb-8">
                  Pool Ratio
                </h3>
                <div className="mb-3 sm:mb-4 cursor-pointer">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <div className="flex justify-between mb-3 sm:mb-4 text-xs sm:text-sm">
                            <span>
                              PT {coinConfig?.coinName} {ptRatio}%
                            </span>
                            <span>
                              {coinConfig?.coinName} {syRatio}%
                            </span>
                          </div>
                          <Progress
                            value={Number(ptRatio)}
                            className="h-2 bg-[#2DF4DD]"
                            indicatorClassName="bg-[#2C62D8]"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="bg-[#12121B] border border-[#2D2D48] rounded-lg p-2 sm:p-3 text-xs sm:text-sm relative mb-2"
                        side="top"
                        align="end"
                        sideOffset={5}
                      >
                        <div className="text-white space-y-1">
                          <div className="flex justify-between items-center gap-x-2 sm:gap-x-4">
                            <span>
                              {marketStateData?.totalPt && decimal
                                ? `${formatDecimalValue(
                                  new Decimal(marketStateData.totalPt).div(
                                    10 ** decimal,
                                  ),
                                  2,
                                )} `
                                : "--"}
                              PT {coinConfig?.coinName}:
                            </span>
                            <span>
                              {ptYtData?.ptTvl
                                ? `$${formatDecimalValue(ptYtData.ptTvl, 2)}`
                                : "--"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-x-2 sm:gap-x-4">
                            <span>
                              {marketStateData?.totalSy && decimal
                                ? `${formatDecimalValue(
                                  new Decimal(marketStateData.totalSy).div(
                                    10 ** decimal,
                                  ),
                                  2,
                                )} `
                                : "--"}
                              {coinConfig?.coinName}:
                            </span>
                            <span>
                              {ptYtData?.syTvl
                                ? `$${formatDecimalValue(ptYtData.syTvl, 2)}`
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* APY Information */}
              <div className="border border-[#2D2D48] rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-xl">Total APY</span>
                    <span className="text-base sm:text-xl text-white">
                      {ptYtData?.poolApy
                        ? `${Number(ptYtData.poolApy).toFixed(6)}%`
                        : "--"}
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#2D2D48]" />
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex justify-between items-center text-white/60 text-xs sm:text-sm">
                      <span>Scaled Underlying APY</span>
                      <span>
                        {ptYtData?.scaledUnderlyingApy
                          ? `${new Decimal(ptYtData.scaledUnderlyingApy).toFixed(6)} %`
                          : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-white/60 text-xs sm:text-sm">
                      <span>Scaled PT APY</span>
                      <span>
                        {ptYtData?.scaledPtApy
                          ? `${new Decimal(ptYtData.scaledPtApy).toFixed(6)} %`
                          : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-white/60 text-xs sm:text-sm">
                      <span>Swap Fee APY</span>
                      <span>
                        {ptYtData?.swapFeeApy
                          ? `${formatLargeNumber(ptYtData.swapFeeApy, 6)}%`
                          : "--"}
                      </span>
                    </div>
                    {ptYtData?.incentiveApy &&
                      isValidAmount(ptYtData.incentiveApy) && (
                        <div className="flex justify-between items-center text-white/60 text-xs sm:text-sm">
                          <span>Incentive APY</span>
                          <span>{`${new Decimal(ptYtData.incentiveApy).toFixed(6)} %`}</span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Built on section as a separate box */}
              {coinConfig?.builtOn && coinConfig.builtOn.length > 0 && (
                <div className="border border-[#2D2D48] rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-base sm:text-xl">
                      Built On
                    </span>
                    <div className="flex items-center gap-2">
                      {coinConfig.builtOn.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={item.logo}
                            alt={`${item.name} logo`}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
