import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { trendUiConfig } from '@/config/trends'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '热点趋势系统',
  description: '支持模块化扩展的热点趋势与收藏系统',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const themeValue = cookieStore.get('trend-theme')?.value
  const isDarkTheme = themeValue === 'dark'

  return (
    <html lang="zh-CN" className={isDarkTheme ? 'dark' : ''} style={{ colorScheme: isDarkTheme ? 'dark' : 'light' }} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster closeButton position="bottom-right" duration={trendUiConfig.noticeDurationMs} />
      </body>
    </html>
  )
}
