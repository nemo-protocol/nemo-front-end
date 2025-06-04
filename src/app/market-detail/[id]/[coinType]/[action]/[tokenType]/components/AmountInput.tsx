import React from "react"
import { cn, formatDecimalValue, isValidAmount } from "@/lib/utils"
import Decimal from "decimal.js"
import { Info, Wallet } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import dayjs from "dayjs"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import Image from "next/image"

interface AmountInputProps {
  price?: string
  error?: string
  warning?: string
  amount: string
  decimal?: number
  coinName?: string
  coinLogo?: string
  className?: string
  isLoading?: boolean
  coinBalance?: string
  isConnected?: boolean
  isConfigLoading?: boolean
  isBalanceLoading?: boolean
  onChange: (value: string) => void
  setWarning: (value: string) => void
  coinNameComponent?: React.ReactNode
  disabled?: boolean
  maturity?: string
  errorDetail?: string
  warningDetail?: string
}

export default function AmountInput({
  price,
  error,
  warning,
  amount,
  decimal = 0,
  coinName,
  coinLogo,
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
  maturity,
  errorDetail,
  warningDetail,
}: AmountInputProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "rounded-lg px-2 sm:px-3 py-3 sm:py-4 bg-[rgba(252,252,252,0.03)]",
          className
        )}
      >
        <div className="flex items-center justify-between h-auto sm:h-12">
          <div className="grow space-y-0.5 sm:space-y-1 ml-2 sm:ml-0">
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
              <div className="space-y-0.5 sm:space-y-1">
                <div className="h-5 sm:h-6 flex items-center justify-end gap-x-1 sm:gap-x-2">
                  {isConfigLoading ? (
                    <Skeleton className="h-full w-10 sm:w-12 bg-[#2D2D48]" />
                  ) : (
                    <div className="flex items-center gap-x-1 sm:gap-x-2">
                      {coinNameComponent}
                      {isConfigLoading ? (
                        <Skeleton className="size-8 sm:size-12 rounded-full bg-[#2D2D48]" />
                      ) : (
                        <Image
                          src={coinLogo ?? ""}
                          alt={coinName ?? ""}
                          className="size-5"
                          width={20}
                          height={20}
                        />
                      )}
                    </div>
                  )}
                  {maturity && (
                    <span className="text-xs sm:text-sm text-light-gray/40">
                      {dayjs(parseInt(maturity)).format("DD MMM YYYY")}
                    </span>
                  )}
                </div>
                <div>
                  {isBalanceLoading || isConfigLoading ? (
                    <Skeleton className="bg-[rgba(252,252,252,0.10)]" />
                  ) : (
                    <button
                      title={`${formatDecimalValue(
                        coinBalance,
                        decimal
                      )} ${coinName}`}
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
                          if (coinName === "SUI") {
                            if (adjustedBalance.lt(0.1)) {
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
                          )} ${coinName}`}
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
