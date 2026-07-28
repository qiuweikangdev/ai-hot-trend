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

    container.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const activeTab = listRef.current?.querySelector<HTMLButtonElement>(`button[data-segment-value="${activeValue}"]`)

    activeTab?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeValue])

  const segmentItems = (
    <>
      {prefixLabel ? <span className="shrink-0 px-2 text-[11px] text-muted-foreground">{prefixLabel}</span> : null}
      {items.map((item) => {
        const isEnabled = item.enabled ?? true
        const isActive = isEnabled && item.value === activeValue

        return (
          <button
            key={item.value}
            type="button"
            data-segment-value={item.value}
            className={cn(
              'inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2.5 text-xs font-medium transition-colors',
              textClassName,
              isEnabled
                ? 'text-muted-foreground hover:text-foreground'
                : 'cursor-not-allowed text-muted-foreground/40',
              isActive && 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:text-foreground dark:bg-accent',
            )}
            role="tab"
            aria-selected={isActive}
            disabled={!isEnabled}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </button>
        )
      })}
    </>
  )

  if (showEdgeControls) {
    return (
      <div className="grid w-full min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5" role="tablist" aria-label={label}>
        <button type="button" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground" aria-label="向左滚动" onClick={() => scrollByStep('left')}>
          <ChevronLeft className="size-3.5" strokeWidth={1.75} />
        </button>
        <div ref={listRef} className="min-w-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex w-max items-center gap-0.5">{segmentItems}</div>
        </div>
        <button type="button" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground" aria-label="向右滚动" onClick={() => scrollByStep('right')}>
          <ChevronRight className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        ref={listRef}
        className={cn(
          'inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5',
          stretch ? 'min-w-full' : 'min-w-max',
        )}
        role="tablist"
        aria-label={label}
      >
        {segmentItems}
      </div>
    </div>
  )
}
