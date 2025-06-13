import dayjs from "dayjs"
import Image from "next/image"
import { cn, formatTimeDiff } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface AmountOutputProps {
  name: string
  logo?: string
  title?: string
  value?: string
  maturity: string
  loading?: boolean
  className?: string
  warningDetail?: string
  coinNameComponent?: React.ReactNode
}

export const AmountOutput = ({
  name,
  logo,
  value,
  maturity,
  className,
  loading = false,
  title = "RECEIVE",
  coinNameComponent,
  warningDetail,
}: AmountOutputProps) => {
  return (
    <div
      className={cn(
        "bg-[rgba(252,252,252,0.03)] rounded-2xl shadow-lg px-6 py-6 w-full flex items-center justify-between min-h-[80px]",
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
          <div className="mt-1 text-xs text-yellow-400 break-words">
            {warningDetail}
          </div>
        )}
      </div>

      {/* 右侧：LP xSUI、图标和剩余天数 */}
      <div className="flex flex-col items-end justify-center gap-y-1">
        <div className="flex items-center gap-x-2">
          {coinNameComponent ? (
            coinNameComponent
          ) : (
            <div className="flex items-center gap-x-1">
              <span className="text-xl text-white">{name}</span>
              {logo && <Image src={logo} alt={name} width={20} height={20} />}
            </div>
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
