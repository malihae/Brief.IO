import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'BriefOS — Your AI daily briefing',
  description: 'One 60-second brief every morning. Know exactly what matters, what to decide, and what to prep.',
  openGraph: {
    title: 'BriefOS',
    description: 'AI briefing for busy professionals',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface-0 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
