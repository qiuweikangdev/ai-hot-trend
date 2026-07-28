'use client'

import type { TrendUiScale } from '@/config/trends'
import type { FavoriteItem } from '@/modules/favorites/types'
import type { TrendSource } from '@/modules/trends/types'
import { ExternalLink, Heart, Loader2, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getTrendSourceMeta, TREND_SOURCE_OPTIONS } from '@/modules/trends/catalog'
import { isTrendSource } from '@/modules/trends/types'
import { buildFavoriteKey } from './utils'

type FavoriteSourceFilter = 'all' | TrendSource

const FAVORITE_PAGE_SIZE = 12

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
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<FavoriteSourceFilter>('all')
  const [visibleCount, setVisibleCount] = useState(FAVORITE_PAGE_SIZE)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const sourceCounts = useMemo(() => {
    const counts = new Map<TrendSource, number>()

    for (const favorite of favorites) {
      counts.set(favorite.source, (counts.get(favorite.source) ?? 0) + 1)
    }

    return counts
  }, [favorites])

  const categoryOptions = useMemo(() => {
    const sourceOptions = TREND_SOURCE_OPTIONS.flatMap((option) => {
      if (!option.enabled || !isTrendSource(option.value)) {
        return []
      }

      const count = sourceCounts.get(option.value) ?? 0

      if (count === 0 && option.value !== sourceFilter) {
        return []
      }

      return [{ value: option.value as FavoriteSourceFilter, label: option.label, count }]
    })

    return [
      { value: 'all' as const, label: '全部', count: favorites.length },
      ...sourceOptions,
    ]
  }, [favorites.length, sourceCounts, sourceFilter])

  const filteredFavorites = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

    return favorites.filter((favorite) => {
      if (sourceFilter !== 'all' && favorite.source !== sourceFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [favorite.title, favorite.fullName, favorite.description]
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
    })
  }, [favorites, searchQuery, sourceFilter])

  const visibleFavorites = filteredFavorites.slice(0, visibleCount)
  const hasMore = visibleCount < filteredFavorites.length

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const documentElement = document.documentElement
    const body = document.body
    const previousDocumentOverflow = documentElement.style.overflow
    const previousBodyOverflow = body.style.overflow

    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      documentElement.style.overflow = previousDocumentOverflow
      body.style.overflow = previousBodyOverflow
    }
  }, [isOpen])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    const loadMoreTarget = loadMoreRef.current

    if (!isOpen || !hasMore || !scrollArea || !loadMoreTarget) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount(current => Math.min(current + FAVORITE_PAGE_SIZE, filteredFavorites.length))
      }
    }, {
      root: scrollArea,
      rootMargin: '160px 0px',
    })

    observer.observe(loadMoreTarget)

    return () => {
      observer.disconnect()
    }
  }, [filteredFavorites.length, hasMore, isOpen])

  if (!isOpen) {
    return null
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setVisibleCount(FAVORITE_PAGE_SIZE)
    scrollAreaRef.current?.scrollTo({ top: 0 })
  }

  function handleSelectSource(value: FavoriteSourceFilter) {
    setSourceFilter(value)
    setVisibleCount(FAVORITE_PAGE_SIZE)
    scrollAreaRef.current?.scrollTo({ top: 0 })
  }

  const hasAnyFavorites = favorites.length > 0
  const hasFilteredFavorites = filteredFavorites.length > 0

  return (
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        className="absolute inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-border bg-background shadow-[-2px_0_8px_rgba(0,0,0,0.12)]"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 id="favorites-panel-title" className={cn('font-semibold text-foreground', uiScale.favPanelTitle)}>收藏</h2>
            {!isFavoriteLoading && hasAnyFavorites
              ? <span className="text-xs tabular-nums text-muted-foreground">{favorites.length}</span>
              : null}
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground" onClick={onClose} aria-label="关闭收藏">
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </header>

        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input
              value={searchQuery}
              onChange={event => handleSearchChange(event.target.value)}
              placeholder="搜索收藏"
              aria-label="搜索收藏"
              disabled={isFavoriteLoading || !hasAnyFavorites}
              className="h-9 bg-background pl-9 pr-9 text-sm"
            />
            {searchQuery
              ? (
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-md text-muted-foreground" onClick={() => handleSearchChange('')} aria-label="清空搜索">
                    <X className="size-3.5" strokeWidth={1.75} />
                  </Button>
                )
              : null}
          </div>

          <div className="mt-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="收藏分类">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={sourceFilter === option.value}
                className={cn(
                  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  sourceFilter === option.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                onClick={() => handleSelectSource(option.value)}
              >
                {option.label}
                <span className="text-[10px] tabular-nums opacity-70">{option.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollAreaRef} className="minimal-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isFavoriteLoading
            ? (
                <div className="space-y-3 p-4 sm:p-5" aria-label="正在加载收藏">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              )
            : null}

          {!isFavoriteLoading && !hasAnyFavorites
            ? (
                <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
                  <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Heart className="size-5" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-sm font-medium text-foreground">暂无收藏</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击卡片上的心形图标即可收藏</p>
                </div>
              )
            : null}

          {!isFavoriteLoading && hasAnyFavorites && !hasFilteredFavorites
            ? (
                <div className="flex min-h-[45vh] flex-col items-center justify-center px-6 text-center">
                  <Search className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium text-foreground">没有匹配的收藏</p>
                  <button type="button" className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => handleSearchChange('')}>清空搜索</button>
                </div>
              )
            : null}

          {!isFavoriteLoading && hasFilteredFavorites
            ? (
                <div className="divide-y divide-border">
                  {visibleFavorites.map((item) => {
                    const favoriteKey = buildFavoriteKey(item.source, item.trendId)
                    const isBusy = favoriteBusyKey === favoriteKey

                    return (
                      <article key={item.id} className="group px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5 [content-visibility:auto] [contain-intrinsic-size:auto_112px]">
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
                  {hasMore ? <div ref={loadMoreRef} className="h-px" aria-hidden /> : null}
                </div>
              )
            : null}
        </div>
      </aside>
    </div>
  )
}
