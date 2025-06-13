import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatTimeDiff } from "@/lib/utils"
import dayjs from "dayjs"
import Image from "next/image"

interface AmountOutputProps {
  name: string
  title?: string
  value?: string
  className?: string
  loading?: boolean
  maturity: string
  coinConfig?: {
    coinLogo?: string
    coinName?: string
  }
  coinNameComponent?: React.ReactNode
  warningDetail?: string
}

export const AmountOutput = ({
  name,
  value,
  maturity,
  className,
  coinConfig,
  loading = false,
  title = "RECEIVE",
  coinNameComponent,
  warningDetail,
}: AmountOutputProps) => {
  return (
    <div
      className={cn(
        "bg-[#FCFCFC]/[0.03] rounded-2xl shadow-lg px-6 py-6 w-full flex items-center justify-between min-h-[80px]",
        className
      )}
    >
      {/* 左侧：LP POSITION 和数值 */}
      <div className="flex flex-col justify-center">
        <span className="text-xs text-[#FCFCFC]/40 font-[600]">{title}</span>

        <span className="mt-2 text-xl font-medium text-white flex items-center gap-x-2">
          {loading ? (
            <Skeleton className="h-7  sm:h-8 w-36 sm:w-48 bg-[#FCFCFC]/[0.03]" />
          ) : (
            value ?? "--"
          )}
        </span>
        {warningDetail && (
          <div className="mt-1 text-xs text-yellow-400 break-words">{warningDetail}</div>
        )}
      </div>

      {/* 右侧：LP xSUI、图标和剩余天数 */}
      <div className="flex flex-col items-end justify-center gap-y-1">
        <div className="flex items-center gap-x-2">
          {coinNameComponent ? (
            coinNameComponent
          ) : (
            <span className="text-xl font-medium text-white">{name}</span>
          )}
          {coinConfig?.coinLogo && (
            <Image
              src={coinConfig.coinLogo}
              alt={coinConfig.coinName || ""}
              width={20}
              height={20}
            />
          )}
        </div>
        <span className="text-xs text-[#FCFCFC]/40 mt-1.5 flex items-center gap-x-1">
          <span>
            {`${formatTimeDiff(parseInt(maturity))} LEFT・ ${dayjs(
              parseInt(maturity)
            ).format("DD MMM YYYY")}`}
          </span>
          <Image
            src="/assets/images/date.svg"
            alt="date"
            width={12}
            height={12}
          />
        </span>
      </div>
    </div>
  )
}
