import React from "react"
import { cn, formatDecimalValue, isValidAmount } from "@/lib/utils"
import Decimal from "decimal.js"
import { Info, Wallet } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import Image from "next/image"

interface AmountInputProps {
  logo?: string
  name?: string
  price?: string
  error?: string
  title?: string
  amount: string
  warning?: string
  decimal?: number
  maturity?: string
  disabled?: boolean
  className?: string
  isLoading?: boolean
  errorDetail?: string
  coinBalance?: string
  isConnected?: boolean
  warningDetail?: string
  isConfigLoading?: boolean
  isBalanceLoading?: boolean
  onChange: (value: string) => void
  coinNameComponent?: React.ReactNode
  setWarning?: (value: string) => void
}

export default function AmountInput({
  name,
  logo,
  price,
  error,
  warning,
  amount,
  title,
  decimal = 0,
  isLoading,
  coinBalance,
  isConnected,
  coinNameComponent,
  isConfigLoading,
  isBalanceLoading,
  className,
  onChange,
  setWarning,
  disabled,
  errorDetail,
  warningDetail,
}: AmountInputProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "rounded-lg px-2 sm:px-4 py-3 sm:py-6 bg-[rgba(252,252,252,0.03)]",
          className
        )}
      >
        <div className="flex items-center justify-between h-auto sm:h-12">
          <div className="grow space-y-0.5 sm:space-y-1 ml-2 sm:ml-0">
            {title && (
              <span className="text-xs font-[600] text-light-gray/40">{title}</span>
            )}
            <input
              min={0}
              type="number"
              value={amount}
              placeholder={"0"}
              disabled={disabled}
              onChange={(e) => onChange && onChange(e.target.value)}
              onWheel={(e) =>
                e.target instanceof HTMLElement && e.target.blur()
              }
              className={cn(
                "bg-transparent outline-none min-w-0 placeholder:text-xl p-0 font-medium w-full shrink-0 placeholder:text-[rgba(252,252,252,0.40)] text-white",
                disabled && "cursor-not-allowed",
                amount.length <= 8
                  ? "text-xl"
                  : amount.length <= 10
                  ? "text-lg"
                  : amount.length <= 16
                  ? "text-base"
                  : "text-sm"
              )}
            />
            <div className="flex">
              {amount ? (
                isLoading ? (
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 bg-[rgba(252,252,252,0.10)]" />
                ) : (
                  <span
                    className="text-[10px] sm:text-xs text-[rgba(252,252,252,0.40)] max-w-20 truncate hover:cursor-pointer"
                    title={`${formatDecimalValue(
                      new Decimal(
                        isValidAmount(price ?? "0") ? price ?? "0" : 0
                      ).mul(amount),
                      6
                    )}`}
                  >
                    $
                    {formatDecimalValue(
                      new Decimal(
                        isValidAmount(price ?? "0") ? price ?? "0" : 0
                      ).mul(amount),
                      6
                    )}
                  </span>
                )
              ) : (
                <span className="text-xs text-light-gray/40">$0</span>
              )}
            </div>
          </div>

          <div className="flex items-center rounded-xl gap-x-1 sm:gap-x-2 shrink-0">
            <div className="flex items-center gap-x-2 sm:gap-x-4">
              <div className="flex flex-col items-end gap-y-1">
                <div className="h-5 sm:h-6 flex items-center justify-end gap-x-1 sm:gap-x-2">
                  {isConfigLoading ? (
                    <Skeleton className="h-full w-10 sm:w-12 bg-[#2D2D48]" />
                  ) : (
                    <div className="flex items-center gap-x-1 sm:gap-x-2">
                      {isConfigLoading ? (
                        <Skeleton className="size-8 sm:size-12 rounded-full bg-[#2D2D48]" />
                      ) : coinNameComponent ? (
                        coinNameComponent
                      ) : (
                        <div className="flex items-center gap-x-1">
                          <span>{name}</span>
                          <Image
                            src={logo ?? ""}
                            alt={name ?? ""}
                            className="size-5"
                            width={20}
                            height={20}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {/* {maturity && (
                    <span className="text-xs sm:text-sm text-light-gray/40">
                      {dayjs(parseInt(maturity)).format("DD MMM YYYY")}
                    </span>
                  )} */}
                </div>
                <div>
                  {isBalanceLoading || isConfigLoading ? (
                    <Skeleton className="bg-[rgba(252,252,252,0.10)]" />
                  ) : (
                    <button
                      title={`${formatDecimalValue(
                        coinBalance,
                        decimal
                      )} ${name}`}
                      disabled={disabled}
                      className={cn(
                        "flex items-center gap-x-1 text-xs sm:text-sm",
                        disabled
                          ? "cursor-not-allowed "
                          : " cursor-pointer hover:underline"
                      )}
                      onClick={() => {
                        if (isConnected && coinBalance) {
                          let adjustedBalance = new Decimal(coinBalance)
                          // TODO: better way to handle this
                          if (name === "SUI") {
                            if (adjustedBalance.lt(0.1) && setWarning) {
                              setWarning(
                                "Insufficient SUI for gas fee. Minimum required: 0.1 SUI"
                              )
                              return
                            }
                            adjustedBalance = adjustedBalance.minus(0.1)
                          }
                          onChange(formatDecimalValue(adjustedBalance, decimal))
                        }
                      }}
                    >
                      <Wallet className="size-3 sm:size-3.5" />
                      {isConnected ? (
                        <span className="truncate text-left text-[rgba(252,252,252,0.40)]">
                          {`${formatDecimalValue(
                            coinBalance,
                            decimal
                          )} ${name}`}
                        </span>
                      ) : (
                        "0"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="space-x-1 mt-1 sm:mt-2">
          <span className="text-xs sm:text-sm text-red-500 break-words">
            {error}
          </span>
          {errorDetail && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 sm:size-3.5 text-red-500" />
                </TooltipTrigger>
                <TooltipContent className="bg-[#0E0F16] text-[rgba(252,252,252,0.40)] text-xs sm:text-sm w-[280px] sm:w-[500px]">
                  <p>{errorDetail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      {warning && (
        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-yellow-500 break-words flex items-center gap-x-1">
          {warning}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-3 sm:size-3.5 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent className="bg-[#0E0F16] text-[rgba(252,252,252,0.40)] text-xs sm:text-sm w-[280px] sm:w-[500px]">
                <p>{warningDetail}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
