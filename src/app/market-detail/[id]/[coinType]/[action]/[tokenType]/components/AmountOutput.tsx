import dayjs from "dayjs"
import Image from "next/image"
import {
  cn,
  formatDecimalValue,
  formatTimeDiff,
  isValidAmount,
} from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import Decimal from "decimal.js"

interface AmountOutputProps {
  name: string
  logo?: string
  title?: string
  price?: string
  amount?: string
  maturity: string
  loading?: boolean
  className?: string
  warningDetail?: string
  coinNameComponent?: React.ReactNode
}

export const AmountOutput = ({
  name,
  logo,
  amount,
  maturity,
  className,
  price = "0",
  warningDetail,
  loading = false,
  title = "RECEIVE",
  coinNameComponent,
}: AmountOutputProps) => {
  return (
    <div
      className={cn(
        "bg-light-gray/[0.03] rounded-2xl shadow-lg px-2 sm:px-4 py-3 sm:py-4.5 w-full flex items-center justify-between min-h-[80px]",
        className
      )}
    >
      {/* 左侧：LP POSITION 和数值 */}
      <div className="flex flex-col justify-center gap-y-1.5">
        <span className="text-xs text-[#FCFCFC]/40 font-[600]">{title}</span>
        <span className="text-xl font-medium text-white flex items-center gap-x-2">
          {loading ? (
            <Skeleton className="h-7 sm:h-8 w-36 sm:w-48 bg-[#FCFCFC]/[0.03]" />
          ) : (
            <span className={`${amount ? "text-white" : "text-light-gray/40"}`}>
              {amount || "0"}
            </span>
          )}
        </span>
        {loading ? (
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 bg-[rgba(252,252,252,0.10)]" />
        ) : amount ? (
          <span
            className="text-[10px] sm:text-xs text-[rgba(252,252,252,0.40)] max-w-20 truncate hover:cursor-pointer"
            title={`${formatDecimalValue(
              new Decimal(isValidAmount(price) ? price ?? "0" : 0).mul(amount),
              6
            )}`}
          >
            $
            {isValidAmount(price) && isValidAmount(amount)
              ? formatDecimalValue(new Decimal(price).mul(amount), 6)
              : "0"}
          </span>
        ) : (
          <span className="text-xs text-light-gray/40">$0</span>
        )}{" "}
        {warningDetail && (
          <div className="text-xs text-yellow-400 break-words">
            {warningDetail}
          </div>
        )}
      </div>

      {/* 右侧：LP xSUI、图标和剩余天数 */}
      <div className="flex flex-col items-end justify-center gap-y-1.5">
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
        <span className="text-xs text-[#FCFCFC]/40 flex items-center gap-x-1">
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
