'use client'

import type { TrendPeriod, TrendResult, TrendSource } from '@/modules/trends/types'
import { useEffect, useState } from 'react'
import { fetchTrendResult } from '@/modules/trends/client'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

interface UseTrendFeedOptions {
  source: TrendSource
  period: TrendPeriod
  language: string
  keyword: string
  limit: number
  refreshTick: number
}

export function useTrendFeed({
  source,
  period,
  language,
  keyword,
  limit,
  refreshTick,
}: UseTrendFeedOptions) {
  const [trendData, setTrendData] = useState<TrendResult | null>(null)
  const [isTrendLoading, setIsTrendLoading] = useState(true)
  const [trendError, setTrendError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTrends() {
      setIsTrendLoading(true)
      setTrendError('')

      try {
        const data = await fetchTrendResult({
          source,
          period,
          language,
          keyword,
          limit,
        })

        if (!cancelled) {
          setTrendData(data)
        }
      }
      catch (error) {
        if (!cancelled) {
          setTrendError(getErrorMessage(error, '热点数据加载失败'))
        }
      }
      finally {
        if (!cancelled) {
          setIsTrendLoading(false)
        }
      }
    }

    loadTrends()

    return () => {
      cancelled = true
    }
  }, [keyword, language, limit, period, refreshTick, source])

  return {
    trendData,
    isTrendLoading,
    trendError,
  }
}
