import Image from "next/image"
import Decimal from "decimal.js"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, isValidAmount, formatDecimalValue } from "@/lib/utils"

interface AmountOutputProps {
  name: string
  unit?: string
  logo?: string
  title?: string
  price?: string
  amount?: string
  balance?: string
  loading?: boolean
  className?: string
  warningDetail?: string
  coinNameComponent?: React.ReactNode
}

export const AmountOutput = ({
  name,
  logo,
  unit,
  className,
  price = "0",
  amount = "0",
  balance = "0",
  warningDetail,
  loading = false,
  title = "RECEIVE",
  coinNameComponent,
}: AmountOutputProps) => {
  price = isValidAmount(price) ? price : "0"
  amount = isValidAmount(amount) ? amount : "0"
  balance = isValidAmount(balance) ? balance : "0"

  return (
    <div
      className={cn(
        "bg-light-gray/[0.03] rounded-2xl shadow-lg px-2 sm:px-4 py-3 sm:py-4.5 w-full min-h-[80px]",
        className
      )}
    >
      <div className="flex flex-col space-y-2 sm:space-y-3">
        {/* First row: Title */}
        <div className="flex items-center">
          <span className="text-xs text-[#FCFCFC]/40 font-[600]">{title}</span>
        </div>

        {/* Second row: Amount and Name/Logo */}
        <div className="flex items-center justify-between">
          <div className="grow">
            <span className="text-xl font-medium text-white flex items-center gap-x-2">
              {loading ? (
                <Skeleton className="h-7 w-36 sm:w-48 bg-[#FCFCFC]/[0.03]" />
              ) : (
                <span
                  className={`${amount ? "text-white" : "text-light-gray/40"}`}
                >
                  {amount || "0"}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-x-1 sm:gap-x-2 shrink-0">
            {coinNameComponent ? (
              coinNameComponent
            ) : (
              <div className="flex items-center gap-x-1">
                <span className="text-xl text-white">{name}</span>
                {logo && <Image src={logo} alt={name} width={20} height={20} />}
              </div>
            )}
          </div>
        </div>

        {/* Third row: Dollar value and Maturity */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            {loading ? (
              <Skeleton className="h-3 w-16 sm:w-20 bg-[rgba(252,252,252,0.10)]" />
            ) : amount ? (
              <span
                className="text-[10px] sm:text-xs text-[rgba(252,252,252,0.40)] max-w-20 truncate hover:cursor-pointer"
                title={`${formatDecimalValue(
                  new Decimal(isValidAmount(price) ? price ?? "0" : 0).mul(
                    amount
                  ),
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
            )}
            {warningDetail && (
              <div className="text-xs text-yellow-400 break-words">
                {warningDetail}
              </div>
            )}
          </div>

          <div className="flex items-center gap-x-1 shrink-0">
            <span className="text-xs text-[#FCFCFC]/40 flex items-center gap-x-1">
              <span>{`${balance}`}</span>
              {unit && <span>{unit}</span>}
              <Image
                src="/assets/images/wallet.svg"
                alt="Balance"
                width={12}
                height={12}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
