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
  const enabledSourceOptions = sourceOptions.filter(option => option.enabled)

  return (
    <section className="border-b border-border/80 bg-background pb-4">
      <TrendSourceTabs
        sourceOptions={enabledSourceOptions}
        sourceValue={sourceValue}
        onSelectSource={onSelectSource}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-lg">
          <TrendSearchBox
            uiScale={uiScale}
            value={searchInput}
            onChange={onSearchInputChange}
            onSearch={onSearch}
            onReset={onReset}
          />
        </div>

        <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
