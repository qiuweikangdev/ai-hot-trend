'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendItem, TrendResult } from '@/modules/trends/types'
import { TrendCard } from '@/components/trends/trend-card'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { buildFavoriteKey } from './utils'

const TREND_RESULT_SKELETON_KEYS = [
  'skeleton-1',
  'skeleton-2',
  'skeleton-3',
  'skeleton-4',
  'skeleton-5',
  'skeleton-6',
  'skeleton-7',
  'skeleton-8',
]

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
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {TREND_RESULT_SKELETON_KEYS.map(key => (
          <div
            key={key}
            className="h-[320px] animate-pulse rounded-[30px] border border-white/88 bg-gradient-to-b from-white/88 via-slate-50/76 to-slate-100/70 ring-1 ring-slate-200/50"
          />
        ))}
      </div>
    )
  }

  if (trendError) {
    return (
      <div className="rounded-[30px] border border-rose-200 bg-rose-50 px-4 py-8 text-rose-700 shadow-[0_24px_55px_-45px_rgba(244,63,94,0.25)]">
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
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              当前展示缓存数据，
              {staleSourceLabel}
              接口暂时不可用。
            </div>
          )
        : null}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4 [content-visibility:auto]">
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
            <div className="rounded-[30px] border border-white/90 bg-white/78 px-4 py-12 text-center text-slate-500 shadow-[0_24px_55px_-45px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/55">
              当前筛选条件下暂无热点项目，请调整筛选后重试。
            </div>
          )
        : null}
    </>
  )
}
