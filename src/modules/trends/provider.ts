import type { TrendItem, TrendQuery, TrendSource } from '@/modules/trends/types'

export interface TrendProviderContext {
  now: Date
}

export interface TrendProvider {
  readonly source: TrendSource
  fetchTrends: (query: TrendQuery, context: TrendProviderContext) => Promise<TrendItem[]>
}
