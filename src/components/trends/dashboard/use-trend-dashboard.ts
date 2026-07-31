'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import type { TrendItem, TrendResult, TrendSource } from '@/modules/trends/types'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TREND_UI_SCALE_PRESETS, trendUiConfig } from '@/config/trends'
import { authClient } from '@/lib/auth-client'
import { PRESET_TREND_LANGUAGES } from '@/modules/trends/catalog'
import { useDashboardSession } from './use-dashboard-session'
import { useFavoritesManager } from './use-favorites-manager'
import { useSearchHistory } from './use-search-history'
import { useTrendFeed } from './use-trend-feed'
import { useTrendQueryState } from './use-trend-query-state'
import { collectQuickLanguages, getDisplayName } from './utils'

type DashboardNoticeLevel = 'success' | 'error' | 'info' | 'warning'

export function useTrendDashboard(
  initialSession: AuthSessionSnapshot,
  initialSource: TrendSource | undefined,
  initialTrendData: TrendResult,
) {
  const uiScale = TREND_UI_SCALE_PRESETS[trendUiConfig.activeScalePreset]
  const { clientSession, session, sessionUser, sessionUserId } = useDashboardSession(initialSession)
  const searchHistory = useSearchHistory()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)

  function pushNotice(message: string, level: DashboardNoticeLevel = 'info') {
    if (level === 'success') {
      toast.success(message)
      return
    }

    if (level === 'error') {
      toast.error(message)
      return
    }

    if (level === 'warning') {
      toast.warning(message)
      return
    }

    toast(message)
  }

  function openLoginWithNotice(message: string) {
    setIsLoginOpen(true)
    pushNotice(message, 'warning')
  }

  const trendQuery = useTrendQueryState({
    onNotice: pushNotice,
    initialSource,
  })

  const trendFeed = useTrendFeed({
    source: trendQuery.state.source,
    period: trendQuery.state.period,
    language: trendQuery.state.language,
    keyword: trendQuery.state.keyword,
    limit: trendUiConfig.trendLimit,
    refreshTick: trendQuery.state.refreshTick,
    initialTrendData,
  })

  const quickLanguages = useMemo(() => {
    return collectQuickLanguages(trendFeed.trendData?.items, PRESET_TREND_LANGUAGES)
  }, [trendFeed.trendData?.items])

  const visibleQuickLanguages = trendQuery.state.expandedQuickFilter
    ? quickLanguages
    : quickLanguages.slice(0, trendUiConfig.quickFilterCollapsedCount)

  const favoritesManager = useFavoritesManager({
    sessionUser,
    sessionUserId,
    onNotice: pushNotice,
    onRequireLogin: openLoginWithNotice,
  })

  const activeSourceMeta = trendQuery.derived.activeSourceMeta
  const selectedLanguageLabel = trendQuery.derived.selectedLanguageLabel
  const selectedKeywordLabel = trendQuery.derived.selectedKeywordLabel
  const favoriteCount = favoritesManager.derived.favoriteCount
  const userDisplayName = sessionUser ? getDisplayName(sessionUser) : ''
  const userAvatarUrl = sessionUser?.image ?? ''

  async function handleSignOut() {
    await fetch('/api/user/revoke-github', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)

    await authClient.signOut()
    await clientSession.refetch()
    setIsLoginOpen(false)
    setIsFavoritesOpen(false)
    favoritesManager.actions.setFavorites([])
    pushNotice('已退出登录', 'success')
  }

  async function handleCopyName(item: TrendItem) {
    try {
      await navigator.clipboard.writeText(item.url)
      pushNotice(`已复制「${item.title}」链接`, 'success')
    }
    catch {
      pushNotice('复制链接失败，请手动复制', 'error')
    }
  }

  function handleSearch() {
    trendQuery.actions.handleSearch()

    if (trendQuery.state.searchInput.trim()) {
      searchHistory.addKeyword(trendQuery.state.searchInput)
    }
  }

  function handleApplySearchKeyword(value: string) {
    trendQuery.actions.applySearchKeyword(value)
    searchHistory.addKeyword(value)
  }

  function handleClearSearchHistory() {
    searchHistory.clearKeywords()
  }

  function handleToggleFavoritesPanel() {
    if (!sessionUser) {
      openLoginWithNotice('登录后可查看收藏中心')
      return
    }

    setIsFavoritesOpen(value => !value)
  }

  return {
    uiScale,
    session,
    sourceOptions: trendQuery.sourceOptions,
    periodOptions: trendQuery.periodOptions,
    state: {
      source: trendQuery.state.source,
      period: trendQuery.state.period,
      searchInput: trendQuery.state.searchInput,
      language: trendQuery.state.language,
      expandedQuickFilter: trendQuery.state.expandedQuickFilter,
      trendData: trendFeed.trendData,
      isTrendLoading: trendFeed.isTrendLoading,
      trendError: trendFeed.trendError,
      isLoadingMore: trendFeed.isLoadingMore,
      hasMore: trendFeed.hasMore,
      recentKeywords: searchHistory.recentKeywords,
      favorites: favoritesManager.state.favorites,
      isFavoriteLoading: favoritesManager.state.isFavoriteLoading,
      favoriteBusyKey: favoritesManager.state.favoriteBusyKey,
      isLoginOpen,
      isFavoritesOpen,
    },
    derived: {
      activeSourceMeta,
      visibleQuickLanguages,
      selectedLanguageLabel,
      selectedKeywordLabel,
      favoriteCount,
      favoriteKeySet: favoritesManager.derived.favoriteKeySet,
      isSessionPending: session.isPending,
      userDisplayName,
      userAvatarUrl,
    },
    actions: {
      setSearchInput: trendQuery.actions.setSearchInput,
      setPeriod: trendQuery.actions.setPeriod,
      setLanguage: trendQuery.actions.setLanguage,
      setExpandedQuickFilter: trendQuery.actions.setExpandedQuickFilter,
      setIsLoginOpen,
      setIsFavoritesOpen,
      handleSearch,
      handleApplySearchKeyword,
      handleClearSearchHistory,
      handleResetSearch: trendQuery.actions.handleResetSearch,
      handleSelectSource: trendQuery.actions.handleSelectSource,
      handleToggleFavorite: favoritesManager.actions.handleToggleFavorite,
      handleRemoveFavorite: favoritesManager.actions.handleRemoveFavorite,
      handleCopyName,
      handleToggleFavoritesPanel,
      handleLoadMore: trendFeed.loadMore,
      handleSignOut,
    },
  }
}
