"use client"
import React from "react"
import { cn, getIsMobile } from "@/lib/utils"
import InfoTooltip from "@/components/InfoTooltip"

export interface TabItem {
  id: string
  label: React.ReactNode
  onChange?: () => void
  active?: boolean
  icon?: React.ReactNode
  content?: React.ReactNode
  textSize?: string
}

interface TabProps {
  items: TabItem[]
  className?: string
}

export function Tab({ items, className }: TabProps) {
  const isMobile = getIsMobile()
  return (
    <div className={cn("flex items-center", className)}>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 relative">
          {item.content ? (
            <InfoTooltip active={item.active} content={item.content}>
              <button
                className={cn(
                  "font-normal font-serif",
                  item?.textSize ? item?.textSize : 'text-[32px]',
                  item.active
                    ? "text-white [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)]"
                    : "text-[rgba(255,255,255,0.20)]",
                  isMobile && "font-[470]"
                )}
                onClick={item.onChange}
              >
                {item.label}
              </button>
            </InfoTooltip>
          ) : (
            <button
              className={cn(
                "font-normal font-serif",
                item?.textSize ? item?.textSize : 'text-[32px]',
                item.active
                  ? "text-white [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)]"
                  : "text-light-gray/40",
                isMobile && "font-[470] px-2 py-1",
                isMobile && item.active && "border-b-[3px] border-b-[#4187D1]"
              )}
              onClick={item.onChange}
            >
              {item.label}
            </button>
          )}
          {item.icon && (
            <div className="absolute top-0 -right-5">{item.icon}</div>
          )}
        </div>
      ))}
    </div>
  )
}
