'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendPeriodOption, TrendSourceOption } from '@/modules/trends/catalog'
import type { TrendPeriod } from '@/modules/trends/types'
import { TrendSearchBox } from './trend-search-box'
import { TrendSegmentedControl } from './trend-segmented-control'
import { TrendSourceTabs } from './trend-source-tabs'

interface TrendFilterPanelProps {
  uiScale: TrendUiScale
  sourceOptions: TrendSourceOption[]
  sourceValue: string
  periodOptions: TrendPeriodOption[]
  period: TrendPeriod
  searchInput: string
  onSelectSource: (value: string, enabled: boolean, label: string) => void
  onSearchInputChange: (value: string) => void
  onSelectPeriod: (value: TrendPeriod) => void
  onSearch: () => void
  onReset: () => void
}

export function TrendFilterPanel({
  uiScale,
  sourceOptions,
  sourceValue,
  periodOptions,
  period,
  searchInput,
  onSelectSource,
  onSearchInputChange,
  onSelectPeriod,
  onSearch,
  onReset,
}: TrendFilterPanelProps) {
  const primarySourceOptions = sourceOptions.filter(option => ['github', 'npm', 'vue', 'react', 'node', 'ai', 'python', 'component', 'zhihu', 'juejin', 'v2ex', 'weibo'].includes(option.value))

  return (
    <section className="border-b border-slate-200/80 bg-[#f7f9fc] pb-6 dark:border-white/8 dark:bg-[#020407]">
      <div className="mb-3">
        <TrendSourceTabs
          sourceOptions={primarySourceOptions}
          sourceValue={sourceValue}
          onSelectSource={onSelectSource}
        />
      </div>

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
