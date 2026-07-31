import { notFound } from 'next/navigation'
import { TrendDashboardPage } from '@/components/trends/trend-dashboard-page'
import { isTrendSource } from '@/modules/trends/types'

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

  return <TrendDashboardPage source={source} />
}
