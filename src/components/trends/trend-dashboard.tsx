'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import type { TrendResult, TrendSource } from '@/modules/trends/types'
import { useEffect, useState } from 'react'
import { NotificationSettingsModal } from '@/components/notifications/notification-settings-modal'
import { FavoritesPanel } from '@/components/trends/dashboard/favorites-panel'
import { LoginModal } from '@/components/trends/dashboard/login-modal'
import { TrendDashboardHeader } from '@/components/trends/dashboard/trend-dashboard-header'
import { TrendFilterPanel } from '@/components/trends/dashboard/trend-filter-panel'
import { TrendResults } from '@/components/trends/dashboard/trend-results'
import { useTrendDashboard } from '@/components/trends/dashboard/use-trend-dashboard'
import { cn } from '@/lib/utils'

interface TrendDashboardProps {
  initialSession: AuthSessionSnapshot
  initialIsDarkTheme: boolean
  initialSource?: TrendSource
  initialTrendData: TrendResult
}

export function TrendDashboard({
  initialSession,
  initialIsDarkTheme,
  initialSource,
  initialTrendData,
}: TrendDashboardProps) {
  const {
    uiScale,
    session,
    sourceOptions,
    periodOptions,
    state,
    derived,
    actions,
  } = useTrendDashboard(initialSession, initialSource, initialTrendData)
  const [isDarkTheme, setIsDarkTheme] = useState(initialIsDarkTheme)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TrendDashboardHeader
        uiScale={uiScale}
        favoriteCount={derived.favoriteCount}
        isSignedIn={Boolean(session.data?.user)}
        isSessionPending={derived.isSessionPending}
        userDisplayName={derived.userDisplayName}
        userAvatarUrl={derived.userAvatarUrl}
        onToggleTheme={handleToggleTheme}
        onToggleFavorites={actions.handleToggleFavoritesPanel}
        onOpenLogin={() => actions.setIsLoginOpen(true)}
        onOpenNotifications={() => setIsNotificationSettingsOpen(true)}
        onSignOut={actions.handleSignOut}
      />

      <main className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6', uiScale.pagePadding)}>
        <div className="md:sticky md:top-14 md:z-20 md:-mx-2 md:bg-background/95 md:px-2 md:py-2 md:backdrop-blur-sm">
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

        <section className="mt-4 pb-8 sm:pb-10">
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
            onCopyTrend={actions.handleCopyTrend}
            onLoadMore={actions.handleLoadMore}
          />
        </section>
      </main>

      <NotificationSettingsModal isOpen={isNotificationSettingsOpen} onClose={() => setIsNotificationSettingsOpen(false)} />

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
