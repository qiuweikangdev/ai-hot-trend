'use client'

import type { TrendUiScale } from '@/config/trends'
import { Heart, LogIn, LogOut, Sparkles, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TrendDashboardHeaderProps {
  uiScale: TrendUiScale
  activeSourceLabel: string
  activeSourceDescription: string
  favoriteCount: number
  isSignedIn: boolean
  userDisplayName: string
  onToggleFavorites: () => void
  onOpenLogin: () => void
  onSignOut: () => void
}

export function TrendDashboardHeader({
  uiScale,
  activeSourceLabel,
  activeSourceDescription,
  favoriteCount,
  isSignedIn,
  userDisplayName,
  onToggleFavorites,
  onOpenLogin,
  onSignOut,
}: TrendDashboardHeaderProps) {
  return (
    <header className="border-b border-white/70 bg-white/70 backdrop-blur-md">
      <div className={cn('mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8', uiScale.headerPadding)}>
        <div className="flex items-center gap-3">
          <div className={cn('grid place-items-center rounded-2xl bg-[linear-gradient(145deg,#ffd17b_0%,#ffc36d_45%,#8fe0c4_100%)] shadow-[0_14px_25px_-16px_rgba(34,105,84,0.6)]', uiScale.logoSize)}>
            <Sparkles className={cn('text-slate-800', uiScale.logoIcon)} />
          </div>
          <div>
            <h1 className={cn('font-semibold tracking-tight text-slate-900', uiScale.title)}>热点趋势</h1>
            <p className={cn('text-slate-500', uiScale.subtitle)}>
              模块化趋势系统 · 当前
              {' '}
              {activeSourceLabel}
            </p>
            <p className="text-xs text-slate-400">{activeSourceDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-slate-200 bg-white/90 px-4"
            onClick={onToggleFavorites}
          >
            <Heart className="size-4" />
            收藏中心
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{favoriteCount}</span>
          </Button>

          {isSignedIn
            ? (
                <>
                  <div className={cn('hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-slate-700 md:flex', uiScale.userInfo)}>
                    <UserCircle2 className="size-4 text-slate-500" />
                    {userDisplayName}
                  </div>
                  <Button type="button" variant="outline" className="rounded-2xl border-slate-200 bg-white/90" onClick={onSignOut}>
                    <LogOut className="size-4" />
                    退出
                  </Button>
                </>
              )
            : (
                <Button type="button" className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={onOpenLogin}>
                  <LogIn className="size-4" />
                  登录
                </Button>
              )}
        </div>
      </div>
    </header>
  )
}
