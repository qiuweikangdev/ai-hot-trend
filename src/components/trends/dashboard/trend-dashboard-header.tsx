'use client'

import type { TrendUiScale } from '@/config/trends'
import { Heart, LoaderCircle, LogIn, LogOut, Sparkles, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TrendDashboardHeaderProps {
  uiScale: TrendUiScale
  favoriteCount: number
  isSignedIn: boolean
  isSessionPending: boolean
  userDisplayName: string
  onToggleFavorites: () => void
  onOpenLogin: () => void
  onSignOut: () => void
}

export function TrendDashboardHeader({
  uiScale,
  favoriteCount,
  isSignedIn,
  isSessionPending,
  userDisplayName,
  onToggleFavorites,
  onOpenLogin,
  onSignOut,
}: TrendDashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/72">
      <div className={cn('mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 sm:px-6 lg:px-8', uiScale.headerPadding)}>
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className={cn('grid shrink-0 place-items-center rounded-[30px] border border-slate-200/80 bg-white/88 p-1.5 shadow-[0_14px_26px_-22px_rgba(15,23,42,0.36)]', uiScale.logoSize)}>
              <div className="grid size-full place-items-center rounded-[22px] bg-[linear-gradient(145deg,#ffd17b_0%,#ffc36d_45%,#8fe0c4_100%)] shadow-[0_18px_30px_-20px_rgba(34,105,84,0.7)] ring-1 ring-white/80">
                <Sparkles className={cn('text-slate-800', uiScale.logoIcon)} />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className={cn('truncate font-semibold leading-none tracking-tight text-slate-950', uiScale.title)}>热点趋势</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-slate-200/85 bg-white/84 px-4 text-slate-700 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.42)]"
              onClick={onToggleFavorites}
            >
              <Heart className="size-4" />
              <span className="hidden sm:inline">收藏中心</span>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">{favoriteCount}</span>
            </Button>

            {isSessionPending && !isSignedIn
              ? (
                  <div className={cn('hidden h-11 items-center gap-2 rounded-2xl border border-slate-200/85 bg-white/84 px-3 text-slate-500 sm:inline-flex', uiScale.userInfo)}>
                    <LoaderCircle className="size-4 animate-spin text-blue-600" />
                    检查会话
                  </div>
                )
              : null}

            {isSignedIn
              ? (
                  <>
                    <div className={cn('hidden items-center gap-2 rounded-2xl border border-slate-200/85 bg-white/84 px-3 py-2 text-slate-700 lg:flex', uiScale.userInfo)}>
                      <UserCircle2 className="size-4 text-slate-500" />
                      <span className="max-w-32 truncate">{userDisplayName}</span>
                    </div>
                    <Button type="button" variant="outline" className="h-11 rounded-2xl border-slate-200/85 bg-white/84 px-4" onClick={onSignOut}>
                      <LogOut className="size-4" />
                      退出
                    </Button>
                  </>
                )
              : (
                  <Button type="button" className="h-11 rounded-2xl bg-slate-900 px-4 text-white shadow-[0_14px_28px_-20px_rgba(15,23,42,0.85)] hover:bg-slate-800" onClick={onOpenLogin}>
                    <LogIn className="size-4" />
                    登录
                  </Button>
                )}
          </div>
        </div>
      </div>
    </header>
  )
}
