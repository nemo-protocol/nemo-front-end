import React, { useState } from "react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import Image from "next/image"

// TODO： add Season Sans TRIAL front config

interface Tab {
  key: string
  label: string
  disabled?: boolean
}

interface TradeTabsProps {
  title: string
  tabs: Tab[]
  defaultTab?: string
  onChange?: (key: string) => void
  desc?: string
}

// TODO： disabled & active cursor style
export default function TradeTabs({
  title,
  tabs,
  defaultTab = tabs[0]?.key,
  onChange,
  desc,
}: TradeTabsProps) {
  const [current, setCurrent] = useState<string>(defaultTab)

  const handleTabChange = (key: string) => {
    setCurrent(key)
    onChange?.(key)
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* 左侧标题+info */}
      <div className="flex items-center gap-1">
        <div className="relative inline-block">
          <span
            className="
              text-center
              font-[470]
              text-[32px] leading-[100%] tracking-[-1.28px]
              font-['Season_Serif_TRIAL']
              text-[var(--typo-primary,#FCFCFC)]
            "
            style={{
              textShadow: "0px 0px 32px rgba(239, 244, 252, 0.56)",
            }}
          >
            {title}
          </span>
          {desc && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    width={20}
                    height={20}
                    alt="info"
                    src="/assets/images/info.svg"
                    className="absolute -top-1 -right-6 cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>{desc}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* 右侧 Tabs */}
      <div className="flex items-center gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            disabled={tab.disabled}
            className={`
              px-1.5 py-1 rounded-lg
              font-['Season_Sans_TRIAL']
              text-xs leading-none tracking-[0.12px]
              font-[650]
              uppercase
              transition
              cursor-pointer
              ${
                current === tab.key
                  ? "bg-[rgba(252,252,252,0.03)] text-[var(--typo-primary,#FCFCFC)]"
                  : "text-[var(--typo-secondary,rgba(252,252,252,0.40))]"
              }
              ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onClick={() => !tab.disabled && handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
