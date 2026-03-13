import { TrendDashboard } from '@/components/trends/trend-dashboard'
import { getServerSessionSnapshot } from '@/server/auth/session'

export default async function Home() {
  const initialSession = await getServerSessionSnapshot()

  return <TrendDashboard initialSession={initialSession} />
}
