'use client'

import type { TrendPeriod, TrendResult, TrendSource } from '@/modules/trends/types'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  initialTrendData?: TrendResult
}

type TrendFeedRequest = Omit<UseTrendFeedOptions, 'initialTrendData'>

function isTrendResultForRequest(data: TrendResult, request: TrendFeedRequest) {
  return data.source === request.source
    && data.period === request.period
    && (data.language ?? '') === request.language
    && (data.keyword ?? '') === request.keyword
}

export function shouldRequestTrendFeed(
  currentRequest: TrendFeedRequest,
  previousRequest: TrendFeedRequest | null,
) {
  if (!previousRequest) {
    return true
  }

  return currentRequest.source !== previousRequest.source
    || currentRequest.period !== previousRequest.period
    || currentRequest.language !== previousRequest.language
    || currentRequest.keyword !== previousRequest.keyword
    || currentRequest.limit !== previousRequest.limit
    || currentRequest.refreshTick !== previousRequest.refreshTick
}

export function useTrendFeed({
  source,
  period,
  language,
  keyword,
  limit,
  refreshTick,
  initialTrendData,
}: UseTrendFeedOptions) {
  const initialRequest = { source, period, language, keyword, limit, refreshTick }
  const matchingInitialTrendData = initialTrendData && isTrendResultForRequest(initialTrendData, initialRequest)
    ? initialTrendData
    : null
  const [trendData, setTrendData] = useState<TrendResult | null>(matchingInitialTrendData)
  const [isTrendLoading, setIsTrendLoading] = useState(!matchingInitialTrendData)
  const [trendError, setTrendError] = useState('')
  const [offset, setOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const paramsRef = useRef({ source, period, language, keyword, limit })

  const previousRequestRef = useRef<TrendFeedRequest | null>(
    matchingInitialTrendData ? initialRequest : null,
  )
  useEffect(() => {
    paramsRef.current = { source, period, language, keyword, limit }
  }, [source, period, language, keyword, limit])

  const fetchTrends = useCallback(async (fetchOffset: number, isLoadMore = false) => {
    const { source: src, period: prd, language: lng, keyword: kw, limit: lmt } = paramsRef.current

    if (isLoadMore) {
      setIsLoadingMore(true)
    }
    else {
      setIsTrendLoading(true)
    }
    setTrendError('')

    try {
      const data = await fetchTrendResult({
        source: src,
        period: prd,
        language: lng,
        keyword: kw,
        limit: lmt,
        offset: fetchOffset,
      })

      if (!data.items.length) {
        setHasMore(false)
      }

      setTrendData((prev) => {
        if (isLoadMore && prev) {
          const existingIds = new Set(prev.items.map(item => item.id))
          const newItems = data.items.filter(item => !existingIds.has(item.id))
          const mergedItems = [...prev.items, ...newItems]
          if (!newItems.length && data.items.length > 0) {
            setHasMore(false)
          }
          return {
            ...data,
            items: mergedItems,
          }
        }
        return data
      })
    }
    catch (error) {
      setTrendError(getErrorMessage(error, '热点数据加载失败'))
    }
    finally {
      if (isLoadMore) {
        setIsLoadingMore(false)
      }
      else {
        setIsTrendLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    const currentRequest = { source, period, language, keyword, limit, refreshTick }

    if (!shouldRequestTrendFeed(currentRequest, previousRequestRef.current)) {
      return
    }

    previousRequestRef.current = currentRequest
    fetchTrends(0)
  }, [keyword, language, limit, period, refreshTick, source, fetchTrends])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return
    }

    const newOffset = offset + limit
    setOffset(newOffset)
    await fetchTrends(newOffset, true)
  }, [fetchTrends, hasMore, isLoadingMore, limit, offset])

  return {
    trendData,
    isTrendLoading,
    trendError,
    isLoadingMore,
    hasMore,
    loadMore,
  }
}
