'use client'

import type { ComponentType } from 'react'
import type { TrendCardSize } from '@/config/trends'
import type { TrendItem } from '@/modules/trends/types'
import { Clock3, Copy, ExternalLink, GitFork, Heart, Languages, Star } from 'lucide-react'
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

function formatRelativeUpdateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '最近更新未知'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) {
    return '刚刚更新'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前更新`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}小时前更新`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前更新`
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
  const isNpmSource = item.source === 'npm'
  const isVueSource = item.source === 'vue'
  const isReactSource = item.source === 'react'
  const isNodeSource = item.source === 'node'
  const isAiSource = item.source === 'ai'
  const isComponentSource = item.source === 'component'
  const hasLanguage = Boolean(item.language?.trim())
  const updateTimeLabel = formatRelativeUpdateTime(item.updatedAt)
  const primaryMetricLabel = isNpmSource ? '下载' : (isVueSource || isReactSource || isNodeSource || isAiSource || isComponentSource) ? '增星' : 'Star'

  return (
    <article
      className={cn(
        'group flex h-full min-h-[320px] flex-col rounded-[26px] border border-slate-200/85 bg-[#f1f4f8] shadow-[0_14px_30px_-22px_rgba(15,23,42,0.36)] transition-[background-color,box-shadow,border-color] duration-300 ease-out hover:border-slate-300/90 hover:bg-[#f4f7fb] hover:shadow-[0_20px_46px_-24px_rgba(59,130,246,0.24)] dark:border-white/10 dark:bg-[#0a0e15] dark:shadow-[0_16px_36px_-24px_rgba(0,0,0,0.9)] dark:hover:border-white/18 dark:hover:bg-[#10151f] dark:hover:shadow-[0_24px_54px_-30px_rgba(2,6,23,0.95)]',
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
                ? 'border border-amber-300/90 bg-amber-50 text-amber-700 shadow-[0_8px_18px_-14px_rgba(217,119,6,0.6)] dark:border-amber-300/40 dark:bg-amber-300/12 dark:text-amber-200'
                : 'border border-slate-300/80 bg-white/70 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400',
            )}
          >
            TOP
            {' '}
            {item.rank}
          </span>
          <span className={cn('rounded-full border border-slate-300/80 bg-white/75 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400', scale.sourceBadge)}>{sourceMeta.label}</span>
        </div>
        <Image
          src={item.ownerAvatarUrl}
          alt={item.owner}
          width={44}
          height={44}
          className="size-11 rounded-full border border-slate-300/80 bg-white object-cover dark:border-white/20 dark:bg-slate-800"
          loading="lazy"
        />
      </div>

      <div className="mt-4 space-y-2.5">
        <h3 className={cn('line-clamp-1 font-semibold tracking-tight text-slate-900 dark:text-slate-100', scale.title)}>{item.title}</h3>
        <p className={cn('line-clamp-1 text-slate-500 dark:text-slate-400', scale.fullName)}>{item.fullName}</p>
        <p className={cn('line-clamp-3 text-slate-600 dark:text-slate-300', scale.description)}>{item.description}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TrendMetricItem
          icon={Star}
          value={`${primaryMetricLabel} ${formatCompactCount(item.stars)}`}
          className="border-amber-300/70 bg-amber-50/80 text-amber-700 dark:border-amber-300/35 dark:bg-amber-300/10 dark:text-amber-200"
          sizeClassName="px-2.5 py-1.5 text-xs"
        />
        {isNpmSource || isVueSource || isReactSource || isNodeSource || isAiSource || isComponentSource
          ? null
          : (
              <TrendMetricItem
                icon={GitFork}
                value={`Fork ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )}
        {isNpmSource
          ? (
              <TrendMetricItem
                icon={Clock3}
                value={updateTimeLabel}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {isVueSource
          ? (
              <TrendMetricItem
                icon={Star}
                value={`总星 ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {isReactSource
          ? (
              <TrendMetricItem
                icon={Star}
                value={`总星 ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {isNodeSource
          ? (
              <TrendMetricItem
                icon={Star}
                value={`总星 ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {isAiSource
          ? (
              <TrendMetricItem
                icon={Star}
                value={`总星 ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {isComponentSource
          ? (
              <TrendMetricItem
                icon={Star}
                value={`总星 ${formatCompactCount(item.forks)}`}
                className="border-cyan-300/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
        {hasLanguage
          ? (
              <TrendMetricItem
                icon={Languages}
                value={`语言 ${item.language}`}
                className="border-emerald-300/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-200"
                sizeClassName="px-2.5 py-1.5 text-xs"
              />
            )
          : null}
      </div>

      <div className="mt-auto flex items-center justify-end pt-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/15 dark:bg-[#151a24] dark:text-slate-300 dark:hover:border-rose-300/40 dark:hover:bg-rose-300/10 dark:hover:text-rose-200',
              isFavorite && 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-300/40 dark:bg-rose-300/10 dark:text-rose-200',
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
            className="size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/15 dark:bg-[#151a24] dark:text-slate-300 dark:hover:border-blue-300/40 dark:hover:bg-blue-300/10 dark:hover:text-blue-200"
            onClick={() => onCopyName(item)}
            aria-label="复制仓库名"
          >
            <Copy className="size-4" />
          </Button>
          <Button asChild variant="outline" size="icon" className="size-9 rounded-xl border-slate-300/75 bg-white text-slate-500 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/15 dark:bg-[#151a24] dark:text-slate-300 dark:hover:border-emerald-300/40 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-200">
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开详情">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
