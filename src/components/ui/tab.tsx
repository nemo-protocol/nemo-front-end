import React from "react"
import { cn } from "@/lib/utils"
import InfoTooltip from "@/components/InfoTooltip"

export interface TabItem {
  id: string
  label: React.ReactNode
  onChange?: () => void
  active?: boolean
  icon?: React.ReactNode
  desc?: string
}

interface TabProps {
  items: TabItem[]
  className?: string
}

export function Tab({ items, className }: TabProps) {
  return (
    <div className={cn("flex items-center gap-8", className)}>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 relative">
          {item.desc ? (
            <InfoTooltip active={item.active} content={item.desc}>
              <button
                className={cn(
                  "text-[32px] font-medium font-serif",
                  item.active ? "text-white" : "text-light-gray/40"
                )}
                onClick={item.onChange}
              >
                {item.label}
              </button>
            </InfoTooltip>
          ) : (
            <button
              className={cn(
                "text-[32px] font-medium font-serif",
                item.active ? "text-white" : "text-light-gray/40"
              )}
              onClick={item.onChange}
            >
              {item.label}
            </button>
          )}
          {item.icon && (
            <div className="absolute top-0 -right-4">{item.icon}</div>
          )}
        </div>
      ))}
    </div>
  )
}
