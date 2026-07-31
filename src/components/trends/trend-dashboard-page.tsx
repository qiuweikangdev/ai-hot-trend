import type { TrendQuery, TrendSource } from '@/modules/trends/types'
import { cookies } from 'next/headers'
import { trendUiConfig } from '@/config/trends'
import { DEFAULT_TREND_PERIOD } from '@/modules/trends/catalog'
import { queryTrendItems } from '@/modules/trends/service'
import { getServerSessionSnapshot } from '@/server/auth/session'
import { TrendDashboard } from './trend-dashboard'

interface TrendDashboardPageProps {
  source: TrendSource
}

export async function TrendDashboardPage({ source }: TrendDashboardPageProps) {
  const initialTrendQuery: TrendQuery = {
    source,
    period: DEFAULT_TREND_PERIOD,
    limit: trendUiConfig.trendLimit,
    offset: 0,
  }

  const [cookieStore, initialSession, initialTrendData] = await Promise.all([
    cookies(),
    getServerSessionSnapshot(),
    queryTrendItems(initialTrendQuery),
  ])
  const isDarkTheme = cookieStore.get('trend-theme')?.value === 'dark'

  return (
    <TrendDashboard
      initialSession={initialSession}
      initialIsDarkTheme={isDarkTheme}
      initialSource={source}
      initialTrendData={initialTrendData}
    />
  )
}
