'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
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
      <main className="min-h-screen bg-main pt-36 pb-20">
        {children}
      </main>
      <Footer />
    </>
  )
}

