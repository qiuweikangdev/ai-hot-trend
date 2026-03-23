import { cookies } from 'next/headers'
import { TrendDashboard } from '@/components/trends/trend-dashboard'
import { DEFAULT_TREND_SOURCE } from '@/modules/trends/catalog'
import { getServerSessionSnapshot } from '@/server/auth/session'

export default async function Home() {
  const cookieStore = await cookies()
  const themeValue = cookieStore.get('trend-theme')?.value
  const isDarkTheme = themeValue === 'dark'
  const initialSession = await getServerSessionSnapshot()

  return <TrendDashboard initialSession={initialSession} initialIsDarkTheme={isDarkTheme} initialSource={DEFAULT_TREND_SOURCE} />
}
