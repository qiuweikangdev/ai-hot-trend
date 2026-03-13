'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendItem, TrendResult } from '@/modules/trends/types'
import { Loader2 } from 'lucide-react'
import { TrendCard } from '@/components/trends/trend-card'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { buildFavoriteKey } from './utils'

interface TrendResultsProps {
  uiScale: TrendUiScale
  trendData: TrendResult | null
  isTrendLoading: boolean
  trendError: string
  favoriteBusyKey: string
  favoriteKeySet: Set<string>
  onToggleFavorite: (item: TrendItem) => void
  onCopyName: (item: TrendItem) => void
}

export function TrendResults({
  uiScale,
  trendData,
  isTrendLoading,
  trendError,
  favoriteBusyKey,
  favoriteKeySet,
  onToggleFavorite,
  onCopyName,
}: TrendResultsProps) {
  if (isTrendLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-white/80 bg-white/70 px-4 py-20 text-sm text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        正在加载热点趋势...
      </div>
    )
  }

  if (trendError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-8 text-rose-700">
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
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              当前展示缓存数据，
              {staleSourceLabel}
              接口暂时不可用。
            </div>
          )
        : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map(item => (
          <TrendCard
            key={item.id}
            item={item}
            size={uiScale.cardSize}
            isFavorite={favoriteKeySet.has(buildFavoriteKey(item.source, item.id))}
            favoriteDisabled={favoriteBusyKey === buildFavoriteKey(item.source, item.id)}
            onToggleFavorite={onToggleFavorite}
            onCopyName={onCopyName}
          />
        ))}
      </div>

      {!items.length
        ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-10 text-center text-slate-500">
              当前筛选条件下暂无热点项目，请调整筛选后重试。
            </div>
          )
        : null}
    </>
  )
}
