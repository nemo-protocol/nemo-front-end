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
        'flex flex-col justify-center rounded-[12px] bg-[#0F151C] h-[72px] px-6',
        className,
      )}
    >
      <span className="text-[14px] text-white font-semibold flex items-center gap-1">
        {value} {icon}
      </span>
      <span className="text-[11px] text-white/60">{label}</span>
    </div>
  )
}