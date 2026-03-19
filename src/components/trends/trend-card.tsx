'use client'

import type { ComponentType } from 'react'
import type { TrendCardSize } from '@/config/trends'
import type { TrendItem } from '@/modules/trends/types'
import { CalendarDays, Copy, ExternalLink, GitFork, Heart, Star } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { TREND_CARD_CLASS_MAP } from '@/config/trends'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { formatCompactCount, formatTrendDate } from '@/modules/trends/presenters'

interface TrendMetricItemProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  className: string
  sizeClassName: string
}

function TrendMetricItem({
  icon: Icon,
  label,
  value,
  className,
  sizeClassName,
}: TrendMetricItemProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium', className, sizeClassName)}>
      <Icon className="size-3.5" />
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
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
    <article className={cn('group flex h-full min-h-[340px] flex-col rounded-[30px] border border-white/88 bg-white/84 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/58 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-34px_rgba(30,64,175,0.28)]', scale.root)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full border border-amber-300/80 bg-amber-50/90 font-semibold text-amber-700', scale.topBadge)}>
            TOP
            {' '}
            {item.rank}
          </span>
          <span className={cn('rounded-full border border-slate-200/80 bg-white/84 text-slate-600', scale.sourceBadge)}>
            {sourceMeta.label}
          </span>
        </div>
        <Image
          src={item.ownerAvatarUrl}
          alt={item.owner}
          width={44}
          height={44}
          className="size-11 rounded-full border border-white bg-slate-100 object-cover shadow-[0_10px_24px_-18px_rgba(15,23,42,0.55)]"
          loading="lazy"
        />
      </div>

      <div className="mt-3.5 space-y-2">
        <h3 className={cn('line-clamp-1 font-semibold tracking-tight text-slate-900', scale.title)}>{item.title}</h3>
        <p className={cn('line-clamp-1 text-slate-500', scale.fullName)}>{item.fullName}</p>
        <p className={cn('line-clamp-4 text-slate-600', scale.description)}>{item.description}</p>
      </div>

      <div className={cn('flex flex-wrap items-center gap-2', scale.metricWrap)}>
        <TrendMetricItem
          icon={Star}
          label="总 Star"
          value={formatCompactCount(item.stars)}
          className="border-amber-200/80 bg-amber-50/70 text-amber-700"
          sizeClassName={scale.metricItem}
        />
        <TrendMetricItem
          icon={GitFork}
          label="Fork"
          value={formatCompactCount(item.forks)}
          className="border-cyan-200/80 bg-cyan-50/70 text-cyan-700"
          sizeClassName={scale.metricItem}
        />
        <TrendMetricItem
          icon={CalendarDays}
          label="创建于"
          value={formatTrendDate(item.createdAt)}
          className="border-emerald-200/80 bg-emerald-50/70 text-emerald-700"
          sizeClassName={scale.metricItem}
        />
      </div>

      <div className={cn('mt-auto flex items-center justify-end border-t border-slate-100/85 md:justify-between', scale.actionWrap)}>
        <div className="hidden min-w-0 pr-3 md:block">
          <p className="truncate text-sm font-medium text-slate-700">{item.owner}</p>
          <p className="mt-1 text-xs text-slate-400">
            {item.language ?? 'Unknown'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'size-11 rounded-[16px] border-slate-200/90 bg-white/92 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:size-10 sm:rounded-2xl',
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
            className="size-11 rounded-[16px] border-slate-200/90 bg-white/92 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:size-10 sm:rounded-2xl"
            onClick={() => onCopyName(item)}
            aria-label="复制仓库名"
          >
            <Copy className="size-4" />
          </Button>
          <Button asChild variant="outline" size="icon" className="size-11 rounded-[16px] border-slate-200/90 bg-white/92 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 sm:size-10 sm:rounded-2xl">
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开详情">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
