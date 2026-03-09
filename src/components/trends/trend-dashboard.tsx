'use client'

import type { FavoriteItem } from '@/modules/favorites/types'
import type { TrendItem, TrendPeriod, TrendResult, TrendSource } from '@/modules/trends/types'
import { Heart, Loader2, LogIn, LogOut, RefreshCw, Search, Sparkles, UserCircle2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LoginPanel } from '@/components/auth/login-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { TrendCard } from './trend-card'

interface TrendsResponse {
  success: boolean
  message?: string
  data?: TrendResult
}

interface FavoritesResponse {
  success: boolean
  message?: string
  data?: {
    count: number
    items: FavoriteItem[]
  }
}

interface FavoriteMutationResponse {
  success: boolean
  message?: string
  data?: {
    count: number
    items: FavoriteItem[]
  }
}

interface SourceTab {
  value: TrendSource | string
  label: string
  enabled: boolean
}

const SOURCE_TABS: SourceTab[] = [
  { value: 'hot', label: '热点', enabled: false },
  { value: 'github', label: 'GitHub', enabled: true },
  { value: 'npm', label: 'npm', enabled: false },
  { value: 'vue', label: 'Vue生态', enabled: false },
  { value: 'react', label: 'React生态', enabled: false },
  { value: 'node', label: 'Node生态', enabled: false },
  { value: 'ai', label: 'AI生态', enabled: false },
  { value: 'weibo', label: '微博', enabled: false },
  { value: 'zhihu', label: '知乎', enabled: false },
  { value: 'juejin', label: '掘金', enabled: false },
  { value: 'v2ex', label: 'v2ex', enabled: false },
]

const PERIOD_TABS: Array<{ value: TrendPeriod, label: string }> = [
  { value: 'today', label: '今日热度' },
  { value: 'week', label: '本周热点' },
  { value: 'month', label: '本月趋势' },
]

const PRESET_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Vue', 'React']

function buildFavoriteKey(source: string, trendId: string) {
  return `${source}:${trendId}`
}

function getDisplayName(user: { name?: string | null, email?: string | null }) {
  return user.name || user.email || '用户'
}

function trimText(value: string) {
  return value.trim()
}

export function TrendDashboard() {
  const session = authClient.useSession()

  const [source, setSource] = useState<TrendSource>('github')
  const [period, setPeriod] = useState<TrendPeriod>('week')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [language, setLanguage] = useState('')
  const [expandedQuickFilter, setExpandedQuickFilter] = useState(false)

  const [trendData, setTrendData] = useState<TrendResult | null>(null)
  const [isTrendLoading, setIsTrendLoading] = useState(true)
  const [trendError, setTrendError] = useState('')

  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [favoriteBusyKey, setFavoriteBusyKey] = useState('')

  const [notice, setNotice] = useState('')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const favoriteKeySet = useMemo(() => {
    return new Set(favorites.map(item => buildFavoriteKey(item.source, item.trendId)))
  }, [favorites])

  const quickLanguages = useMemo(() => {
    const fromTrends = trendData?.items
      .map(item => item.language)
      .filter((item): item is string => Boolean(item)) ?? []

    return [...new Set([...PRESET_LANGUAGES, ...fromTrends])]
  }, [trendData?.items])

  const visibleQuickLanguages = expandedQuickFilter ? quickLanguages : quickLanguages.slice(0, 5)

  useEffect(() => {
    let aborted = false

    async function loadTrends() {
      setIsTrendLoading(true)
      setTrendError('')

      const searchParams = new URLSearchParams({
        source,
        period,
        limit: '18',
      })

      if (language) {
        searchParams.set('language', language)
      }

      if (keyword) {
        searchParams.set('keyword', keyword)
      }

      try {
        const response = await fetch(`/api/trends?${searchParams.toString()}`, {
          cache: 'no-store',
        })

        const json = await response.json() as TrendsResponse

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.message || '热点数据加载失败')
        }

        if (!aborted) {
          setTrendData(json.data)
        }
      }
      catch (error) {
        if (!aborted) {
          setTrendError(error instanceof Error ? error.message : '热点数据加载失败')
        }
      }
      finally {
        if (!aborted) {
          setIsTrendLoading(false)
        }
      }
    }

    loadTrends()

    return () => {
      aborted = true
    }
  }, [source, period, language, keyword, refreshTick])

  useEffect(() => {
    let aborted = false

    async function loadFavorites() {
      if (!session.data?.user) {
        setFavorites([])
        return
      }

      setIsFavoriteLoading(true)

      try {
        const response = await fetch('/api/favorites', {
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (!aborted) {
            setFavorites([])
          }
          return
        }

        const json = await response.json() as FavoritesResponse

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.message || '收藏数据加载失败')
        }

        if (!aborted) {
          setFavorites(json.data.items)
        }
      }
      catch {
        if (!aborted) {
          setFavorites([])
        }
      }
      finally {
        if (!aborted) {
          setIsFavoriteLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      aborted = true
    }
  }, [session.data?.user])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => {
      setNotice('')
    }, 2200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [notice])

  async function handleSignOut() {
    await authClient.signOut()
    setIsLoginOpen(false)
    setIsFavoritesOpen(false)
    setFavorites([])
    setNotice('已退出登录')
  }

  async function updateFavoritesFromRequest(request: Promise<Response>) {
    const response = await request

    if (response.status === 401) {
      setIsLoginOpen(true)
      throw new Error('请先登录后再收藏')
    }

    const json = await response.json() as FavoriteMutationResponse

    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.message || '收藏操作失败')
    }

    setFavorites(json.data.items)
  }

  async function handleToggleFavorite(item: TrendItem) {
    if (!session.data?.user) {
      setIsLoginOpen(true)
      setNotice('请先登录后再收藏')
      return
    }

    const trendId = item.id
    const favoriteKey = buildFavoriteKey(item.source, trendId)
    const isFavorite = favoriteKeySet.has(favoriteKey)

    setFavoriteBusyKey(favoriteKey)

    try {
      if (isFavorite) {
        await updateFavoritesFromRequest(fetch('/api/favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: item.source,
            trendId,
          }),
        }))

        setNotice(`已取消收藏 ${item.title}`)
      }
      else {
        await updateFavoritesFromRequest(fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item: {
              source: item.source,
              trendId,
              title: item.title,
              fullName: item.fullName,
              description: item.description,
              url: item.url,
              language: item.language,
              stars: item.stars,
              forks: item.forks,
              ownerAvatarUrl: item.ownerAvatarUrl,
            },
          }),
        }))

        setNotice(`已收藏 ${item.title}`)
      }
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : '收藏操作失败')
    }
    finally {
      setFavoriteBusyKey('')
    }
  }

  async function handleRemoveFavorite(item: FavoriteItem) {
    const favoriteKey = buildFavoriteKey(item.source, item.trendId)
    setFavoriteBusyKey(favoriteKey)

    try {
      await updateFavoritesFromRequest(fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: item.source,
          trendId: item.trendId,
        }),
      }))

      setNotice(`已取消收藏 ${item.title}`)
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : '取消收藏失败')
    }
    finally {
      setFavoriteBusyKey('')
    }
  }

  async function handleCopyName(item: TrendItem) {
    try {
      await navigator.clipboard.writeText(item.fullName)
      setNotice(`已复制 ${item.fullName}`)
    }
    catch {
      setNotice('复制失败，请手动复制')
    }
  }

  function handleSearch() {
    setKeyword(trimText(searchInput))
  }

  function handleResetSearch() {
    setSearchInput('')
    setKeyword('')
    setLanguage('')
    setRefreshTick(value => value + 1)
  }

  const selectedLanguageLabel = language || '全部'
  const selectedKeywordLabel = keyword || '无'
  const favoriteCount = favorites.length
  const userDisplayName = session.data?.user ? getDisplayName(session.data.user) : ''

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_16%,rgba(251,207,130,0.24),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(139,205,245,0.25),transparent_24%),linear-gradient(180deg,#f7f9fd_0%,#edf2f9_100%)] text-slate-800">
      <header className="border-b border-white/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(145deg,#ffd17b_0%,#ffc36d_45%,#8fe0c4_100%)] shadow-[0_14px_25px_-16px_rgba(34,105,84,0.6)]">
              <Sparkles className="size-7 text-slate-800" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">热点趋势</h1>
              <p className="text-sm text-slate-500">模块化热点系统 · 首期 GitHub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200 bg-white/90 px-4"
              onClick={() => {
                if (!session.data?.user) {
                  setIsLoginOpen(true)
                  setNotice('登录后可查看收藏中心')
                  return
                }

                setIsFavoritesOpen(value => !value)
              }}
            >
              <Heart className="size-4" />
              收藏中心
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{favoriteCount}</span>
            </Button>

            {session.data?.user
              ? (
                  <>
                    <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 md:flex">
                      <UserCircle2 className="size-4 text-slate-500" />
                      {userDisplayName}
                    </div>
                    <Button type="button" variant="outline" className="rounded-2xl border-slate-200 bg-white/90" onClick={handleSignOut}>
                      <LogOut className="size-4" />
                      退出
                    </Button>
                  </>
                )
              : (
                  <Button type="button" className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsLoginOpen(true)}>
                    <LogIn className="size-4" />
                    登录
                  </Button>
                )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-[0_30px_65px_-55px_rgba(35,63,112,0.7)] backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
              {SOURCE_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition',
                    tab.enabled
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'cursor-not-allowed text-slate-300',
                    tab.value === source && tab.enabled && 'bg-blue-600 text-white hover:bg-blue-600',
                  )}
                  onClick={() => {
                    if (!tab.enabled) {
                      setNotice(`${tab.label} 模块即将上线`)
                      return
                    }

                    setSource(tab.value as TrendSource)
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
              {PERIOD_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100',
                    tab.value === period && 'bg-blue-600 text-white hover:bg-blue-600',
                  )}
                  onClick={() => setPeriod(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-blue-500/90 bg-white p-2">
            <Search className="ml-2 size-5 text-slate-400" />
            <Input
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="筛选语言或关键词，例如 vue / react / ai agent"
              className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button type="button" className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-500" onClick={handleSearch}>
              <Search className="size-4" />
              搜索
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200" onClick={handleResetSearch}>
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <div className="mt-3 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
              当前筛选：
              <span className="font-medium text-slate-900">
                来源
                {source}
              </span>
              <span>·</span>
              <span className="font-medium text-slate-900">
                语言
                {selectedLanguageLabel}
              </span>
              <span>·</span>
              <span className="font-medium text-slate-900">
                关键词
                {selectedKeywordLabel}
              </span>
            </div>

            <button
              type="button"
              className="text-sm text-slate-500 underline-offset-4 hover:text-blue-600 hover:underline"
              onClick={() => setExpandedQuickFilter(value => !value)}
            >
              {expandedQuickFilter ? '收起快捷筛选' : '展开快捷筛选'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition',
                language
                  ? 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                  : 'border-blue-200 bg-blue-50 text-blue-700',
              )}
              onClick={() => setLanguage('')}
            >
              全部
            </button>

            {visibleQuickLanguages.map(item => (
              <button
                key={item}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition',
                  language === item
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
                )}
                onClick={() => setLanguage(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {notice
          ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                {notice}
              </div>
            )
          : null}

        <section className="mt-6">
          {isTrendLoading
            ? (
                <div className="flex items-center justify-center rounded-3xl border border-white/80 bg-white/70 px-4 py-20 text-slate-500">
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  正在加载热点趋势...
                </div>
              )
            : trendError
              ? (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-8 text-rose-700">
                    {trendError}
                  </div>
                )
              : (
                  <>
                    {trendData?.stale
                      ? (
                          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                            当前展示缓存数据，GitHub 接口暂时不可用。
                          </div>
                        )
                      : null}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 lg:grid-cols-2">
                      {trendData?.items.map(item => (
                        <TrendCard
                          key={item.id}
                          item={item}
                          isFavorite={favoriteKeySet.has(buildFavoriteKey(item.source, item.id))}
                          favoriteDisabled={favoriteBusyKey === buildFavoriteKey(item.source, item.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onCopyName={handleCopyName}
                        />
                      ))}
                    </div>

                    {!trendData?.items.length
                      ? (
                          <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-10 text-center text-slate-500">
                            当前筛选条件下暂无热点项目，请调整筛选后重试。
                          </div>
                        )
                      : null}
                  </>
                )}
        </section>
      </main>

      {isFavoritesOpen
        ? (
            <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsFavoritesOpen(false)}>
              <aside
                className="absolute right-4 top-24 z-50 max-h-[72vh] w-[min(480px,92vw)] overflow-y-auto rounded-3xl border border-white/80 bg-white p-5 shadow-2xl"
                onClick={event => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">收藏中心</h2>
                  <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setIsFavoritesOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </div>

                {isFavoriteLoading
                  ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500">
                        <Loader2 className="size-4 animate-spin" />
                        正在加载收藏列表...
                      </div>
                    )
                  : null}

                {!isFavoriteLoading && !favorites.length
                  ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
                        你还没有收藏项目，先去榜单点亮第一颗心吧。
                      </div>
                    )
                  : null}

                <div className="space-y-3">
                  {favorites.map(item => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-medium text-slate-900">{item.title}</p>
                          <p className="truncate text-sm text-slate-500">{item.fullName}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleRemoveFavorite(item)}
                          disabled={favoriteBusyKey === buildFavoriteKey(item.source, item.trendId)}
                        >
                          <Heart className="size-4 fill-current" />
                        </Button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p>
                      <div className="mt-3 flex items-center justify-end">
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                          <a href={item.url} target="_blank" rel="noreferrer">打开仓库</a>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </aside>
            </div>
          )
        : null}

      {isLoginOpen && !session.data?.user
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" onClick={() => setIsLoginOpen(false)}>
              <div className="w-full max-w-md" onClick={event => event.stopPropagation()}>
                <LoginPanel />
              </div>
            </div>
          )
        : null}
    </div>
  )
}
