'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import type { FavoriteItem } from '@/modules/favorites/types'
import type { TrendItem, TrendPeriod, TrendResult, TrendSource } from '@/modules/trends/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TREND_UI_SCALE_PRESETS, trendUiConfig } from '@/config/trends'
import { authClient } from '@/lib/auth-client'
import {
  createFavorite,
  fetchFavorites,
  removeFavorite,
} from '@/modules/favorites/client'
import {
  DEFAULT_TREND_PERIOD,
  DEFAULT_TREND_SOURCE,
  getTrendSourceMeta,
  PRESET_TREND_LANGUAGES,
  TREND_PERIOD_OPTIONS,
  TREND_SOURCE_OPTIONS,
} from '@/modules/trends/catalog'
import { fetchTrendResult } from '@/modules/trends/client'
import { isTrendSource } from '@/modules/trends/types'
import {
  buildFavoriteKey,
  collectQuickLanguages,
  getDisplayName,
  trimText,
} from './utils'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function useTrendDashboard(initialSession: AuthSessionSnapshot | null) {
  const uiScale = TREND_UI_SCALE_PRESETS[trendUiConfig.activeScalePreset]
  const clientSession = authClient.useSession()
  const hasResolvedClientSessionRef = useRef(!clientSession.isPending)

  const [source, setSource] = useState<TrendSource>(DEFAULT_TREND_SOURCE)
  const [period, setPeriod] = useState<TrendPeriod>(DEFAULT_TREND_PERIOD)
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

  if (!clientSession.isPending) {
    hasResolvedClientSessionRef.current = true
  }

  // Seed the first client render with the server snapshot so refreshes do not
  // flash into a signed-out state before Better Auth finishes hydrating.
  const hasResolvedClientSession = hasResolvedClientSessionRef.current
  const session = {
    ...clientSession,
    data: clientSession.data ?? (!hasResolvedClientSession ? initialSession : null),
    isPending: clientSession.isPending && !hasResolvedClientSession,
  }
  const sessionUser = session.data?.user ?? null
  const sessionUserId = sessionUser?.id ?? ''

  const favoriteKeySet = useMemo(() => {
    return new Set(favorites.map(item => buildFavoriteKey(item.source, item.trendId)))
  }, [favorites])

  const quickLanguages = useMemo(() => {
    return collectQuickLanguages(trendData?.items, PRESET_TREND_LANGUAGES)
  }, [trendData?.items])

  const visibleQuickLanguages = expandedQuickFilter
    ? quickLanguages
    : quickLanguages.slice(0, trendUiConfig.quickFilterCollapsedCount)

  const selectedLanguageLabel = language || '全部'
  const selectedKeywordLabel = keyword || '未设置'
  const favoriteCount = favorites.length
  const activeSourceMeta = getTrendSourceMeta(source)
  const userDisplayName = sessionUser ? getDisplayName(sessionUser) : ''

  useEffect(() => {
    let cancelled = false

    async function loadTrends() {
      setIsTrendLoading(true)
      setTrendError('')

      try {
        const data = await fetchTrendResult({
          source,
          period,
          language,
          keyword,
          limit: trendUiConfig.trendLimit,
        })

        if (!cancelled) {
          setTrendData(data)
        }
      }
      catch (error) {
        if (!cancelled) {
          setTrendError(getErrorMessage(error, '热点数据加载失败'))
        }
      }
      finally {
        if (!cancelled) {
          setIsTrendLoading(false)
        }
      }
    }

    loadTrends()

    return () => {
      cancelled = true
    }
  }, [source, period, language, keyword, refreshTick])

  useEffect(() => {
    let cancelled = false

    async function loadFavorites() {
      if (!sessionUserId) {
        setFavorites([])
        setIsFavoriteLoading(false)
        return
      }

      setIsFavoriteLoading(true)

      try {
        const data = await fetchFavorites()

        if (!cancelled) {
          setFavorites(data?.items ?? [])
        }
      }
      catch {
        if (!cancelled) {
          setFavorites([])
        }
      }
      finally {
        if (!cancelled) {
          setIsFavoriteLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [sessionUserId])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => {
      setNotice('')
    }, trendUiConfig.noticeDurationMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [notice])

  function openLoginWithNotice(message: string) {
    setIsLoginOpen(true)
    setNotice(message)
  }

  async function handleSignOut() {
    await fetch('/api/user/revoke-github', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)

    await authClient.signOut()
    await clientSession.refetch()
    setIsLoginOpen(false)
    setIsFavoritesOpen(false)
    setFavorites([])
    setNotice('已退出登录')
  }

  async function handleToggleFavorite(item: TrendItem) {
    if (!sessionUser) {
      openLoginWithNotice('请先登录后再收藏')
      return
    }

    const favoriteKey = buildFavoriteKey(item.source, item.id)
    const isFavorite = favoriteKeySet.has(favoriteKey)

    setFavoriteBusyKey(favoriteKey)

    try {
      const data = isFavorite
        ? await removeFavorite(item.source, item.id)
        : await createFavorite(item)

      setFavorites(data.items)
      setNotice(isFavorite ? `已取消收藏 ${item.title}` : `已收藏 ${item.title}`)
    }
    catch (error) {
      const message = getErrorMessage(error, '收藏操作失败')

      if (message === 'UNAUTHORIZED') {
        openLoginWithNotice('请先登录后再收藏')
      }
      else {
        setNotice(message)
      }
    }
    finally {
      setFavoriteBusyKey('')
    }
  }

  async function handleRemoveFavorite(item: FavoriteItem) {
    const favoriteKey = buildFavoriteKey(item.source, item.trendId)
    setFavoriteBusyKey(favoriteKey)

    try {
      const data = await removeFavorite(item.source, item.trendId)
      setFavorites(data.items)
      setNotice(`已取消收藏 ${item.title}`)
    }
    catch (error) {
      const message = getErrorMessage(error, '取消收藏失败')

      if (message === 'UNAUTHORIZED') {
        openLoginWithNotice('登录状态已失效，请重新登录')
      }
      else {
        setNotice(message)
      }
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

  function handleSelectSource(value: string, enabled: boolean, label: string) {
    if (!enabled || !isTrendSource(value)) {
      setNotice(`${label} 模块即将上线`)
      return
    }

    setSource(value)
  }

  function handleToggleFavoritesPanel() {
    if (!sessionUser) {
      openLoginWithNotice('登录后可查看收藏中心')
      return
    }

    setIsFavoritesOpen(value => !value)
  }

  // Centralize client orchestration here so the page shell stays focused on
  // layout, and new sources only need domain modules plus small UI pieces.
  return {
    uiScale,
    session,
    sourceOptions: TREND_SOURCE_OPTIONS,
    periodOptions: TREND_PERIOD_OPTIONS,
    state: {
      source,
      period,
      searchInput,
      language,
      expandedQuickFilter,
      trendData,
      isTrendLoading,
      trendError,
      favorites,
      isFavoriteLoading,
      favoriteBusyKey,
      notice,
      isLoginOpen,
      isFavoritesOpen,
    },
    derived: {
      activeSourceMeta,
      visibleQuickLanguages,
      selectedLanguageLabel,
      selectedKeywordLabel,
      favoriteCount,
      favoriteKeySet,
      userDisplayName,
    },
    actions: {
      setSearchInput,
      setPeriod,
      setLanguage,
      setExpandedQuickFilter,
      setIsLoginOpen,
      setIsFavoritesOpen,
      handleSearch,
      handleResetSearch,
      handleSelectSource,
      handleToggleFavorite,
      handleRemoveFavorite,
      handleCopyName,
      handleToggleFavoritesPanel,
      handleSignOut,
    },
  }
}
