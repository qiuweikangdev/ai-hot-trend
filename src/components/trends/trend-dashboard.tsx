'use client'

import type { CSSProperties } from 'react'
import type { AuthSessionSnapshot } from '@/lib/auth-session'
import { useEffect, useState } from 'react'
import { FavoritesPanel } from '@/components/trends/dashboard/favorites-panel'
import { LoginModal } from '@/components/trends/dashboard/login-modal'
import { TrendDashboardHeader } from '@/components/trends/dashboard/trend-dashboard-header'
import { TrendFilterPanel } from '@/components/trends/dashboard/trend-filter-panel'
import { TrendResults } from '@/components/trends/dashboard/trend-results'
import { useTrendDashboard } from '@/components/trends/dashboard/use-trend-dashboard'
import { TREND_DASHBOARD_LAYOUT } from '@/config/trends'
import { cn } from '@/lib/utils'

interface TrendDashboardProps {
  initialSession: AuthSessionSnapshot
  initialIsDarkTheme: boolean
}

export function TrendDashboard({ initialSession, initialIsDarkTheme }: TrendDashboardProps) {
  const {
    uiScale,
    session,
    sourceOptions,
    periodOptions,
    state,
    derived,
    actions,
  } = useTrendDashboard(initialSession)
  const [isDarkTheme, setIsDarkTheme] = useState(initialIsDarkTheme)

  function handleToggleTheme() {
    setIsDarkTheme((value) => {
      const nextValue = !value
      document.cookie = `trend-theme=${nextValue ? 'dark' : 'light'}; Path=/; Max-Age=31536000; SameSite=Lax`
      return nextValue
    })
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme)
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light'
  }, [isDarkTheme])

  const stickyFilterStyle: CSSProperties = {
    top: `${TREND_DASHBOARD_LAYOUT.headerStickyOffsetPx + TREND_DASHBOARD_LAYOUT.filterStickyGapPx}px`,
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800 dark:bg-[#020407] dark:text-slate-100">
      <TrendDashboardHeader
        uiScale={uiScale}
        favoriteCount={derived.favoriteCount}
        isSignedIn={Boolean(session.data?.user)}
        isSessionPending={derived.isSessionPending}
        userDisplayName={derived.userDisplayName}
        onToggleTheme={handleToggleTheme}
        onToggleFavorites={actions.handleToggleFavoritesPanel}
        onOpenLogin={() => actions.setIsLoginOpen(true)}
        onSignOut={actions.handleSignOut}
      />

      <main className={cn('mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8', uiScale.pagePadding)}>
        <div style={stickyFilterStyle} className="md:sticky md:z-20 md:-mx-2 md:relative md:isolate md:bg-[#f7f9fc] md:px-2 md:py-2 dark:md:bg-[#020407] md:before:absolute md:before:inset-0 md:before:-z-10 md:before:bg-[#f7f9fc] dark:md:before:bg-[#020407] md:before:content-[''] md:after:absolute md:after:-top-4 md:after:inset-x-0 md:after:h-4 md:after:bg-[#f7f9fc] dark:md:after:bg-[#020407] md:after:content-['']">
          <TrendFilterPanel
            uiScale={uiScale}
            sourceOptions={sourceOptions}
            sourceValue={state.source}
            periodOptions={periodOptions}
            period={state.period}
            searchInput={state.searchInput}
            onSelectSource={actions.handleSelectSource}
            onSearchInputChange={actions.setSearchInput}
            onSelectPeriod={actions.setPeriod}
            onSearch={actions.handleSearch}
            onReset={actions.handleResetSearch}
          />
        </div>

        {state.notice
          ? (
              <div className={cn('mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200', uiScale.noticeText)}>
                {state.notice}
              </div>
            )
          : null}

        <section className="mt-5 pb-8 sm:pb-10">
          <TrendResults
            uiScale={uiScale}
            trendData={state.trendData}
            isTrendLoading={state.isTrendLoading}
            trendError={state.trendError}
            isLoadingMore={state.isLoadingMore}
            hasMore={state.hasMore}
            favoriteBusyKey={state.favoriteBusyKey}
            favoriteKeySet={derived.favoriteKeySet}
            onToggleFavorite={actions.handleToggleFavorite}
            onCopyName={actions.handleCopyName}
            onLoadMore={actions.handleLoadMore}
          />
        </section>
      </main>

      <FavoritesPanel
        isOpen={state.isFavoritesOpen}
        uiScale={uiScale}
        favorites={state.favorites}
        isFavoriteLoading={state.isFavoriteLoading}
        favoriteBusyKey={state.favoriteBusyKey}
        onClose={() => actions.setIsFavoritesOpen(false)}
        onRemoveFavorite={actions.handleRemoveFavorite}
      />

      <LoginModal
        isOpen={state.isLoginOpen}
        isSignedIn={Boolean(session.data?.user)}
        isSessionPending={session.isPending}
        onClose={() => actions.setIsLoginOpen(false)}
      />
    </div>
  )
}
