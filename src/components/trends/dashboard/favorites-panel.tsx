'use client'

import type { TrendUiScale } from '@/config/trends'
import type { FavoriteItem } from '@/modules/favorites/types'
import { Heart, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buildFavoriteKey } from './utils'

interface FavoritesPanelProps {
  isOpen: boolean
  uiScale: TrendUiScale
  favorites: FavoriteItem[]
  isFavoriteLoading: boolean
  favoriteBusyKey: string
  onClose: () => void
  onRemoveFavorite: (item: FavoriteItem) => void
}

export function FavoritesPanel({
  isOpen,
  uiScale,
  favorites,
  isFavoriteLoading,
  favoriteBusyKey,
  onClose,
  onRemoveFavorite,
}: FavoritesPanelProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-4 top-24 z-50 max-h-[72vh] w-[min(480px,92vw)] overflow-y-auto rounded-3xl border border-white/80 bg-white p-5 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={cn('font-semibold text-slate-900', uiScale.favPanelTitle)}>收藏中心</h2>
          <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {isFavoriteLoading
          ? (
              <div className={cn('flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500', uiScale.favPanelText)}>
                <Loader2 className="size-4 animate-spin" />
                正在加载收藏列表...
              </div>
            )
          : null}

        {!isFavoriteLoading && !favorites.length
          ? (
              <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-slate-500', uiScale.favPanelText)}>
                你还没有收藏项目，先去点亮第一颗心吧。
              </div>
            )
          : null}

        <div className="space-y-3">
          {favorites.map(item => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn('truncate font-medium text-slate-900', uiScale.favItemTitle)}>{item.title}</p>
                  <p className={cn('truncate text-slate-500', uiScale.favItemSub)}>{item.fullName}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => onRemoveFavorite(item)}
                  disabled={favoriteBusyKey === buildFavoriteKey(item.source, item.trendId)}
                >
                  <Heart className="size-4 fill-current" />
                </Button>
              </div>
              <p className={cn('mt-2 line-clamp-2 text-slate-600', uiScale.favItemDesc)}>{item.description}</p>
              <div className="mt-3 flex items-center justify-end">
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <a href={item.url} target="_blank" rel="noreferrer">打开详情</a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  )
}
