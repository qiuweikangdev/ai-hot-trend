'use client'

import type { TrendUiScale } from '@/config/trends'
import type { TrendPeriodOption, TrendSourceOption } from '@/modules/trends/catalog'
import type { TrendPeriod } from '@/modules/trends/types'
import { RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TrendFilterPanelProps {
  uiScale: TrendUiScale
  sourceOptions: TrendSourceOption[]
  periodOptions: TrendPeriodOption[]
  sourceLabel: string
  sourceValue: string
  period: TrendPeriod
  searchInput: string
  selectedLanguageLabel: string
  selectedKeywordLabel: string
  language: string
  visibleQuickLanguages: string[]
  expandedQuickFilter: boolean
  onSearchInputChange: (value: string) => void
  onSelectSource: (value: string, enabled: boolean, label: string) => void
  onSelectPeriod: (value: TrendPeriod) => void
  onSearch: () => void
  onReset: () => void
  onSelectLanguage: (value: string) => void
  onToggleQuickFilters: () => void
}

export function TrendFilterPanel({
  uiScale,
  sourceOptions,
  periodOptions,
  sourceLabel,
  sourceValue,
  period,
  searchInput,
  selectedLanguageLabel,
  selectedKeywordLabel,
  language,
  visibleQuickLanguages,
  expandedQuickFilter,
  onSearchInputChange,
  onSelectSource,
  onSelectPeriod,
  onSearch,
  onReset,
  onSelectLanguage,
  onToggleQuickFilters,
}: TrendFilterPanelProps) {
  return (
    <section className="rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-[0_30px_65px_-55px_rgba(35,63,112,0.7)] backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
          {sourceOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'rounded-full px-4 py-2 transition',
                uiScale.tabText,
                option.enabled
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'cursor-not-allowed text-slate-300',
                option.value === sourceValue && option.enabled && 'bg-blue-600 text-white hover:bg-blue-600',
              )}
              onClick={() => onSelectSource(option.value, option.enabled, option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
          {periodOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100',
                uiScale.tabText,
                option.value === period && 'bg-blue-600 text-white hover:bg-blue-600',
              )}
              onClick={() => onSelectPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-blue-500/90 bg-white p-2">
        <Search className="ml-2 size-5 text-slate-400" />
        <Input
          value={searchInput}
          onChange={event => onSearchInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch()
            }
          }}
          placeholder="筛选语言或关键词，例如 vue / react / ai agent"
          className={cn('border-0 bg-transparent shadow-none focus-visible:ring-0', uiScale.searchButtonHeight, uiScale.inputText)}
        />
        <Button type="button" className={cn('rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-500', uiScale.searchButtonHeight)} onClick={onSearch}>
          <Search className="size-4" />
          搜索
        </Button>
        <Button type="button" variant="outline" size="icon" className={cn('rounded-xl border-slate-200', uiScale.resetButtonHeight)} onClick={onReset}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div className={cn('inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600', uiScale.filterBarText)}>
          当前筛选:
          <span className="font-medium text-slate-900">
            来源
            {' '}
            {sourceLabel}
          </span>
          <span>·</span>
          <span className="font-medium text-slate-900">
            语言
            {' '}
            {selectedLanguageLabel}
          </span>
          <span>·</span>
          <span className="font-medium text-slate-900">
            关键词
            {' '}
            {selectedKeywordLabel}
          </span>
        </div>

        <button
          type="button"
          className={cn('text-slate-500 underline-offset-4 hover:text-blue-600 hover:underline', uiScale.helperText)}
          onClick={onToggleQuickFilters}
        >
          {expandedQuickFilter ? '收起快捷筛选' : '展开快捷筛选'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cn(
            'rounded-full border px-3 py-1 transition',
            uiScale.quickFilterText,
            language
              ? 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
              : 'border-blue-200 bg-blue-50 text-blue-700',
          )}
          onClick={() => onSelectLanguage('')}
        >
          全部
        </button>

        {visibleQuickLanguages.map(item => (
          <button
            key={item}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1 transition',
              uiScale.quickFilterText,
              language === item
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
            )}
            onClick={() => onSelectLanguage(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}
