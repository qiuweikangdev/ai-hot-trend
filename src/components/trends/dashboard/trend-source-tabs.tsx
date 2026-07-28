'use client'

import type { TrendSourceOption } from '@/modules/trends/catalog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isTrendSource } from '@/modules/trends/types'

interface TrendSourceTabsProps {
  sourceOptions: TrendSourceOption[]
  sourceValue: string
  onSelectSource: (value: string, enabled: boolean, label: string) => void
}

export function TrendSourceTabs({
  sourceOptions,
  sourceValue,
  onSelectSource,
}: TrendSourceTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const tabsRef = useRef<HTMLElement | null>(null)
  const [overflowState, setOverflowState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })

  const updateOverflowState = useCallback(() => {
    const container = tabsRef.current

    if (!container) {
      return
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth

    setOverflowState({
      hasOverflow: maxScrollLeft > 2,
      canScrollLeft: container.scrollLeft > 2,
      canScrollRight: container.scrollLeft < maxScrollLeft - 2,
    })
  }, [])

  useEffect(() => {
    const container = tabsRef.current

    if (!container) {
      return
    }

    const frameId = window.requestAnimationFrame(updateOverflowState)
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateOverflowState)
      : null

    container.addEventListener('scroll', updateOverflowState, { passive: true })
    window.addEventListener('resize', updateOverflowState)
    observer?.observe(container)

    return () => {
      window.cancelAnimationFrame(frameId)
      container.removeEventListener('scroll', updateOverflowState)
      window.removeEventListener('resize', updateOverflowState)
      observer?.disconnect()
    }
  }, [sourceOptions.length, updateOverflowState])

  const handleScrollTabs = useCallback((direction: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: direction === 'left' ? -240 : 240,
      behavior: 'smooth',
    })
  }, [])

  const handleSelectWithRoute = useCallback((value: string, enabled: boolean, label: string) => {
    onSelectSource(value, enabled, label)

    if (!enabled || !isTrendSource(value)) {
      return
    }

    const nextPath = `/${value}`

    if (pathname !== nextPath) {
      router.push(nextPath)
    }
  }, [onSelectSource, pathname, router])

  return (
    <div className="relative min-w-0 border-b border-border/80">
      <nav
        ref={tabsRef}
        aria-label="热点来源"
        className={cn(
          'flex min-w-0 items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          overflowState.hasOverflow && 'px-9',
        )}
      >
        {sourceOptions.map((option) => {
          const isEnabled = option.enabled ?? true
          const isActive = isEnabled && option.value === sourceValue

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'relative h-10 shrink-0 border-b-2 border-transparent px-0.5 text-[13px] font-medium transition-colors',
                isEnabled
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'cursor-not-allowed text-muted-foreground/40',
                isActive && 'border-foreground text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleSelectWithRoute(option.value, isEnabled, option.label)}
              disabled={!isEnabled}
            >
              {option.label}
            </button>
          )
        })}
      </nav>

      {overflowState.hasOverflow
        ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 size-8 -translate-y-1/2 rounded-md bg-background text-muted-foreground shadow-[4px_0_8px_var(--background)] disabled:opacity-30"
                disabled={!overflowState.canScrollLeft}
                onClick={() => handleScrollTabs('left')}
                aria-label="向左滚动来源"
              >
                <ChevronLeft className="size-4" strokeWidth={1.75} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 size-8 -translate-y-1/2 rounded-md bg-background text-muted-foreground shadow-[-4px_0_8px_var(--background)] disabled:opacity-30"
                disabled={!overflowState.canScrollRight}
                onClick={() => handleScrollTabs('right')}
                aria-label="向右滚动来源"
              >
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </Button>
            </>
          )
        : null}
    </div>
  )
}
