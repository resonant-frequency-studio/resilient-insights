import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import SmoothScrollProvider from '@/providers/SmoothScrollProvider'
import ConditionalLayout from '@/components/ConditionalLayout'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Articles | Resilient Leadership',
    template: '%s | Resilient Leadership',
  },
  description:
    'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
  keywords: [
    'leadership',
    'resilience',
    'coaching',
    'executive coaching',
    'team coaching',
    'leadership development',
  ],
  authors: [{ name: 'Resilient Leadership' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Resilient Leadership',
    title: 'Articles | Resilient Leadership',
    description:
      'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | Resilient Leadership',
    description:
      'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`}>
      <body className={inter.className}>
        <SmoothScrollProvider />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
