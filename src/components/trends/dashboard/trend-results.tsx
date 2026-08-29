'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendItem, TrendResult } from '@/modules/trends/types'
import { ArrowDown, LoaderCircle } from 'lucide-react'
import { TrendCard } from '@/components/trends/trend-card'
import { Button } from '@/components/ui/button'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { buildFavoriteKey } from './utils'

const TREND_RESULT_SKELETON_KEYS = Array.from({ length: 9 }, (_, index) => `skeleton-${index + 1}`)

interface TrendResultsProps {
  uiScale: TrendUiScale
  trendData: TrendResult | null
  isTrendLoading: boolean
  trendError: string
  isLoadingMore: boolean
  hasMore: boolean
  favoriteBusyKey: string
  favoriteKeySet: Set<string>
  onToggleFavorite: (item: TrendItem) => void
  onCopyTrend: (item: TrendItem) => void
  onLoadMore: () => void
}

export function TrendResults({
  uiScale,
  trendData,
  isTrendLoading,
  trendError,
  isLoadingMore,
  hasMore,
  favoriteBusyKey,
  favoriteKeySet,
  onToggleFavorite,
  onCopyTrend,
  onLoadMore,
}: TrendResultsProps) {
  if (isTrendLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TREND_RESULT_SKELETON_KEYS.map(key => (
          <div key={key} className="h-56 animate-pulse rounded-xl border border-border bg-muted/70" />
        ))}
      </div>
    )
  }

  if (trendError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {trendError}
      </div>
    )
  }

  const items = trendData?.items ?? []
  const staleSourceLabel = trendData ? getTrendSourceMeta(trendData.source).label : '当前来源'

  return (
    <>
      {trendData?.stale
        ? (
            <div className="mb-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              数据可能已过期 ·
              {' '}
              {staleSourceLabel}
            </div>
          )
        : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [content-visibility:auto]">
        {items.map(item => (
          <TrendCard
            key={item.id}
            item={item}
            size={uiScale.cardSize}
            isFavorite={favoriteKeySet.has(buildFavoriteKey(item.source, item.id))}
            favoriteDisabled={favoriteBusyKey === buildFavoriteKey(item.source, item.id)}
            onToggleFavorite={onToggleFavorite}
            onCopyTrend={onCopyTrend}
          />
        ))}
      </div>

      {items.length > 0 && hasMore
        ? (
            <div className="mt-6 flex items-center gap-3 sm:mt-8">
              <span className="h-px flex-1 bg-border/70" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                className="size-9 shrink-0 rounded-lg border-border bg-background text-muted-foreground shadow-none hover:border-foreground/20 hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="加载更多"
                title="加载更多"
              >
                {isLoadingMore
                  ? <LoaderCircle className="size-4 animate-spin" strokeWidth={1.75} />
                  : <ArrowDown className="size-4" strokeWidth={1.75} />}
              </Button>
              <span className="h-px flex-1 bg-border/70" />
            </div>
          )
        : null}

      {items.length === 0
        ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              暂无结果
            </div>
          )
        : null}
    </>
  )
}
