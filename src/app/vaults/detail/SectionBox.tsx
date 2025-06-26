'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

export default function SectionBox({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-[12px] bg-[#0F151C] p-6', className)}>
      <h3 className="text-white font-semibold mb-4 flex items-center gap-1">
        {title}
        <span className="text-xs text-white/40">•</span>
      </h3>
      {children}
    </div>
  )
}