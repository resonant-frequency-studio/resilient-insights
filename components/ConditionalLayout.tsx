'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio')

  // For studio, render children directly without any wrapper
  if (isStudio) {
    return <>{children}</>
  }

  // For regular pages, include Header, Footer, and main wrapper
  return (
    <>
      <Header />
      <main className="min-h-screen bg-main pt-32 pb-16 md:py-32">
        {children}
      </main>
      <Footer />
    </>
  )
}
