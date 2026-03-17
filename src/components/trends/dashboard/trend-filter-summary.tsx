'use client'

import type { TrendUiScale } from '@/config/trends'
import { cn } from '@/lib/utils'

interface TrendFilterSummaryProps {
  uiScale: TrendUiScale
  selectedLanguageLabel: string
  selectedKeywordLabel: string
  language: string
  visibleQuickLanguages: string[]
  recentKeywords: string[]
  expandedQuickFilter: boolean
  onApplyRecentKeyword: (value: string) => void
  onClearRecentKeywords: () => void
  onSelectLanguage: (value: string) => void
  onToggleQuickFilters: () => void
}

export function TrendFilterSummary({
  uiScale,
  selectedLanguageLabel,
  selectedKeywordLabel,
  language,
  visibleQuickLanguages,
  recentKeywords,
  expandedQuickFilter,
  onApplyRecentKeyword,
  onClearRecentKeywords,
  onSelectLanguage,
  onToggleQuickFilters,
}: TrendFilterSummaryProps) {
  const filterSummary = [
    selectedLanguageLabel !== '全部' ? `语言 ${selectedLanguageLabel}` : '',
    selectedKeywordLabel !== '未设置' ? `关键词 ${selectedKeywordLabel}` : '',
  ].filter(Boolean).join(' · ') || '全部'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-slate-500', uiScale.filterBarText)}>
          当前筛选：
          <span className="font-medium text-slate-900">{filterSummary}</span>
        </span>
        <button
          type="button"
          className={cn('inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-900', uiScale.helperText)}
          onClick={onToggleQuickFilters}
        >
          {expandedQuickFilter ? '收起快捷筛选' : '展开快捷筛选'}
        </button>
      </div>

      {expandedQuickFilter
        ? (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={cn('font-medium text-slate-700', uiScale.filterBarText)}>快捷筛选</p>
                  <button
                    type="button"
                    className={cn('text-slate-400 transition hover:text-slate-700', uiScale.helperText)}
                    onClick={() => onSelectLanguage('')}
                  >
                    清空语言
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border px-3 py-1.5 transition',
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
                        'rounded-full border px-3 py-1.5 transition',
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
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={cn('font-medium text-slate-700', uiScale.filterBarText)}>最近搜索</p>
                  <button
                    type="button"
                    className={cn('text-slate-400 transition hover:text-slate-700', uiScale.helperText)}
                    onClick={onClearRecentKeywords}
                  >
                    清空记录
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentKeywords.length
                    ? recentKeywords.map(item => (
                        <button
                          key={item}
                          type="button"
                          className={cn('rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-blue-200 hover:text-blue-600', uiScale.quickFilterText)}
                          onClick={() => onApplyRecentKeyword(item)}
                        >
                          {item}
                        </button>
                      ))
                    : <span className={cn('text-slate-400', uiScale.helperText)}>暂无搜索记录</span>}
                </div>
              </div>
            </div>
          )
        : null}
    </div>
  )
}
