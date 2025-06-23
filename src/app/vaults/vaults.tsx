'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import copy from "clipboard-copy"

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useMyRank } from '@/hooks/useMyRank';
import EmptyData from '@/components/ui/empty';
import { useToast } from '@/components/Toast';

export default function VaultsPage() {
  const {
    data: myRank,
    loading: loadingMy,
  } = useMyRank();

  const {
    data: listData,
    loading: loadingList,
    setPageIndex,
  } = useLeaderboard({ pageSize: 10 });
  const toast = useToast()

  const rows = listData?.data ?? [];
  const totalUsers = listData?.count ?? 0;
  const pageIndex = listData?.page.pageIndex ?? 1;
  const pageSize = listData?.page.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const copyToClipboard = async (text: string) => {
    try {
      await copy(text)
      toast.success("Address copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  const Summary = () => (
    <div className="grid grid-cols-3 gap-6 text-center mt-12">
      <SummaryCard
        title="MY TOTAL POINTS"
        loading={loadingMy}
        value={myRank?.totalPoints?.toLocaleString() ?? '0'}
      />
      <SummaryCard
        title="POINTS PER DAY"
        loading={loadingMy}
        value={
          myRank
            ? myRank.pointsPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : '0'
        }
      />
      <SummaryCard
        title="YOUR RANKING"
        loading={loadingMy}
        value={
          myRank
            ? (
              <>
                #{myRank.rank.toLocaleString()}
                <span className="opacity-50 text-[24px]">
                  &nbsp;/&nbsp;{totalUsers.toLocaleString()}
                </span>
              </>
            )
            : '--'
        }
        ranking={myRank ? myRank.rank / totalUsers : 1}
      />
    </div>
  );

  return (
    <div className="py-4 bg-[#080d16]">
      <h1 className="text-[32px] w-full flex justify-center gap-2 items-start font-normal font-serif font-[470] text-[#FCFCFC]">Leaderboard
        <Image
          src={"/laurel-leafs.svg"}
          alt={""}
          width={16}
          height={16}
          className="shrink-0 mt-1.5"
        /></h1>
      <Summary />

      <div className="flex mx-7.5  gap-1">
        <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] font-normal font-serif">{"Rankings"}</h1>

        <div className="relative mt-1 group">
          <button
            className="text-xs rounded-full inline-flex justify-center leading-none w-4 h-8 select-none cursor-pointer"
          >
            <Image src="/tip.svg" alt="" width={16} height={16} className="shrink-0" />
          </button>

          <div
            className="hidden group-hover:block absolute top-0 left-0.5 ml-4 w-[480px] rounded-xl border border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm z-10 animate-fade-in text-[#FCFCFC]"
          >
            This ranking is used to quantify the contributors who are deeply involved in the Nemo protocol.
          </div>
        </div>

      </div>
      {/* ───── 排行榜表格 ───── */}
      <div className="mx-7.5 mt-6 px-4 bg-[rgba(252,252,252,0.03)] py-6 px-6 rounded-[24px]">
        <div className="w-full overflow-x-auto">
          <table
            className={`w-max min-w-[calc(100vw-128px)] border-collapse border-separate ${rows.length === 0 ? 'border-spacing-y-4' : 'border-spacing-y-0.5'
              }`}
          >
            <thead className="text-white/60">
              <tr>
                <th className="py-2 w-[25%] text-left text-[12px] font-[600]">RANK</th>
                <th className="py-2 w-[25%] text-left text-[12px] font-[600]">ADDRESS</th>
                <th className="py-2 w-[25%] text-right text-[12px] font-[600]">DAILY POINTS AVG</th>
                <th className="py-2 w-[25%] text-right text-[12px] font-[600]">TOTAL POINTS</th>
              </tr>
            </thead>

            <tbody className="text-[#FCFCFC]">
              {myRank &&
                <tr key={myRank.address} >
                  <td className="py-3 text-[14px] font-[500] border-t border-b border-[#3F3F3F]">
                    <span className={`px-3 py-1 rounded-[12px]  text-[12px] text-white/60 font-[600] inline-flex items-center gap-1`}>
                      <Image src={`/people.svg`} alt="" width={14} height={14} className="shrink-0" />
                      #{myRank.rank}
                    </span>
                  </td>
                  <td className="py-3 text-[14px] font-[500] h-[60px]  flex items-center gap-2 border-t border-b border-[#3F3F3F]">
                    <div className='w-56 whitespace-nowrap overflow-hidden text-ellipsis'>{myRank.address}</div>
                    <Image src={`/copy.svg`} alt="" width={16} height={16} onClick={() => copyToClipboard(myRank.address)} className="shrink-0  cursor-pointer" />
                  </td>
                  <td className="py-3 text-[14px] text-right font-[500] border-t border-b border-[#3F3F3F]">
                    {myRank.pointsPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-[14px] font-[500] border-t border-b border-[#3F3F3F]">
                    {myRank.totalPoints.toLocaleString()}
                  </td>
                </tr>}
              {rows.map((item) => (
                <tr key={item.address}>
                  <td className="py-3 text-[14px] font-[500]">
                    <RankCell rank={item.rank} />
                  </td>
                  <td className="py-3 text-[14px]  h-[54px] font-[500] flex items-center gap-2">
                    <div className='w-56 whitespace-nowrap overflow-hidden text-ellipsis'>{item.address}</div>
                    <Image src={`/copy.svg`} alt="" width={16} height={16} onClick={() => copyToClipboard(item.address)} className="shrink-0  cursor-pointer" />
                  </td>
                  <td className="py-3 text-[14px] text-right font-[500]">
                    {item.pointsPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-[14px] font-[500]">
                    {item.totalPoints.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* 骨架屏 */}
              {rows.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="w-full h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4 overflow-hidden">
                    <td colSpan={4}></td>
                  </tr>
                ))}
            </tbody>
          </table>


        </div>

        {/* ───── 分页 ───── */}
        {rows.length > 0 && (
          <div className="flex justify-end gap-3 text-[12px] font-[600] mt-6">

            {(() => {


              return (
                <>
                  {/* FIRST */}
                  <button
                    className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${!(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                    disabled={pageIndex === 1}
                    onClick={() => setPageIndex(1)}
                  >
                    FIRST
                  </button>

                  {/* < */}
                  <button
                    className={`w-8  py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${!(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                    disabled={pageIndex === 1}
                    onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>

                  {/* PAGE X OF Y */}
                  <div className="px-4 py-1 rounded bg-[#1b1f25] opacity-60  text-[#FCFCFC]/60 select-none">
                    PAGE&nbsp;{pageIndex}&nbsp;OF&nbsp;{totalPages}
                  </div>

                  {/* > */}
                  <button
                    className={`w-8  py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${!(pageIndex === totalPages) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                    disabled={pageIndex === totalPages}
                    onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                  >
                    &gt;
                  </button>

                  {/* LAST */}
                  <button
                    className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${!(pageIndex === totalPages) && "hover:bg-[rgba(23,133,183,0.30)]"}`}
                    disabled={pageIndex === totalPages}
                    onClick={() => setPageIndex(totalPages)}
                  >
                    LAST
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}


const myRankBadge: Record<number, { bg: string; text: string, title: string, icon: string }> = {
  1: { bg: 'bg-[rgba(149,110,255,0.1)]', text: 'text-[#956EFF]', title: '5%', icon: '/rank-1.svg' },
  2: { bg: 'bg-[rgba(255,136,0,0.10)]', text: 'text-[#F80]', title: '10%', icon: '/rank-2.svg' },
  3: { bg: 'bg-[rgba(252,252,252,0.1)]', text: 'text-[#FCFCFC]', title: '30%', icon: '/rank-3.svg' },
};
function SummaryCard({
  title,
  value,
  loading,
  ranking
}: {
  title: string;
  value: React.ReactNode;
  loading?: boolean;
  ranking?: number
}) {
  let badge
  if (ranking && ranking < 0.05) {
    badge = myRankBadge[1];
  } else if (ranking && ranking < 0.1) {
    badge = myRankBadge[2];
  } else if (ranking && ranking < 0.3) {
    badge = myRankBadge[3];
  }
  return (
    <div className="flex flex-col h-[152px] items-center">
      <div className="text-[12px] font-[600] text-[#FCFCFC66]">{title}
        {badge && <>
          <span className={`px-3 py-1 ml-2 rounded-[12px] ${badge.bg} ${badge.text} inline-flex items-center gap-1`}>

            TOP {badge.title}
            <Image src={badge.icon} alt="" width={12} height={12} className="shrink-0" />
          </span></>}
      </div>
      {(loading) ? <div className="w-[290px] font-[470] h-[36px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4"></div> : <div className="text-[56px] font-serif font-Medium font-[470] text-[#FCFCFC]">{value}</div>}
      <div className="text-[48px] font-serif font-[470] text-[#FCFCFC]">
      </div>
    </div>
  );
}

const rankBadge: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-[rgba(255,46,84,0.10)]', text: 'text-[#FF2E54]' },
  2: { bg: 'bg-[rgba(255,136,0,0.10)]', text: 'text-[#F80]' },
  3: { bg: 'bg-[rgba(76,200,119,0.10)]', text: 'text-[#4CC877]' },
};

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    const { bg, text } = rankBadge[rank];
    return (
      <span className={`px-3 py-1 text-right rounded-[12px] ${bg} ${text} inline-flex items-center gap-1`}>
        <Image src={`/laurel-leafs-${rank}.svg`} alt="" width={14} height={14} className="shrink-0" />
        #{rank}
      </span>
    );
  }
  return <span className={`px-3 py-1 rounded-[12px] inline-flex items-center gap-1`}>
    #{rank}
  </span>;
}

function PaginateButton({
  label,
  disabled,
  onClick,
}: {
  label: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${!disabled && 'hover:bg-[rgba(23,133,183,0.30)]'
        }`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function shortHash(hash = '', len = 6) {
  return hash.length > 2 * len ? `${hash.slice(0, len)}…${hash.slice(-len)}` : hash;
}