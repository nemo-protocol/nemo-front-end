'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface MetricCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  className?: string
}

export default function MetricCard({
  label,
  value,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        'flex flex-col justify-center gap-1 items-center rounded-[12px] bg-[rgba(252,252,252,0.03)] h-[78px] px-6',
        className,
      )}
    >
      <span className="text-[20px] text-white font-[470] flex items-center gap-1">
        {value} 
      </span>
      <span className="text-[14px] text-[rgba(252,252,252,0.50)]">{label}</span>
    </div>
  )
}