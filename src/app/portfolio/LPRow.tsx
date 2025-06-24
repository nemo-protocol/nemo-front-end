"use client"
import Image from "next/image"
import Link from "next/link"
import Decimal from "decimal.js"
import { BaseRowProps } from "@/types/PortfolioRows"
import { ContractError, LpPosition, PyPosition } from "@/hooks/types"
import { MarketStateMap } from "@/hooks/query/useMultiMarketState"
import { RankedPortfolioItem, categories, isExpired } from "./Assets"
import dayjs from "dayjs"
import { formatPortfolioNumber, formatTVL } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from "@/lib/constants"
import useRedeemLp from "@/hooks/actions/useRedeemLp"
import { parseErrorMessage } from "@/lib/errorMapping"
import { showTransactionDialog } from "@/lib/dialog"
import { network } from "@/config"

export default function LPRow({
  item,
  activeTab,
  lpPositionsMap,
  lpReward,
  marketStates,
  pyPositionsMap,
}: {
  item: RankedPortfolioItem
  activeTab: {
    label: string
    key: string
  }
  lpPositionsMap: Record<
    string,
    {
      lpBalance: string
      lpPositions: LpPosition[]
    }
  >
  pyPositionsMap?: Record<
    string,
    {
      ptBalance: string
      ytBalance: string
      pyPositions: PyPosition[]
    }
  >
  lpReward?: Record<string, string>
  marketStates: MarketStateMap
}) {
  const expired = isExpired(item.maturity)
  const canShow =
    (activeTab === categories[0] || activeTab === categories[3]) &&
    item.listType === "lp" &&
    lpReward

  if (!canShow) return null

  const balance = new Decimal(lpPositionsMap?.[item.id]?.lpBalance || 0)
  const totalRew = new Decimal(item.lpTotalReward)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const { mutateAsync: redeemLp } = useRedeemLp(
    item,
    marketStates[item.marketStateId]
  )

  const vaultId = useMemo(
    () =>
      item?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find((item1) => item1.coinType === item?.coinType)
            ?.vaultId
        : "",
    [item]
  )
  const [minValue, setMinValue] = useState(0)

  useEffect(() => {
    if (item) {
      const minValue = NEED_MIN_VALUE_LIST.find(
        (item1) =>
          item1.provider === item.provider || item1.coinType === item.coinType
      )?.minValue
      if (minValue) {
        setMinValue(minValue)
      }
    }
  }, [item])

  async function redeemLP() {
    if (item.tradeStatus === "0") {
      return
    }
    if (!pyPositionsMap?.[item.id]?.pyPositions) {
      throw new Error("No PY positions found")
    }
    try {
      setRedeemLoading(true)
      const lpAmount = new Decimal(balance)
        .mul(10 ** Number(item?.decimal))
        .toFixed(0)
      const { digest } = await redeemLp({
        vaultId,
        slippage: "0.5",
        coinConfig: item,
        lpPositions: lpPositionsMap?.[item.id]?.lpPositions,
        pyPositions: pyPositionsMap?.[item.id]?.pyPositions,
        minValue,
        lpAmount,
        ytBalance: pyPositionsMap?.[item.id]?.ytBalance,
        action: "redeem",
      })
      if (digest)
        showTransactionDialog({
          status: "Success",
          network,
          txId: digest,
        })
      setRedeemLoading(false)
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
      setRedeemLoading(false)
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <tr>
      <td className="py-3 text-[20px] font-[500] text-[#FCFCFC] flex gap-x-2">
        {item.lpTokenLogo && (
          <Image
            src={item.lpTokenLogo}
            alt=""
            width={24}
            height={24}
            className="shrink-0"
          />
        )}
        LP {item.coinName}
      </td>

      <td className="py-3">
        <div className="text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(149,110,255,0.1)] text-[#956EFF]">
          LIQUIDITY
        </div>
      </td>

      <td className="py-3">
        <div
          className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex ${
            expired
              ? "text-[#4CC877] bg-[rgba(76,200,119,0.1)]"
              : "text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]"
          }`}
        >
          {dayjs(parseInt(item.maturity)).format("YYYY-MM-DD")}
        </div>
      </td>

      <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
        {formatTVL(item.lpPrice)}
      </td>

      <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
        <span>
          {balance.lt(0.01) && "<"}
          {formatPortfolioNumber(balance)}
        </span>
        <span className="text-[rgba(252,252,252,0.4)] ml-2">
          ~{balance.mul(item.lpPrice).lt(0.01) && "<"}$
          {formatPortfolioNumber(balance.mul(item.lpPrice))}
        </span>
      </td>

      {/* Incentive */}
      <td className="py-3 text-[#FCFCFC] relative group">
        {Number(totalRew) !== 0 ? (
          <>
            {" "}
            <div
              className={`text-[12px] cursor-pointer font-[600] py-1 gap-1 px-1.5 rounded-[8px] inline-flex ${
                item.lpTotalReward > 1000
                  ? "bg-[rgba(149,110,255,0.80)]"
                  : "bg-[rgba(76,200,119,0.80)]"
              }`}
            >
              <Image
                src="/lpReward.svg"
                alt=""
                width={12}
                height={12}
                className="shrink-0"
              />
              <span>
                ~{totalRew.lt(0.01) && "<"}${formatPortfolioNumber(totalRew)}
              </span>
            </div>
            {/* Hover Card */}
            {Number(totalRew) !== 0 && (
              <div className="absolute top-12 left-[-120px] ml-4 w-[320px] rounded-xl border border-[#6D7177] bg-[#101722] backdrop-blur px-6 py-6 text-sm z-10 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible">
                <div className="text-[18px] font-[470]">
                  Incentive&nbsp;Details
                </div>
                <div className="mt-4 font-[500]">
                  {marketStates[item.marketStateId]?.rewardMetrics.map((r) => {
                    const rew = new Decimal(
                      lpReward[item.id + r.tokenName] || 0
                    )
                    return (
                      <div
                        key={r.tokenName}
                        className="flex justify-between text-[14px] mt-2"
                      >
                        <div className="text-[rgba(252,252,252,0.40)]">
                          ${r.tokenName}
                        </div>
                        <div className="flex text-[rgba(252,252,252,0.40)]">
                          {rew.isZero() ? (
                            <>
                              <span>0</span>
                              <span className="mx-2 text-[#FCFCFC]">$0</span>
                            </>
                          ) : (
                            <>
                              <span>
                                {rew.lt(0.01) && "<"}
                                {formatPortfolioNumber(rew)}
                              </span>
                              <span className="mx-2 text-[#FCFCFC]">
                                ~{rew.mul(r.tokenPrice).lt(0.01) && "<"}$
                                {formatPortfolioNumber(rew.mul(r.tokenPrice))}
                              </span>
                            </>
                          )}
                          <Image
                            src={r.tokenLogo}
                            alt=""
                            width={16}
                            height={16}
                            className="shrink-0"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="w-full h-px bg-[rgba(252,252,252,0.10)] my-4"></div>
                <div className="flex justify-between text-[14px] font-[500]">
                  <div className="text-[rgba(252,252,252,0.50)]">Total</div>
                  <div className="text-[#956EFF]">
                    ~{totalRew.lt(0.01) && "<"}$
                    {formatPortfolioNumber(totalRew)}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          "—"
        )}
      </td>

      <td className="py-3 text-[14px] text-[#FCFCFC]">—</td>

      <td className="py-3 text-[14px] text-right font-[500]">
        <div
          className={`cursor-pointer px-2.5 py-1.5 items-center rounded-[16px] transition-colors duration-200 inline-flex gap-1 ${
            expired
              ? "text-[#4CC877] hover:bg-[rgba(76,200,119,0.10)]"
              : "text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)]"
          }`}
        >
          {expired ? (
            <button
              disabled={redeemLoading}
              onClick={redeemLP}
              className="flex items-center gap-1"
            >
              {redeemLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-25"
                    />

                    <path
                      d="M12 2 a 10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  <span>Redeeming</span>
                </span>
              ) : (
                <>
                  <img src="/redeem.svg" alt="" className="w-4 h-4" />
                  Redeem
                </>
              )}
            </button>
          ) : (
            <Link
              href={`/market-detail/${item.id}/${item.coinType}/provide/pool`}
              className="inline-flex gap-1 items-center"
            >
              <ArrowUpRight className="w-4 h-4" />
              Trade
            </Link>
          )}
        </div>
      </td>
    </tr>
  )
}
