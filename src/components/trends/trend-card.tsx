'use client'

import type { ComponentType } from 'react'
import type { TrendCardSize } from '@/config/trends'
import type { TrendItem, TrendSource } from '@/modules/trends/types'
import { Activity, Copy, ExternalLink, GitFork, Heart, Languages, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TREND_CARD_CLASS_MAP } from '@/config/trends'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
import { formatCompactCount } from '@/modules/trends/presenters'

interface TrendMetricItemProps {
  icon: ComponentType<{ className?: string, strokeWidth?: number }>
  label: string
  value: number | string
  className?: string
}

function TrendMetricItem({ icon: Icon, label, value, className }: TrendMetricItemProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-muted-foreground', className)}>
      <Icon className="size-3.5" strokeWidth={1.75} />
      <span>{label}</span>
      <span className="font-medium tabular-nums text-foreground">{typeof value === 'number' ? formatCompactCount(value) : value}</span>
    </span>
  )
}

function formatRelativeUpdateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '最近更新'
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))

  if (diffMinutes < 1) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} 小时前`
  }

  return `${Math.floor(diffHours / 24)} 天前`
}

function getMetricMeta(source: TrendSource) {
  switch (source) {
    case 'npm':
      return { primary: '下载', secondary: null }
    case 'vue':
    case 'react':
    case 'node':
    case 'ai':
    case 'component':
      return { primary: '增星', secondary: '总星' }
    case 'zhihu':
      return { primary: '关注', secondary: '回答' }
    case 'juejin':
      return { primary: '热度', secondary: '评论' }
    case 'v2ex':
      return { primary: '回复', secondary: '节点' }
    case 'weibo':
      return { primary: '热度', secondary: null }
    default:
      return { primary: 'Star', secondary: 'Fork' }
  }
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
  const metricMeta = getMetricMeta(item.source)
  const SecondaryMetricIcon = item.source === 'github'
    ? GitFork
    : ['vue', 'react', 'node', 'ai', 'component'].includes(item.source)
        ? Star
        : MessageCircle

  return (
    <article
      className={cn(
        'group flex min-h-[224px] flex-col rounded-xl border border-border bg-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-px hover:border-foreground/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.24)]',
        scale.root,
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono font-medium tabular-nums text-foreground">
            #
            {String(item.rank).padStart(2, '0')}
          </span>
          <span className="size-1 rounded-full bg-border" />
          <span className="truncate text-muted-foreground">{sourceMeta.label}</span>
        </div>
        <time dateTime={item.updatedAt} className="shrink-0 text-muted-foreground/80">
          {formatRelativeUpdateTime(item.updatedAt)}
        </time>
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className={cn('line-clamp-1 font-semibold tracking-[-0.01em] text-card-foreground', scale.title)}>{item.title}</h3>
        <p className={cn('line-clamp-1 text-muted-foreground', scale.fullName)}>{item.fullName}</p>
        <p className={cn('line-clamp-3 text-muted-foreground', scale.description)}>{item.description || '暂无简介'}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1', scale.metricWrap)}>
          <TrendMetricItem icon={Activity} label={metricMeta.primary} value={item.stars} />
          {metricMeta.secondary ? <TrendMetricItem icon={SecondaryMetricIcon} label={metricMeta.secondary} value={item.forks} /> : null}
          {item.language?.trim() ? <TrendMetricItem icon={Languages} label="" value={item.language} /> : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('size-8 rounded-md text-muted-foreground hover:text-foreground', isFavorite && 'text-foreground')}
            onClick={() => onToggleFavorite(item)}
            disabled={favoriteDisabled}
            aria-label={isFavorite ? '取消收藏' : '收藏'}
            title={isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart className={cn('size-3.5', isFavorite && 'fill-current')} strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground hover:text-foreground" onClick={() => onCopyName(item)} aria-label="复制链接" title="复制链接">
            <Copy className="size-3.5" strokeWidth={1.75} />
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground hover:text-foreground">
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开详情" title="打开详情">
              <ExternalLink className="size-3.5" strokeWidth={1.75} />
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
