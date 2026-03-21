'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import type { TrendItem } from '@/modules/trends/types'
import { useMemo, useState } from 'react'
import { TREND_UI_SCALE_PRESETS, trendUiConfig } from '@/config/trends'
import { authClient } from '@/lib/auth-client'
import { PRESET_TREND_LANGUAGES } from '@/modules/trends/catalog'
import { useDashboardNotice } from './use-dashboard-notice'
import { useDashboardSession } from './use-dashboard-session'
import { useFavoritesManager } from './use-favorites-manager'
import { useSearchHistory } from './use-search-history'
import { useTrendFeed } from './use-trend-feed'
import { useTrendQueryState } from './use-trend-query-state'
import { collectQuickLanguages, getDisplayName } from './utils'

export function useTrendDashboard(initialSession: AuthSessionSnapshot) {
  const uiScale = TREND_UI_SCALE_PRESETS[trendUiConfig.activeScalePreset]
  const { notice, setNotice } = useDashboardNotice(trendUiConfig.noticeDurationMs)
  const { clientSession, session, sessionUser, sessionUserId } = useDashboardSession(initialSession)
  const searchHistory = useSearchHistory()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)

  function openLoginWithNotice(message: string) {
    setIsLoginOpen(true)
    setNotice(message)
  }

  const trendQuery = useTrendQueryState({
    onNotice: setNotice,
  })

  const trendFeed = useTrendFeed({
    source: trendQuery.state.source,
    period: trendQuery.state.period,
    language: trendQuery.state.language,
    keyword: trendQuery.state.keyword,
    limit: trendUiConfig.trendLimit,
    refreshTick: trendQuery.state.refreshTick,
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
    onNotice: setNotice,
    onRequireLogin: openLoginWithNotice,
  })

  const activeSourceMeta = trendQuery.derived.activeSourceMeta
  const selectedLanguageLabel = trendQuery.derived.selectedLanguageLabel
  const selectedKeywordLabel = trendQuery.derived.selectedKeywordLabel
  const favoriteCount = favoritesManager.derived.favoriteCount
  const userDisplayName = sessionUser ? getDisplayName(sessionUser) : ''

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
    setNotice('已退出登录')
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
      recentKeywords: searchHistory.recentKeywords,
      favorites: favoritesManager.state.favorites,
      isFavoriteLoading: favoritesManager.state.isFavoriteLoading,
      favoriteBusyKey: favoritesManager.state.favoriteBusyKey,
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
      favoriteKeySet: favoritesManager.derived.favoriteKeySet,
      isSessionPending: session.isPending,
      userDisplayName,
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
      handleSignOut,
    },
  }
}
