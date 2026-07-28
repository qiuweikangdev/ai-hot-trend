'use client'

import type { TrendUiScale } from '@/config/trends'
import type { FavoriteItem } from '@/modules/favorites/types'
import { ExternalLink, Heart, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta } from '@/modules/trends/catalog'
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
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        className="absolute inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-[-8px_0_24px_rgba(0,0,0,0.12)]"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 id="favorites-panel-title" className={cn('font-semibold text-foreground', uiScale.favPanelTitle)}>收藏</h2>
            {!isFavoriteLoading && favorites.length > 0
              ? <span className="text-xs tabular-nums text-muted-foreground">{favorites.length}</span>
              : null}
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground" onClick={onClose} aria-label="关闭收藏">
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isFavoriteLoading
            ? (
                <div className="space-y-3 p-4 sm:p-5" aria-label="正在加载收藏">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              )
            : null}

          {!isFavoriteLoading && favorites.length === 0
            ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
                  <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Heart className="size-5" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-sm font-medium text-foreground">暂无收藏</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击卡片上的心形图标即可收藏</p>
                </div>
              )
            : null}

          {!isFavoriteLoading && favorites.length > 0
            ? (
                <div className="divide-y divide-border">
                  {favorites.map((item) => {
                    const favoriteKey = buildFavoriteKey(item.source, item.trendId)
                    const isBusy = favoriteBusyKey === favoriteKey

                    return (
                      <article key={item.id} className="group px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{getTrendSourceMeta(item.source).label}</span>
                              <span className="size-1 rounded-full bg-border" />
                              <span className="truncate">{item.fullName}</span>
                            </div>
                            <p className={cn('mt-2 line-clamp-1 font-medium text-foreground', uiScale.favItemTitle)}>{item.title}</p>
                            <p className={cn('mt-1.5 line-clamp-2 leading-5 text-muted-foreground', uiScale.favItemDesc)}>{item.description || '暂无简介'}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                              onClick={() => onRemoveFavorite(item)}
                              disabled={isBusy}
                              aria-label="取消收藏"
                              title="取消收藏"
                            >
                              {isBusy
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Heart className="size-3.5 fill-current" strokeWidth={1.75} />}
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
                  })}
                </div>
              )
            : null}
        </div>
      </aside>
    </div>
  )
}
