import { cookies } from 'next/headers'
import { TrendDashboard } from '@/components/trends/trend-dashboard'
import { getServerSessionSnapshot } from '@/server/auth/session'

export default async function Home() {
  const cookieStore = await cookies()
  const themeValue = cookieStore.get('trend-theme')?.value
  const isDarkTheme = themeValue === 'dark'
  const initialSession = await getServerSessionSnapshot()

  return <TrendDashboard initialSession={initialSession} initialIsDarkTheme={isDarkTheme} />
}
