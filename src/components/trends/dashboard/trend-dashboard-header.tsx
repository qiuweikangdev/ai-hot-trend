'use client'

import type { TrendUiScale } from '@/config/trends'
import { Heart, LoaderCircle, LogIn, LogOut, Moon, Settings, Sun, UserCircle2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
  onOpenNotifications: () => void
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
  onOpenNotifications,
  onSignOut,
}: TrendDashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 min-h-14 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className={cn('mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6', uiScale.headerPadding)}>
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/icon.png"
            alt=""
            width={28}
            height={28}
            priority
            aria-hidden="true"
            className="size-7 shrink-0 rounded-md object-cover"
          />
          <h1 className="truncate text-sm font-medium tracking-[-0.01em] text-foreground">热点趋势</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-9 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="切换主题" title="切换主题" onClick={onToggleTheme}>
            <Sun className="size-4 dark:hidden" strokeWidth={1.75} />
            <Moon className="hidden size-4 dark:block" strokeWidth={1.75} />
          </Button>

          <Button type="button" variant="ghost" className="h-9 rounded-md px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onToggleFavorites}>
            <Heart className="size-4" strokeWidth={1.75} />
            <span className="hidden text-sm sm:inline">收藏</span>
            {favoriteCount > 0 ? <span className="min-w-4 text-center text-xs tabular-nums">{favoriteCount}</span> : null}
          </Button>

          {isSessionPending && !isSignedIn
            ? (
                <span className="grid size-9 place-items-center text-muted-foreground" aria-label="正在检查会话">
                  <LoaderCircle className="size-4 animate-spin" />
                </span>
              )
            : null}

          {isSignedIn
            ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-9 rounded-md p-1" aria-label="账户菜单">
                      {userAvatarUrl
                        ? <Image src={userAvatarUrl} alt={userDisplayName} width={28} height={28} className="size-7 rounded-full object-cover" />
                        : <UserCircle2 className="size-5 text-muted-foreground" strokeWidth={1.75} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-lg">
                    <DropdownMenuItem onClick={onOpenNotifications}>
                      <Settings className="size-4" />
                      推送设置
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSignOut}>
                      <LogOut className="size-4" />
                      退出
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : (
                <Button type="button" variant="ghost" className="h-9 rounded-md px-3 text-sm font-medium" onClick={onOpenLogin}>
                  <LogIn className="size-4" strokeWidth={1.75} />
                  登录
                </Button>
              )}
        </div>
      </div>
    </header>
  )
}
