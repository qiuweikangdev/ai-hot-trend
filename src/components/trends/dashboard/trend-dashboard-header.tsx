'use client'

import type { TrendUiScale } from '@/config/trends'
import { Heart, LoaderCircle, LogIn, LogOut, Moon, Sparkles, Sun, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TREND_DASHBOARD_LAYOUT } from '@/config/trends'
import { cn } from '@/lib/utils'

interface TrendDashboardHeaderProps {
  uiScale: TrendUiScale
  favoriteCount: number
  isSignedIn: boolean
  isSessionPending: boolean
  userDisplayName: string
  userAvatarUrl: string
  onToggleTheme: () => void
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
  userAvatarUrl,
  onToggleTheme,
  onToggleFavorites,
  onOpenLogin,
  onSignOut,
}: TrendDashboardHeaderProps) {
  return (
    <header style={{ minHeight: `${TREND_DASHBOARD_LAYOUT.headerStickyOffsetPx}px` }} className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-white/8 dark:bg-[#020407]/96">
      <div className={cn('mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-4 sm:px-6 lg:px-8', uiScale.headerPadding)}>
        <div className="flex items-center justify-between gap-3">
          <div className="group/brand flex min-w-0 items-center gap-4">
            <div className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 transition-transform duration-300 group-hover/brand:-translate-y-0.5 dark:border-white/10 dark:bg-[#0a0f16]', uiScale.logoSize)}>
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_25%,rgba(59,130,246,0.14),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover/brand:opacity-100 dark:bg-[radial-gradient(circle_at_30%_25%,rgba(96,165,250,0.2),transparent_55%)]" />
              <div className="grid size-full place-items-center rounded-xl bg-[linear-gradient(140deg,#ffe2a6_0%,#ffcb75_58%,#9de9cd_100%)] shadow-[0_10px_18px_-14px_rgba(15,23,42,0.5)] dark:bg-[linear-gradient(140deg,#1f2f52_0%,#234b73_58%,#2c6a63_100%)]">
                <Sparkles className={cn('text-slate-800 motion-safe:animate-[spin_18s_linear_infinite] transition-transform duration-300 group-hover/brand:scale-110 group-hover/brand:rotate-6 dark:text-slate-100', uiScale.logoIcon)} />
              </div>
            </div>

            <div className="min-w-0 shrink-0 pr-2">
              <h1 className={cn('truncate text-[30px] font-semibold leading-none tracking-tight text-slate-950 dark:text-white', uiScale.title)}>热点趋势</h1>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-full border-slate-200/90 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-white/15 dark:bg-[#0c1118] dark:text-slate-300 dark:hover:border-white/25 dark:hover:bg-[#141a24] dark:hover:text-white sm:size-10"
              aria-label="切换主题"
              onClick={onToggleTheme}
            >
              <Sun className="size-3.5 dark:hidden" strokeWidth={1.9} />
              <Moon className="hidden size-3.5 dark:block" strokeWidth={1.9} />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-slate-200/85 bg-white px-3 text-slate-700 dark:border-white/15 dark:bg-[#0c1118] dark:text-slate-200 sm:h-11 sm:px-4"
              onClick={onToggleFavorites}
            >
              <Heart className="size-4" />
              <span className="hidden sm:inline">收藏中心</span>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">{favoriteCount}</span>
            </Button>

            {isSessionPending && !isSignedIn
              ? (
                  <div className={cn('hidden h-10 items-center gap-2 rounded-full border border-slate-200/85 bg-white px-3 text-slate-500 dark:border-white/15 dark:bg-[#0c1118] dark:text-slate-400 sm:inline-flex md:h-11', uiScale.userInfo)}>
                    <LoaderCircle className="size-4 animate-spin text-blue-600" />
                    检查会话
                  </div>
                )
              : null}

            {isSignedIn
              ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 rounded-full border-slate-200/85 bg-white p-0 dark:border-white/15 dark:bg-[#0c1118] sm:h-11 sm:w-11"
                      >
                        {userAvatarUrl
                          ? (
                              <img
                                src={userAvatarUrl}
                                alt={userDisplayName}
                                className="size-full rounded-full object-cover"
                              />
                            )
                          : (
                              <UserCircle2 className="size-5 text-slate-500" />
                            )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={onSignOut}>
                        <LogOut className="size-4 mr-2" />
                        退出登录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              : (
                  <Button type="button" className="h-10 rounded-full bg-[#0f2345] px-4 text-white hover:bg-[#0c1d3a] dark:border dark:border-white/15 dark:bg-[#0d121b] dark:hover:bg-[#161d2a] sm:h-11 sm:px-5" onClick={onOpenLogin}>
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
