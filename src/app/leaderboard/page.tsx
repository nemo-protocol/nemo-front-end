'use client';

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useMyRank } from '@/hooks/useMyRank';
import EmptyData from '@/components/ui/empty';

/* ───────────────────────────── 页面组件 ───────────────────────────── */
export default function LeaderboardPage() {
  /* 1. 我的个人积分与排名 */
  const {
    data: myRank,
    loading: loadingMy,
  } = useMyRank();

  /* 2. 整体排行榜（分页） */
  const {
    data: listData,
    loading: loadingList,
    setPageIndex,
  } = useLeaderboard({ pageSize: 10 });

  const rows         = listData?.data ?? [];
  const totalUsers   = listData?.count ?? 0;
  const pageIndex    = listData?.page.pageIndex ?? 1;
  const pageSize     = listData?.page.pageSize ?? 10;
  const totalPages   = Math.max(1, Math.ceil(totalUsers / pageSize));
  const showSkeleton = (loadingMy || loadingList) && rows.length === 0;

  /* ───── 顶部 3 卡片 ───── */
  const Summary = () => (
    <div className="grid grid-cols-3 gap-6 text-center mb-12">
      <SummaryCard
        title="MY TOTAL POINTS"
        loading={loadingMy}
        value={myRank?.totalPoints?.toLocaleString() ?? '--'}
      />
      <SummaryCard
        title="POINTS PER DAY"
        loading={loadingMy}
        value={
          myRank
            ? myRank.pointsPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : '--'
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
      />
    </div>
  );

  return (
    <div className=" px-6 py-8 bg-[#080d16]">
      <Summary />

      {/* ───── 排行榜表格 ───── */}
      <div className="w-full overflow-x-auto">
        <table
          className={`w-max min-w-[calc(100vw-128px)] border-collapse border-separate ${
            rows.length === 0 ? 'border-spacing-y-4' : 'border-spacing-y-0.5'
          }`}
        >
          <thead className="text-white/60">
            <tr>
              <th className="py-2 w-[10%] text-left text-[12px] font-[600]">RANK</th>
              <th className="py-2 w-[50%] text-left text-[12px] font-[600]">ADDRESS</th>
              <th className="py-2 w-[20%] text-left text-[12px] font-[600]">DAILY POINTS AVG</th>
              <th className="py-2 text-right text-[12px] font-[600]">TOTAL POINTS</th>
            </tr>
          </thead>

          <tbody className="text-[#FCFCFC]">
            {rows.map((item) => (
              <tr key={item.address}>
                <td className="py-3 text-[14px] font-[600]">
                  <RankCell rank={item.rank} />
                </td>
                <td className="py-3 text-[14px] font-[500]">{shortHash(item.address, 14)}</td>
                <td className="py-3 text-[14px] font-[500]">
                  {item.pointsPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 text-right text-[14px] font-[500]">
                  {item.totalPoints.toLocaleString()}
                </td>
              </tr>
            ))}

            {/* 骨架屏 */}
            {showSkeleton &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="w-full h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4 overflow-hidden">
                  <td colSpan={4}></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {!showSkeleton && rows.length === 0 && (
          <div className="w-full flex justify-center">
            <EmptyData />
          </div>
        )}
      </div>

      {/* ───── 分页 ───── */}
      {rows.length > 0 && (
        <div className="flex justify-end gap-3 text-[12px] font-[600] mt-6">
          <PaginateButton label="FIRST" disabled={pageIndex === 1} onClick={() => setPageIndex(1)} />
          <PaginateButton
            label={<ArrowLeft className="size-4" />}
            disabled={pageIndex === 1}
            onClick={() => setPageIndex(p => Math.max(1, p - 1))}
          />
          <div className="px-4 py-1 rounded bg-[#1b1f25] opacity-60 select-none">
            PAGE&nbsp;{pageIndex}&nbsp;OF&nbsp;{totalPages}
          </div>
          <PaginateButton
            label={<ArrowRight className="size-4" />}
            disabled={pageIndex === totalPages}
            onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
          />
          <PaginateButton
            label="LAST"
            disabled={pageIndex === totalPages}
            onClick={() => setPageIndex(totalPages)}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── 小组件 ───────────────────────────── */

function SummaryCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="text-[14px] tracking-widest text-[#FCFCFC]/60 font-[600]">{title}</div>
      <div className="text-[48px] font-serif font-[470] text-[#FCFCFC]">
        {loading ? '— —' : value}
      </div>
    </div>
  );
}

const rankBadge: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-gradient-to-r from-[#FFD700] to-[#FFAD00]', text: 'text-[#181B20]' },
  2: { bg: 'bg-[#C0C0C0]', text: 'text-[#181B20]' },
  3: { bg: 'bg-[#CD7F32]', text: 'text-[#181B20]' },
};

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    const { bg, text } = rankBadge[rank];
    return (
      <span className={`px-3 py-1 rounded-full ${bg} ${text} inline-flex items-center gap-1`}>
        <Image src={`/rank-${rank}.svg`} alt="" width={14} height={14} className="shrink-0" />
        #{rank}
      </span>
    );
  }
  return <>#{rank}</>;
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
      className={`px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 disabled:opacity-60 ${
        !disabled && 'hover:bg-[rgba(23,133,183,0.30)]'
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