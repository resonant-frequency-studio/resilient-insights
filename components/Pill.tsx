import React from 'react'
import { cn } from '@/lib/utils'

export interface PillProps {
  children: React.ReactNode
  className?: string
}

export default function Pill({ children, className }: PillProps) {
  return (
    <div
      className={cn(
        'inline-flex px-4 py-1.5 rounded-full w-fit',
        'bg-tags-pills text-foreground-dark',
        'text-sm font-medium uppercase tracking-wider leading-none',
        className
      )}
    >
      {children}
    </div>
  )
}
