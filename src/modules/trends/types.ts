export const TREND_SOURCE_VALUES = ['github', 'npm', 'vue', 'react', 'node', 'ai'] as const

export type TrendSource = (typeof TREND_SOURCE_VALUES)[number]

export const TREND_PERIOD_VALUES = ['today', 'week', 'month'] as const

export type TrendPeriod = (typeof TREND_PERIOD_VALUES)[number]

export function isTrendSource(value: string): value is TrendSource {
  return TREND_SOURCE_VALUES.includes(value as TrendSource)
}

export function isTrendPeriod(value: string): value is TrendPeriod {
  return TREND_PERIOD_VALUES.includes(value as TrendPeriod)
}

export interface TrendQuery {
  source: TrendSource
  period: TrendPeriod
  language?: string
  keyword?: string
  limit: number
  offset: number
}

export interface TrendItem {
  id: string
  source: TrendSource
  rank: number
  title: string
  fullName: string
  owner: string
  description: string
  url: string
  ownerAvatarUrl: string
  language: string | null
  stars: number
  forks: number
  hotScore: number
  createdAt: string
  updatedAt: string
}

export interface TrendResult {
  source: TrendSource
  period: TrendPeriod
  language?: string
  keyword?: string
  fetchedAt: string
  stale: boolean
  items: TrendItem[]
}
