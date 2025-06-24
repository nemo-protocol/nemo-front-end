// components/ui/BackButton.tsx
'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

export interface BackButtonProps {
  label?: string
  className?: string
  onClick?: () => void
}

export default function BackButton({
  label = 'Back',
  className,
  onClick,
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    onClick?.()
    router.back()         
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'text-light-gray bg-gradient-to-r from-white/5 to-white/0 transition cursor-pointer inline-flex p-1 px-2.5 rounded-2xl gap-2 text-sm items-center',
        'hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5',
        className,
      )}
    >
      <ArrowLeft width={16} />
      <span>{label}</span>
    </button>
  )
}