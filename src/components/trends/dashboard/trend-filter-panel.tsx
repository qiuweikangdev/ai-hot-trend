'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendPeriodOption, TrendSourceOption } from '@/modules/trends/catalog'
import type { TrendPeriod } from '@/modules/trends/types'
import { TrendSearchBox } from './trend-search-box'
import { TrendSegmentedControl } from './trend-segmented-control'

interface TrendFilterPanelProps {
  uiScale: TrendUiScale
  sourceOptions: TrendSourceOption[]
  periodOptions: TrendPeriodOption[]
  sourceValue: string
  period: TrendPeriod
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSelectSource: (value: string, enabled: boolean, label: string) => void
  onSelectPeriod: (value: TrendPeriod) => void
  onSearch: () => void
  onReset: () => void
}

export function TrendFilterPanel({
  uiScale,
  sourceOptions,
  periodOptions,
  sourceValue,
  period,
  searchInput,
  onSearchInputChange,
  onSelectSource,
  onSelectPeriod,
  onSearch,
  onReset,
}: TrendFilterPanelProps) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.74)_0%,rgba(249,252,255,0.7)_55%,rgba(243,248,255,0.76)_100%)] p-4 shadow-[0_22px_52px_-42px_rgba(30,64,175,0.35)] ring-1 ring-slate-200/55 backdrop-blur-md sm:p-5">
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="xl:hidden">
            <TrendSegmentedControl
              label="热点来源"
              prefixLabel="热点"
              items={sourceOptions}
              activeValue={sourceValue}
              textClassName={uiScale.tabText}
              showEdgeControls
              onSelect={item => onSelectSource(item.value, item.enabled ?? true, item.label)}
            />
          </div>

          <div className="hidden xl:block">
            <TrendSegmentedControl
              label="热点来源"
              prefixLabel="热点"
              items={sourceOptions}
              activeValue={sourceValue}
              textClassName={uiScale.tabText}
              onSelect={item => onSelectSource(item.value, item.enabled ?? true, item.label)}
            />
          </div>

          <TrendSegmentedControl
            label="时间范围"
            prefixLabel="时间"
            items={periodOptions}
            activeValue={period}
            textClassName={uiScale.tabText}
            stretch={false}
            onSelect={item => onSelectPeriod(item.value as TrendPeriod)}
          />
        </div>

        <TrendSearchBox
          uiScale={uiScale}
          value={searchInput}
          onChange={onSearchInputChange}
          onSearch={onSearch}
          onReset={onReset}
        />
      </div>
    </section>
  )
}
