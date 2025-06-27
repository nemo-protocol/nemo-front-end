"use client"

import React from "react"
import Image from "next/image"
import copy from "clipboard-copy"

import { useLeaderboard } from "@/hooks/useLeaderboard"
import { useMyRank } from "@/hooks/useMyRank"
import { useToast } from "@/components/Toast"

export default function LeaderboardPage() {
  const { data: myRank, loading: loadingMy } = useMyRank()

  const { data: listData, setPageIndex } = useLeaderboard({ pageSize: 10 })
  const toast = useToast()

  const rows = listData?.data ?? []
  const totalUsers = listData?.count ?? 0
  const pageIndex = listData?.page.pageIndex ?? 1
  const pageSize = listData?.page.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))
  const copyToClipboard = async (text: string) => {
    try {
      await copy(text)
      toast.success("Address copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const Summary = () => (
    <div className="mt-8 md:mt-12 mx-4 md:mx-0">
      {/* 移动端布局 */}
      <div className="block md:hidden">
        {/* 第一行：MY TOTAL POINTS */}
        <div className="text-center mb-6 pb-6 border-b border-light-gray/10">
          <SummaryCard
            title="MY TOTAL POINTS"
            loading={loadingMy}
            value={myRank?.totalPoints?.toLocaleString() ?? "0"}
          />
        </div>

        {/* 第二行：POINTS PER DAY 和 RANKING 并排 */}
        <div className="grid grid-cols-2 text-center relative">
          {/* 垂直分割线 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-light-gray/10 transform -translate-x-1/2"></div>
          <div className="pr-4">
            <SummaryCard
              title="POINTS PER DAY"
              loading={loadingMy}
              value={
                myRank
                  ? myRank.pointsPerDay.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : "0"
              }
            />
          </div>
          <div className="pl-4">
            <SummaryCard
              title="RANKING"
              loading={loadingMy}
              value={
                myRank ? (
                  <>
                    #{myRank.rank.toLocaleString()}
                    <span className="opacity-50 text-[16px]">
                      &nbsp;/&nbsp;{totalUsers.toLocaleString()}
                    </span>
                  </>
                ) : (
                  "--"
                )
              }
              ranking={myRank ? myRank.rank / totalUsers : 1}
            />
          </div>
        </div>
      </div>

      {/* 桌面端布局 */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 text-center">
        <SummaryCard
          title="MY TOTAL POINTS"
          loading={loadingMy}
          value={myRank?.totalPoints?.toLocaleString() ?? "0"}
        />
        <SummaryCard
          title="POINTS PER DAY"
          loading={loadingMy}
          value={
            myRank
              ? myRank.pointsPerDay.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : "0"
          }
        />
        <SummaryCard
          title="RANKING"
          loading={loadingMy}
          value={
            myRank ? (
              <>
                #{myRank.rank.toLocaleString()}
                <span className="opacity-50 text-[24px]">
                  &nbsp;/&nbsp;{totalUsers.toLocaleString()}
                </span>
              </>
            ) : (
              "--"
            )
          }
          ranking={myRank ? myRank.rank / totalUsers : 1}
        />
      </div>
    </div>
  )

  return (
    <div className="py-4 bg-[#080d16] min-h-screen">
      <h1 className="text-[24px] md:text-[32px] w-full flex justify-center gap-2 items-start font-normal font-serif text-[#FCFCFC] px-4 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)]">
        Leaderboard
        <Image
          src={"/laurel-leafs.svg"}
          alt={""}
          width={16}
          height={16}
          className="shrink-0 mt-1.5"
        />
      </h1>
      <Summary />

      <div className="flex mx-4 md:mx-7.5 gap-1 mt-8 md:mt-6">
        <h1
          className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[24px] md:text-[32px] font-normal font-serif"
        >
          {"Rankings"}
        </h1>

        <div className="relative mt-1 group">
          <button className="text-xs rounded-full inline-flex justify-center leading-none w-4 h-8 select-none cursor-pointer">
            <Image
              src="/tip.svg"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
          </button>

          <div className="hidden group-hover:block absolute top-0 left-0.5 ml-4 w-[280px] md:w-[480px] rounded-xl border border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm z-10 animate-fade-in text-[#FCFCFC]">
            This ranking is used to quantify the contributors who are deeply
            involved in the Nemo protocol.
          </div>
        </div>
      </div>
      {/* ───── 排行榜表格 ───── */}
      <div className="mx-4 md:mx-7.5 mt-6 bg-[rgba(252,252,252,0.03)] py-4 md:py-6 px-3 md:px-6 rounded-[24px]">
        <div className="w-full overflow-x-auto">
          <table
            className={`w-full md:min-w-[600px] border-collapse border-separate ${
              rows.length === 0 ? "border-spacing-y-4" : "border-spacing-y-0.5"
            }`}
          >
            <thead className="text-white/60">
              <tr>
                <th className="py-2 w-[20%] md:w-[25%] text-left text-[10px] md:text-[12px] font-[600]">
                  RANK
                </th>
                <th className="py-2 w-[35%] md:w-[25%] text-left text-[10px] md:text-[12px] font-[600]">
                  ADDRESS
                </th>
                <th className="py-2 w-[22.5%] md:w-[25%] text-right text-[10px] md:text-[12px] font-[600]">
                  DAILY AVG
                </th>
                <th className="py-2 w-[22.5%] md:w-[25%] text-right text-[10px] md:text-[12px] font-[600]">
                  POINTS
                </th>
              </tr>
            </thead>

            <tbody className="text-[#FCFCFC]">
              {myRank && (
                <tr key={myRank.address}>
                  <td className="py-2 md:py-3 text-[12px] md:text-[14px] font-[500] border-t border-b border-[#3F3F3F]">
                    <span
                      className={`px-2 md:px-3 py-1 rounded-[12px] text-[10px] md:text-[12px] text-white/60 font-[600] inline-flex items-center gap-1`}
                    >
                      <Image
                        src={`/people.svg`}
                        alt=""
                        width={12}
                        height={14}
                        className="shrink-0"
                      />
                      #{myRank.rank}
                    </span>
                  </td>
                                     <td className="py-2 md:py-3 text-[12px] md:text-[14px] font-[500] h-[50px] md:h-[60px] flex items-center gap-1 md:gap-2 border-t border-b border-[#3F3F3F]">
                     <div className="whitespace-nowrap">
                       <span className="md:hidden">{shortenAddress(myRank.address)}</span>
                       <span className="hidden md:block w-56 overflow-hidden text-ellipsis">
                         {myRank.address}
                       </span>
                     </div>
                    <Image
                      src={`/copy.svg`}
                      alt=""
                      width={14}
                      height={16}
                      onClick={() => copyToClipboard(myRank.address)}
                      className="shrink-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 md:py-3 text-[12px] md:text-[14px] text-right font-[500] border-t border-b border-[#3F3F3F]">
                    {myRank.pointsPerDay.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 md:py-3 text-right text-[12px] md:text-[14px] font-[500] border-t border-b border-[#3F3F3F]">
                    {myRank.totalPoints.toLocaleString()}
                  </td>
                </tr>
              )}
              {rows.map((item) => (
                <tr key={item.address}>
                  <td className="py-2 md:py-3 text-[12px] md:text-[14px] font-[500]">
                    <RankCell rank={item.rank} />
                  </td>
                                     <td className="py-2 md:py-3 text-[12px] md:text-[14px] h-[46px] md:h-[54px] font-[500] flex items-center gap-1 md:gap-2">
                     <div className="whitespace-nowrap">
                       <span className="md:hidden">{shortenAddress(item.address)}</span>
                       <span className="hidden md:block w-56 overflow-hidden text-ellipsis">
                         {item.address}
                       </span>
                     </div>
                    <Image
                      src={`/copy.svg`}
                      alt=""
                      width={14}
                      height={16}
                      onClick={() => copyToClipboard(item.address)}
                      className="shrink-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 md:py-3 text-[12px] md:text-[14px] text-right font-[500]">
                    {item.pointsPerDay.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 md:py-3 text-right text-[12px] md:text-[14px] font-[500]">
                    {item.totalPoints.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* 骨架屏 */}
              {rows.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="w-full h-[35px] md:h-[42px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4 overflow-hidden"
                  >
                    <td colSpan={4}></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ───── 分页 ───── */}
        {rows.length > 0 && (
          <div className="flex justify-center md:justify-end gap-2 md:gap-3 text-[10px] md:text-[12px] font-[600] mt-6 flex-wrap">
            {(() => {
              return (
                <>
                  {/* FIRST */}
                  <button
                    className={`px-2 md:px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${
                      !(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"
                    }`}
                    disabled={pageIndex === 1}
                    onClick={() => setPageIndex(1)}
                  >
                    FIRST
                  </button>

                  {/* < */}
                  <button
                    className={`w-6 md:w-8 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${
                      !(pageIndex === 1) && "hover:bg-[rgba(23,133,183,0.30)]"
                    }`}
                    disabled={pageIndex === 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>

                  {/* PAGE X OF Y */}
                  <div className="px-2 md:px-4 py-1 rounded bg-[#1b1f25] opacity-60 text-[#FCFCFC]/60 select-none whitespace-nowrap">
                    PAGE&nbsp;{pageIndex}&nbsp;OF&nbsp;{totalPages}
                  </div>

                  {/* > */}
                  <button
                    className={`w-6 md:w-8 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${
                      !(pageIndex === totalPages) &&
                      "hover:bg-[rgba(23,133,183,0.30)]"
                    }`}
                    disabled={pageIndex === totalPages}
                    onClick={() =>
                      setPageIndex((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    &gt;
                  </button>

                  {/* LAST */}
                  <button
                    className={`px-2 md:px-4 py-1 rounded bg-[#1b1f25] text-[#FCFCFC]/80 transition disabled:opacity-60 ${
                      !(pageIndex === totalPages) &&
                      "hover:bg-[rgba(23,133,183,0.30)]"
                    }`}
                    disabled={pageIndex === totalPages}
                    onClick={() => setPageIndex(totalPages)}
                  >
                    LAST
                  </button>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

const myRankBadge: Record<
  number,
  { bg: string; text: string; title: string; icon: string }
> = {
  1: {
    bg: "bg-[rgba(149,110,255,0.1)]",
    text: "text-[#956EFF]",
    title: "5%",
    icon: "/rank-1.svg",
  },
  2: {
    bg: "bg-[rgba(255,136,0,0.10)]",
    text: "text-[#F80]",
    title: "10%",
    icon: "/rank-2.svg",
  },
  3: {
    bg: "bg-[rgba(252,252,252,0.1)]",
    text: "text-[#FCFCFC]",
    title: "30%",
    icon: "/rank-3.svg",
  },
}
function SummaryCard({
  title,
  value,
  loading,
  ranking,
}: {
  title: string
  value: React.ReactNode
  loading?: boolean
  ranking?: number
}) {
  let badge
  if (ranking && ranking < 0.05) {
    badge = myRankBadge[1]
  } else if (ranking && ranking < 0.1) {
    badge = myRankBadge[2]
  } else if (ranking && ranking < 0.3) {
    badge = myRankBadge[3]
  }
  return (
    <div className="flex flex-col h-[120px] md:h-[152px] items-center">
      <div className="text-[10px] md:text-[12px] font-[600] text-[#FCFCFC66] text-center">
        {title}
        {badge && (
          <>
            <span
              className={`px-2 md:px-3 py-1 ml-1 md:ml-2 rounded-[12px] ${badge.bg} ${badge.text} inline-flex items-center gap-1 text-[8px] md:text-[10px]`}
            >
              TOP {badge.title}
              <Image
                src={badge.icon}
                alt=""
                width={10}
                height={10}
                className="shrink-0"
              />
            </span>
          </>
        )}
      </div>
      {loading ? (
        <div className="w-[200px] md:w-[290px] font-[470] h-[28px] md:h-[36px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-3 md:mt-4"></div>
      ) : (
        <div className="text-[36px] md:text-[56px] font-serif font-Medium font-[470] text-[#FCFCFC] text-center leading-tight">
          {value}
        </div>
      )}
    </div>
  )
}

const rankBadge: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-[rgba(255,46,84,0.10)]", text: "text-[#FF2E54]" },
  2: { bg: "bg-[rgba(255,136,0,0.10)]", text: "text-[#F80]" },
  3: { bg: "bg-[rgba(76,200,119,0.10)]", text: "text-[#4CC877]" },
}

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    const { bg, text } = rankBadge[rank]
    return (
      <span
        className={`px-2 md:px-3 py-1 text-right rounded-[12px] ${bg} ${text} inline-flex items-center gap-1 text-[10px] md:text-[12px]`}
      >
        <Image
          src={`/laurel-leafs-${rank}.svg`}
          alt=""
          width={12}
          height={12}
          className="shrink-0"
        />
        #{rank}
      </span>
    )
  }
  return (
    <span
      className={`px-2 md:px-3 py-1 rounded-[12px] inline-flex items-center gap-1 text-[10px] md:text-[12px]`}
    >
      #{rank}
    </span>
  )
}
