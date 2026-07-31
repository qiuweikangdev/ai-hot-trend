import { TrendDashboardPage } from '@/components/trends/trend-dashboard-page'
import { DEFAULT_TREND_SOURCE } from '@/modules/trends/catalog'

export default function Home() {
  return <TrendDashboardPage source={DEFAULT_TREND_SOURCE} />
}
