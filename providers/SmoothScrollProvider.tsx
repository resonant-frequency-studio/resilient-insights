'use client'

import { usePathname } from 'next/navigation'
import SmoothScroll from './SmoothScroll'

export default function SmoothScrollProvider() {
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio')

  // Don't apply smooth scroll to studio - it needs native scrolling
  if (isStudio) {
    return null
  }

  return <SmoothScroll />
}

