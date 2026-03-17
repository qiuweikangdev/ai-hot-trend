'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import { FavoritesPanel } from '@/components/trends/dashboard/favorites-panel'
import { LoginModal } from '@/components/trends/dashboard/login-modal'
import { TrendDashboardHeader } from '@/components/trends/dashboard/trend-dashboard-header'
import { TrendFilterPanel } from '@/components/trends/dashboard/trend-filter-panel'
import { TrendResults } from '@/components/trends/dashboard/trend-results'
import { useTrendDashboard } from '@/components/trends/dashboard/use-trend-dashboard'
import { cn } from '@/lib/utils'

interface TrendDashboardProps {
  initialSession: AuthSessionSnapshot | null
}

export function TrendDashboard({ initialSession }: TrendDashboardProps) {
  const {
    uiScale,
    session,
    sourceOptions,
    periodOptions,
    state,
    derived,
    actions,
  } = useTrendDashboard(initialSession)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_6%,rgba(251,191,36,0.12),transparent_30%),radial-gradient(circle_at_92%_10%,rgba(125,211,252,0.14),transparent_28%),linear-gradient(180deg,#f8fafd_0%,#f2f6fb_48%,#edf3fa_100%)] text-slate-800">
      <TrendDashboardHeader
        uiScale={uiScale}
        favoriteCount={derived.favoriteCount}
        isSignedIn={Boolean(session.data?.user)}
        isSessionPending={derived.isSessionPending}
        userDisplayName={derived.userDisplayName}
        onToggleFavorites={actions.handleToggleFavoritesPanel}
        onOpenLogin={() => actions.setIsLoginOpen(true)}
        onSignOut={actions.handleSignOut}
      />

      <main className={cn('mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8', uiScale.pagePadding)}>
        <div className="md:sticky md:top-[88px] md:z-20 md:isolate md:-mx-2 md:px-2 md:pt-2 md:before:absolute md:before:inset-x-0 md:before:-top-2 md:before:bottom-0 md:before:-z-10 md:before:bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(248,250,253,0.94)_70%,rgba(248,250,253,0.68)_100%)] md:before:backdrop-blur-sm">
          <TrendFilterPanel
            uiScale={uiScale}
            sourceOptions={sourceOptions}
            periodOptions={periodOptions}
            sourceValue={state.source}
            period={state.period}
            searchInput={state.searchInput}
            onSearchInputChange={actions.setSearchInput}
            onSelectSource={actions.handleSelectSource}
            onSelectPeriod={actions.setPeriod}
            onSearch={actions.handleSearch}
            onReset={actions.handleResetSearch}
          />
        </div>

        {state.notice
          ? (
              <div className={cn('mt-4 rounded-2xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-blue-700 shadow-[0_16px_35px_-28px_rgba(59,130,246,0.55)]', uiScale.noticeText)}>
                {state.notice}
              </div>
            )
          : null}

        <div className="pointer-events-none mt-4 hidden h-8 rounded-[999px] bg-[radial-gradient(55%_100%_at_50%_0%,rgba(100,116,139,0.15)_0%,rgba(148,163,184,0.06)_45%,transparent_100%)] blur-[0.5px] md:block" />

        <section className="mt-4 pb-10 sm:pb-14">
          <TrendResults
            uiScale={uiScale}
            trendData={state.trendData}
            isTrendLoading={state.isTrendLoading}
            trendError={state.trendError}
            favoriteBusyKey={state.favoriteBusyKey}
            favoriteKeySet={derived.favoriteKeySet}
            onToggleFavorite={actions.handleToggleFavorite}
            onCopyName={actions.handleCopyName}
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
