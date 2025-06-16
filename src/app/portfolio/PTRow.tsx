'use client';
import Image from 'next/image';
import Link from 'next/link';
import Decimal from 'decimal.js';
import { BaseRowProps } from '@/types/PortfolioRows';
import { LpPosition, PyPosition } from '@/hooks/types';
import { RankedPortfolioItem, categories, isExpired } from './Assets';
import dayjs from 'dayjs';
import { formatPortfolioNumber, formatTVL } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import { initPyPosition } from '@/lib/txHelper';
import useRedeemPY from "@/hooks/actions/useRedeemPy"
import { MarketStateMap } from '@/hooks/query/useMultiMarketState';
import useCoinData from '@/hooks/query/useCoinData';
import { useWallet } from '@nemoprotocol/wallet-kit';
import { CETUS_VAULT_ID_LIST, NEED_MIN_VALUE_LIST } from '@/lib/constants';
import { useEffect, useMemo, useState } from 'react';

export default function PTRow({
  item,
  activeTab,
  pyPositionsMap,
  marketStates,
}: {
  item: RankedPortfolioItem;
  activeTab: {
    label: string
    key: string
  };
  pyPositionsMap?: Record<string, {
    ptBalance: string;
    ytBalance: string;
    pyPositions: PyPosition[];
  }>
  marketStates: MarketStateMap;
}) {
  const expired = isExpired(item.maturity);
  const canShow =
    (activeTab === categories[0] || activeTab === categories[1]) &&
    item.listType === 'pt';
  const { address } = useWallet();

  if (!canShow) return null;

  const [redeemLoading, setRedeemLoading] = useState(false)

  const balance = new Decimal(pyPositionsMap?.[item.id]?.ptBalance || 0);
  const { mutateAsync: redeemPy } = useRedeemPY(item, marketStates[item.marketStateId])
  const { data: ptCoins = [] } = useCoinData(address, item?.ptTokenType)

  const vaultId = useMemo(
    () =>
      item?.underlyingProtocol === "Cetus"
        ? CETUS_VAULT_ID_LIST.find(
          (item1) => item1.coinType === item?.coinType,
        )?.vaultId
        : "",
    [item],
  )
  const [minValue, setMinValue] = useState(0)

  useEffect(() => {
    if (item) {
      const minValue = NEED_MIN_VALUE_LIST.find(
        (item1) =>
          item1.provider === item.provider ||
          item1.coinType === item.coinType,
      )?.minValue
      if (minValue) {
        setMinValue(minValue)
      }
    }
  }, [item])

  async function redeemPY() {
    if (item.tradeStatus === "0") {
      return
    }
    if (!pyPositionsMap?.[item.id]?.pyPositions) {
      throw new Error("No PT coins or PY positions found")
    }
    try {
      setRedeemLoading(true)
      const { digest } = await redeemPy({
        vaultId,
        ptCoins,
        slippage: "0.5",
        minValue,
        coinConfig: item,
        pyPositions: pyPositionsMap?.[item.id]?.pyPositions,
      })
      // if (digest) setTxId(digest)
      // setOpen(true)
      // setStatus("Success")
      // setPtRedeemed(true)
      // await refreshData()
    } catch (error) {
      // setOpen(true)
      // setStatus("Failed")
      // setMessage((error as Error)?.message ?? error)
    } finally {
      setRedeemLoading(false)
    }
  }


  return (
    <tr>
      {/* Asset */}
      <td className="py-3 text-[20px] font-[500] text-[#FCFCFC] flex gap-x-2">
        {item.ptTokenLogo && <Image src={item.ptTokenLogo} alt="" width={24} height={24} className="shrink-0" />}
        PT {item.coinName}
      </td>

      {/* Tag */}
      <td className="py-3">
        <div className="text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex bg-[rgba(23,182,155,0.10)] text-[#17B69B]">
          PRINCIPLE&nbsp;TOKEN
        </div>
      </td>

      {/* Maturity */}
      <td className="py-3">
        <div
          className={`text-[12px] font-[600] py-1 px-1.5 rounded-[8px] inline-flex ${expired
            ? 'text-[#4CC877] bg-[rgba(76,200,119,0.1)]'
            : 'text-[#FCFCFC66] bg-[rgba(23,133,183,0.10)]'
            }`}
        >
          {dayjs(parseInt(item.maturity)).format('YYYY-MM-DD')}
        </div>
      </td>

      {/* TVL */}
      <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">{formatTVL(item.ptPrice)}</td>

      {/* My Balance */}
      <td className="py-3 font-[500] text-[14px] text-[#FCFCFC]">
        <span>{balance.lt(0.01) && '<'}{formatPortfolioNumber(balance)}</span>
        <span className="text-[rgba(252,252,252,0.4)] ml-2">
          ~{balance.mul(item.ptPrice).lt(0.01) && '<'}$
          {formatPortfolioNumber(balance.mul(item.ptPrice))}
        </span>
      </td>

      {/* 空列 */}
      <td className="py-3 text-[14px] text-[#FCFCFC]">—</td>
      <td className="py-3 text-[14px] text-[#FCFCFC]">—</td>

      {/* 操作按钮 */}
      <td className="py-3 text-[14px] text-right font-[500]">
        <div
          className={`cursor-pointer px-2.5 py-1.5 items-center rounded-[16px] transition-colors duration-200 inline-flex gap-1 ${expired
            ? 'text-[#4CC877] hover:bg-[rgba(76,200,119,0.10)]'
            : 'text-[rgba(252,252,252,0.4)] hover:text-white hover:bg-[rgba(252,252,252,0.10)]'
            }`}
        >
          {expired ? (
            <button
              disabled={redeemLoading}
              onClick={redeemPY} className='flex items-center gap-1'>

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
              ) : <>
                <img src="/redeem.svg" alt="" className="w-4 h-4" />
                Redeem
              </>

              }
            </button>
          ) : (
            <Link href={`/market-detail/${item.id}/${item.coinType}/trade/fixed`} className="inline-flex gap-1 items-center">
              <ArrowUpRight className="w-4 h-4" />
              Trade
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}