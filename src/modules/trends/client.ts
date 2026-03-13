import type { TrendQuery, TrendResult } from '@/modules/trends/types'
import { DEFAULT_TREND_LIMIT } from '@/modules/trends/catalog'

export interface TrendsResponse {
  success: boolean
  message?: string
  data?: TrendResult
}

export async function fetchTrendResult(query: Omit<TrendQuery, 'limit'> & { limit?: number }) {
  const searchParams = new URLSearchParams({
    source: query.source,
    period: query.period,
    limit: String(query.limit ?? DEFAULT_TREND_LIMIT),
  })

  if (query.language) {
    searchParams.set('language', query.language)
  }

  if (query.keyword) {
    searchParams.set('keyword', query.keyword)
  }

  const response = await fetch(`/api/trends?${searchParams.toString()}`, {
    cache: 'no-store',
  })

  const json = await response.json() as TrendsResponse

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || '热点数据加载失败')
  }

  return json.data
}
