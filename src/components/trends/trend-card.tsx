'use client'

import type { ComponentType } from 'react'
import type { TrendCardSize } from '@/config/trends'
import type { TrendItem } from '@/modules/trends/types'
import { Copy, ExternalLink, GitFork, Heart, Languages, Star } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { TREND_CARD_CLASS_MAP } from '@/config/trends'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { formatCompactCount } from '@/modules/trends/presenters'

interface TrendMetricItemProps {
  icon: ComponentType<{ className?: string }>
  value: string
  className: string
  sizeClassName: string
}

function TrendMetricItem({
  icon: Icon,
  value,
  className,
  sizeClassName,
}: TrendMetricItemProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium', className, sizeClassName)}>
      <Icon className="size-3.5" />
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
  const isTopThree = item.rank <= 3

  return (
    <article
      className={cn(
        'group flex h-full min-h-[320px] flex-col rounded-[26px] border border-slate-200/85 bg-[#f1f4f8] shadow-[0_14px_30px_-22px_rgba(15,23,42,0.36)] transition-[background-color,box-shadow,border-color] duration-300 ease-out hover:border-slate-300/90 hover:bg-[#f4f7fb] hover:shadow-[0_20px_46px_-24px_rgba(59,130,246,0.24)]',
        scale.root,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full font-semibold',
              scale.topBadge,
              isTopThree
                ? 'border border-amber-300/90 bg-amber-50 text-amber-700 shadow-[0_8px_18px_-14px_rgba(217,119,6,0.6)]'
                : 'border border-slate-300/80 bg-white/70 text-slate-600',
            )}
          >
            TOP
            {' '}
            {item.rank}
          </span>
          <span className={cn('rounded-full border border-slate-300/80 bg-white/75 text-slate-600', scale.sourceBadge)}>{sourceMeta.label}</span>
        </div>
        <Image
          src={item.ownerAvatarUrl}
          alt={item.owner}
          width={44}
          height={44}
          className="size-11 rounded-full border border-slate-300/80 bg-white object-cover"
          loading="lazy"
        />
      </div>

      <div className="mt-4 space-y-2.5">
        <h3 className={cn('line-clamp-1 font-semibold tracking-tight text-slate-900', scale.title)}>{item.title}</h3>
        <p className={cn('line-clamp-1 text-slate-500', scale.fullName)}>{item.fullName}</p>
        <p className={cn('line-clamp-3 text-slate-600', scale.description)}>{item.description}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TrendMetricItem
          icon={Star}
          value={`Star ${formatCompactCount(item.stars)}`}
          className="border-amber-300/70 bg-amber-50/80 text-amber-700"
          sizeClassName="px-2.5 py-1.5 text-xs"
        />
        <TrendMetricItem
          icon={GitFork}
          value={`Fork ${formatCompactCount(item.forks)}`}
          className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700"
          sizeClassName="px-2.5 py-1.5 text-xs"
        />
        <TrendMetricItem
          icon={Languages}
          value={`语言 ${item.language ?? 'Unknown'}`}
          className="border-emerald-300/70 bg-emerald-50/80 text-emerald-700"
          sizeClassName="px-2.5 py-1.5 text-xs"
        />
      </div>

      <div className="mt-auto flex items-center justify-end pt-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600',
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
            className="size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => onCopyName(item)}
            aria-label="复制仓库名"
          >
            <Copy className="size-4" />
          </Button>
          <Button asChild variant="outline" size="icon" className="size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开详情">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
