'use client'

import type { TrendItem } from '@/modules/trends/types'
import { Copy, ExternalLink, GitFork, Heart, Languages, Star } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }

  return String(value)
}

interface TrendCardProps {
  item: TrendItem
  isFavorite: boolean
  favoriteDisabled?: boolean
  onToggleFavorite: (item: TrendItem) => void
  onCopyName: (item: TrendItem) => void
}

export function TrendCard({
  item,
  isFavorite,
  favoriteDisabled,
  onToggleFavorite,
  onCopyName,
}: TrendCardProps) {
  return (
    <article className="group rounded-3xl border border-slate-200/90 bg-white/80 p-5 shadow-[0_8px_32px_-24px_rgba(35,63,112,0.6)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-28px_rgba(35,63,112,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            TOP
            {' '}
            {item.rank}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">GitHub</span>
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

      <div className="mt-4 space-y-2">
        <h3 className="line-clamp-1 text-3xl/none font-semibold tracking-tight text-slate-900">{item.title}</h3>
        <p className="line-clamp-1 text-lg text-slate-500">{item.fullName}</p>
        <p className="line-clamp-2 min-h-14 text-lg/7 text-slate-600">{item.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
          <Star className="size-3.5" />
          Star
          {' '}
          {formatCount(item.stars)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/80 bg-cyan-50 px-3 py-1.5 font-medium text-cyan-700">
          <GitFork className="size-3.5" />
          Fork
          {' '}
          {formatCount(item.forks)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
          <Languages className="size-3.5" />
          语言
          {' '}
          {item.language ?? '未知'}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
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
          <a href={item.url} target="_blank" rel="noreferrer" aria-label="打开仓库">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </article>
  )
}
