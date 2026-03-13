'use client'

import type { TrendCardSize } from '@/config/trends'
import type { TrendItem } from '@/modules/trends/types'
import { Copy, ExternalLink, GitFork, Heart, Languages, Star } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { TREND_CARD_CLASS_MAP } from '@/config/trends'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta } from '@/modules/trends/catalog'

function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`
  }

  return String(value)
}

interface TrendCardProps {
  item: TrendItem
  isFavorite: boolean
  size: TrendCardSize
  favoriteDisabled?: boolean
  onToggleFavorite: (item: TrendItem) => void
  onCopyName: (item: TrendItem) => void
}

export function TrendCard({
  item,
  isFavorite,
  size,
  favoriteDisabled,
  onToggleFavorite,
  onCopyName,
}: TrendCardProps) {
  const scale = TREND_CARD_CLASS_MAP[size]
  const sourceMeta = getTrendSourceMeta(item.source)

  return (
    <article className={cn('group rounded-3xl border border-slate-200/90 bg-white/80 shadow-[0_8px_32px_-24px_rgba(35,63,112,0.6)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-28px_rgba(35,63,112,0.45)]', scale.root)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full border border-amber-300 bg-amber-50 font-semibold text-amber-700', scale.topBadge)}>
            TOP
            {' '}
            {item.rank}
          </span>
          <span className={cn('rounded-full border border-slate-200 bg-slate-50 text-slate-600', scale.sourceBadge)}>
            {sourceMeta.label}
          </span>
        </div>
        <Image
          src={item.ownerAvatarUrl}
          alt={item.owner}
          width={44}
          height={44}
          className="size-11 rounded-full border border-white bg-slate-100 object-cover shadow"
          loading="lazy"
        />
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className={cn('line-clamp-1 font-semibold tracking-tight text-slate-900', scale.title)}>{item.title}</h3>
        <p className={cn('line-clamp-1 text-slate-500', scale.fullName)}>{item.fullName}</p>
        <p className={cn('line-clamp-2 text-slate-600', scale.description)}>{item.description}</p>
      </div>

      <div className={cn('flex flex-wrap items-center gap-2', scale.metricWrap)}>
        <span className={cn('inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 font-medium text-amber-700', scale.metricItem)}>
          <Star className="size-3.5" />
          Star
          {' '}
          {formatCount(item.stars)}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full border border-cyan-300/80 bg-cyan-50 font-medium text-cyan-700', scale.metricItem)}>
          <GitFork className="size-3.5" />
          Fork
          {' '}
          {formatCount(item.forks)}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 font-medium text-emerald-700', scale.metricItem)}>
          <Languages className="size-3.5" />
          语言
          {' '}
          {item.language ?? 'Unknown'}
        </span>
      </div>

      <div className={cn('flex items-center justify-end gap-2', scale.actionWrap)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'rounded-xl border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600',
            isFavorite && 'border-rose-200 bg-rose-50 text-rose-600',
          )}
          onClick={() => onToggleFavorite(item)}
          disabled={favoriteDisabled}
          aria-label={isFavorite ? '取消收藏' : '收藏项目'}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => onCopyName(item)}
          aria-label="复制仓库名"
        >
          <Copy className="size-4" />
        </Button>
        <Button asChild variant="outline" size="icon" className="rounded-xl border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
          <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开详情">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </article>
  )
}
