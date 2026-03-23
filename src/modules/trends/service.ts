import type { TrendQuery, TrendResult, TrendSource } from '@/modules/trends/types'
import { MemoryCache } from '@/modules/trends/cache'
import { bootstrapTrendProviders } from '@/modules/trends/providers'
import { getTrendProvider } from '@/modules/trends/registry'

const trendCache = new MemoryCache<TrendResult>(5 * 60 * 1000)

const TREND_CACHE_VERSION_MAP: Record<TrendSource, string> = {
  github: 'v1',
  npm: 'v4',
  vue: 'v1',
  react: 'v1',
  node: 'v1',
  ai: 'v1',
  component: 'v1',
  zhihu: 'v1',
  juejin: 'v1',
  v2ex: 'v1',
}

function buildTrendCacheKey(query: TrendQuery) {
  return [
    TREND_CACHE_VERSION_MAP[query.source],
    query.source,
    query.period,
    query.language || '',
    query.keyword || '',
    String(query.limit),
    String(query.offset),
  ].join(':')
}

export async function queryTrendItems(query: TrendQuery): Promise<TrendResult> {
  bootstrapTrendProviders()

  const key = buildTrendCacheKey(query)
  const cached = trendCache.get(key)

  if (cached) {
    return cached
  }

  const provider = getTrendProvider(query.source)

  if (!provider) {
    throw new Error(`未找到热点源: ${query.source}`)
  }

  try {
    const items = await provider.fetchTrends(query, {
      now: new Date(),
    })

    const result: TrendResult = {
      source: query.source,
      period: query.period,
      language: query.language,
      keyword: query.keyword,
      fetchedAt: new Date().toISOString(),
      stale: false,
      items,
    }

    trendCache.set(key, result)
    return result
  }
  catch (error) {
    const stale = trendCache.getStale(key)

    if (stale) {
      return {
        ...stale,
        stale: true,
      }
    }

    throw error
  }
}
