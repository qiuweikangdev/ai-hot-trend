'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendPeriodOption } from '@/modules/trends/catalog'
import type { TrendPeriod } from '@/modules/trends/types'
import { TrendSearchBox } from './trend-search-box'
import { TrendSegmentedControl } from './trend-segmented-control'

interface TrendFilterPanelProps {
  uiScale: TrendUiScale
  periodOptions: TrendPeriodOption[]
  period: TrendPeriod
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSelectPeriod: (value: TrendPeriod) => void
  onSearch: () => void
  onReset: () => void
}

export function TrendFilterPanel({
  uiScale,
  periodOptions,
  period,
  searchInput,
  onSearchInputChange,
  onSelectPeriod,
  onSearch,
  onReset,
}: TrendFilterPanelProps) {
  return (
    <section className="border-b border-slate-200/80 bg-[#f7f9fc] pb-6 dark:border-white/8 dark:bg-[#020407]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <TrendSearchBox
          uiScale={uiScale}
          value={searchInput}
          onChange={onSearchInputChange}
          onSearch={onSearch}
          onReset={onReset}
        />

        <div className="min-w-0 overflow-x-auto lg:justify-self-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TrendSegmentedControl
            label="时间范围"
            items={periodOptions}
            activeValue={period}
            textClassName={uiScale.tabText}
            stretch={false}
            onSelect={item => onSelectPeriod(item.value as TrendPeriod)}
          />
        </div>
      </div>
    </section>
  )
}
