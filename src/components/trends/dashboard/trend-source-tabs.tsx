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
    const hasOverflow = maxScrollLeft > 2
    const canScrollLeft = container.scrollLeft > 2
    const canScrollRight = container.scrollLeft < maxScrollLeft - 2

    setOverflowState({
      hasOverflow,
      canScrollLeft,
      canScrollRight,
    })
  }, [])

  useEffect(() => {
    const container = tabsRef.current

    if (!container) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      updateOverflowState()
    })

    const onScroll = () => {
      updateOverflowState()
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateOverflowState)

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          updateOverflowState()
        })
      : null

    observer?.observe(container)

    return () => {
      window.cancelAnimationFrame(frameId)
      container.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateOverflowState)
      observer?.disconnect()
    }
  }, [sourceOptions.length, updateOverflowState])

  const handleScrollTabs = useCallback((direction: 'left' | 'right') => {
    const container = tabsRef.current

    if (!container) {
      return
    }

    container.scrollBy({
      left: direction === 'left' ? -220 : 220,
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
    <div className="relative min-w-0">
      {overflowState.hasOverflow
        ? (
            <>
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#f7f9fc] via-[#f7f9fc]/95 to-transparent dark:from-[#020407] dark:via-[#020407]/95" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#f7f9fc] via-[#f7f9fc]/95 to-transparent dark:from-[#020407] dark:via-[#020407]/95" />
            </>
          )
        : null}

      <nav
        ref={tabsRef}
        className={cn(
          'flex min-w-0 items-center gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          overflowState.hasOverflow && 'px-10',
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
                'group/tab relative shrink-0 text-[13px] font-medium transition-all duration-150',
                isEnabled
                  ? 'text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 rounded-lg px-2 py-1'
                  : 'cursor-not-allowed text-slate-300 dark:text-slate-700',
                isActive && 'text-slate-900 dark:text-white font-semibold',
              )}
              onClick={() => handleSelectWithRoute(option.value, isEnabled, option.label)}
              disabled={!isEnabled}
            >
              {option.label}
              <span className={cn(
                'absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-200',
                isActive
                  ? 'w-full -translate-x-1/2 bg-blue-600 dark:bg-white'
                  : 'w-0 bg-slate-400 dark:bg-slate-500 group-hover/tab:w-5',
              )}
              />
            </button>
          )
        })}
      </nav>

      {overflowState.hasOverflow
        ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border-slate-200/90 bg-white/95 text-slate-500 backdrop-blur hover:border-slate-300 hover:text-slate-800 disabled:opacity-35 dark:border-white/15 dark:bg-[#0b1018]/95 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white"
                disabled={!overflowState.canScrollLeft}
                onClick={() => handleScrollTabs('left')}
                aria-label="向左滚动趋势源"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border-slate-200/90 bg-white/95 text-slate-500 backdrop-blur hover:border-slate-300 hover:text-slate-800 disabled:opacity-35 dark:border-white/15 dark:bg-[#0b1018]/95 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white"
                disabled={!overflowState.canScrollRight}
                onClick={() => handleScrollTabs('right')}
                aria-label="向右滚动趋势源"
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )
        : null}
    </div>
  )
}
