import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { TrendDashboard } from '@/components/trends/trend-dashboard'
import { isTrendSource } from '@/modules/trends/types'
import { getServerSessionSnapshot } from '@/server/auth/session'

interface SourcePageProps {
  params: Promise<{
    source: string
  }>
}

export default async function SourcePage({ params }: SourcePageProps) {
  const { source } = await params

  if (!isTrendSource(source)) {
    notFound()
  }

  const cookieStore = await cookies()
  const themeValue = cookieStore.get('trend-theme')?.value
  const isDarkTheme = themeValue === 'dark'
  const initialSession = await getServerSessionSnapshot()

  return <TrendDashboard initialSession={initialSession} initialIsDarkTheme={isDarkTheme} initialSource={source} />
}
