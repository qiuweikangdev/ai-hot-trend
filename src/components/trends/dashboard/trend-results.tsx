'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendItem, TrendResult } from '@/modules/trends/types'
import { ChevronDown } from 'lucide-react'
import { TrendCard } from '@/components/trends/trend-card'
import { Button } from '@/components/ui/button'
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {TREND_RESULT_SKELETON_KEYS.map(key => (
          <div
            key={key}
            className="h-[296px] animate-pulse rounded-[18px] border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-[#0b0f16]"
          />
        ))}
      </div>
    )
  }

  if (trendError) {
    return (
      <div className="rounded-[30px] border border-rose-200 bg-rose-50 px-4 py-8 text-rose-700 shadow-[0_24px_55px_-45px_rgba(244,63,94,0.25)] dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
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
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              当前展示缓存数据，
              {staleSourceLabel}
              接口暂时不可用。
            </div>
          )
        : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [content-visibility:auto]">
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

      {items.length
        ? (
            <div className="mt-8 flex justify-center sm:mt-10">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-slate-300/90 bg-white px-6 text-[13px] font-medium text-slate-700 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-white/12 dark:bg-[#0b0f16] dark:text-slate-200 dark:hover:border-white/22 dark:hover:bg-[#121722] dark:hover:text-white"
                aria-label="加载更多（即将上线）"
              >
                <ChevronDown className="size-3.5" strokeWidth={2} />
                查看更多
              </Button>
            </div>
          )
        : null}

      {!items.length
        ? (
            <div className="rounded-[30px] border border-white/90 bg-white/78 px-4 py-12 text-center text-slate-500 shadow-[0_24px_55px_-45px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/55 dark:border-white/10 dark:bg-[#0b0f16] dark:text-slate-400 dark:ring-white/10">
              当前筛选条件下暂无热点项目，请调整筛选后重试。
            </div>
          )
        : null}
    </>
  )
}
