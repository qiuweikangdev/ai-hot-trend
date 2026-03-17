'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TrendSegmentedOption {
  value: string
  label: string
  enabled?: boolean
}

interface TrendSegmentedControlProps {
  label: string
  prefixLabel?: string
  items: TrendSegmentedOption[]
  activeValue: string
  textClassName?: string
  showEdgeControls?: boolean
  stretch?: boolean
  onSelect: (item: TrendSegmentedOption) => void
}

export function TrendSegmentedControl({
  label,
  prefixLabel,
  items,
  activeValue,
  textClassName,
  showEdgeControls,
  stretch = true,
  onSelect,
}: TrendSegmentedControlProps) {
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollByStep = (direction: 'left' | 'right') => {
    const container = listRef.current
    if (!container) {
      return
    }

    const distance = Math.max(120, Math.floor(container.clientWidth * 0.6))
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
    const nextLeft = direction === 'left'
      ? Math.max(0, container.scrollLeft - distance)
      : Math.min(maxScrollLeft, container.scrollLeft + distance)

    container.scrollTo({
      left: nextLeft,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const container = listRef.current
    if (!container) {
      return
    }

    const activeTab = container.querySelector<HTMLButtonElement>(`button[data-segment-value="${activeValue}"]`)
    activeTab?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeValue])

  if (showEdgeControls) {
    return (
      <div
        className="grid w-full min-w-0 max-w-full grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-1 overflow-hidden rounded-full border border-slate-200/70 bg-white/66 p-1"
        role="tablist"
        aria-label={label}
      >
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-[0_10px_18px_-14px_rgba(15,23,42,0.26)] transition hover:text-slate-800"
          aria-label="向左滚动"
          onClick={() => scrollByStep('left')}
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={listRef}
          className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          <div className="inline-flex w-max items-center gap-1 pr-1">
            {prefixLabel
              ? <span className="shrink-0 px-2.5 text-[11px] text-slate-400">{prefixLabel}</span>
              : null}

            {items.map((item) => {
              const isEnabled = item.enabled ?? true
              const isActive = isEnabled && item.value === activeValue

              return (
                <button
                  key={item.value}
                  type="button"
                  data-segment-value={item.value}
                  className={cn(
                    'inline-flex h-8 shrink-0 snap-start items-center justify-center rounded-full px-3 text-xs font-medium transition sm:px-4',
                    textClassName,
                    isEnabled
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'cursor-not-allowed text-slate-300',
                    isActive && 'bg-blue-600 text-white shadow-[0_10px_18px_-14px_rgba(37,99,235,0.9)] hover:bg-blue-600 hover:text-white',
                  )}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelect(item)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-[0_10px_18px_-14px_rgba(15,23,42,0.26)] transition hover:text-slate-800"
          aria-label="向右滚动"
          onClick={() => scrollByStep('right')}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/66 p-1',
          stretch ? 'min-w-full' : 'min-w-max',
        )}
        role="tablist"
        aria-label={label}
      >
        {prefixLabel
          ? <span className="shrink-0 px-2.5 text-[11px] text-slate-400">{prefixLabel}</span>
          : null}

        {items.map((item) => {
          const isEnabled = item.enabled ?? true
          const isActive = isEnabled && item.value === activeValue

          return (
            <button
              key={item.value}
              type="button"
              className={cn(
                'inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs font-medium transition sm:px-4',
                textClassName,
                isEnabled
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'cursor-not-allowed text-slate-300',
                isActive && 'bg-blue-600 text-white shadow-[0_10px_18px_-14px_rgba(37,99,235,0.9)] hover:bg-blue-600 hover:text-white',
              )}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
