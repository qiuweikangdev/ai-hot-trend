'use client'

import { FavoritesPanel } from '@/components/trends/dashboard/favorites-panel'
import { LoginModal } from '@/components/trends/dashboard/login-modal'
import { TrendDashboardHeader } from '@/components/trends/dashboard/trend-dashboard-header'
import { TrendFilterPanel } from '@/components/trends/dashboard/trend-filter-panel'
import { TrendResults } from '@/components/trends/dashboard/trend-results'
import { useTrendDashboard } from '@/components/trends/dashboard/use-trend-dashboard'
import { cn } from '@/lib/utils'

export function TrendDashboard() {
  const {
    uiScale,
    session,
    sourceOptions,
    periodOptions,
    state,
    derived,
    actions,
  } = useTrendDashboard()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_16%,rgba(251,207,130,0.24),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(139,205,245,0.25),transparent_24%),linear-gradient(180deg,#f7f9fd_0%,#edf2f9_100%)] text-slate-800">
      <TrendDashboardHeader
        uiScale={uiScale}
        activeSourceLabel={derived.activeSourceMeta.label}
        activeSourceDescription={derived.activeSourceMeta.description}
        favoriteCount={derived.favoriteCount}
        isSignedIn={Boolean(session.data?.user)}
        userDisplayName={derived.userDisplayName}
        onToggleFavorites={actions.handleToggleFavoritesPanel}
        onOpenLogin={() => actions.setIsLoginOpen(true)}
        onSignOut={actions.handleSignOut}
      />

      <main className={cn('mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8', uiScale.pagePadding)}>
        <TrendFilterPanel
          uiScale={uiScale}
          sourceOptions={sourceOptions}
          periodOptions={periodOptions}
          sourceLabel={derived.activeSourceMeta.label}
          sourceValue={state.source}
          period={state.period}
          searchInput={state.searchInput}
          selectedLanguageLabel={derived.selectedLanguageLabel}
          selectedKeywordLabel={derived.selectedKeywordLabel}
          language={state.language}
          visibleQuickLanguages={derived.visibleQuickLanguages}
          expandedQuickFilter={state.expandedQuickFilter}
          onSearchInputChange={actions.setSearchInput}
          onSelectSource={actions.handleSelectSource}
          onSelectPeriod={actions.setPeriod}
          onSearch={actions.handleSearch}
          onReset={actions.handleResetSearch}
          onSelectLanguage={actions.setLanguage}
          onToggleQuickFilters={() => actions.setExpandedQuickFilter(value => !value)}
        />

        {state.notice
          ? (
              <div className={cn('mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-blue-700', uiScale.noticeText)}>
                {state.notice}
              </div>
            )
          : null}

        <section className="mt-6">
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
