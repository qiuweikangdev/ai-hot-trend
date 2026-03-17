'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { TrendPeriodOption, TrendSourceOption } from '@/modules/trends/catalog'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { useState } from 'react'
import {
  DEFAULT_TREND_PERIOD,
  DEFAULT_TREND_SOURCE,
  getTrendSourceMeta,
  TREND_PERIOD_OPTIONS,
  TREND_SOURCE_OPTIONS,
} from '@/modules/trends/catalog'
import { isTrendSource } from '@/modules/trends/types'
import { trimText } from './utils'

interface UseTrendQueryStateOptions {
  onNotice: (message: string) => void
}

interface TrendQueryState {
  source: TrendSource
  period: TrendPeriod
  searchInput: string
  keyword: string
  language: string
  expandedQuickFilter: boolean
  refreshTick: number
}

interface TrendQueryStateActions {
  setSearchInput: (value: string) => void
  setPeriod: (value: TrendPeriod) => void
  setLanguage: (value: string) => void
  setExpandedQuickFilter: Dispatch<SetStateAction<boolean>>
  applySearchKeyword: (value: string) => void
  handleSearch: () => void
  handleResetSearch: () => void
  handleSelectSource: (value: string, enabled: boolean, label: string) => void
}

export function useTrendQueryState({
  onNotice,
}: UseTrendQueryStateOptions) {
  const [source, setSource] = useState<TrendSource>(DEFAULT_TREND_SOURCE)
  const [period, setPeriod] = useState<TrendPeriod>(DEFAULT_TREND_PERIOD)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [language, setLanguage] = useState('')
  const [expandedQuickFilter, setExpandedQuickFilter] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  function handleSearch() {
    setKeyword(trimText(searchInput))
  }

  function applySearchKeyword(value: string) {
    const normalizedValue = trimText(value)
    setSearchInput(normalizedValue)
    setKeyword(normalizedValue)
  }

  function handleResetSearch() {
    setSearchInput('')
    setKeyword('')
    setLanguage('')
    setRefreshTick(value => value + 1)
  }

  function handleSelectSource(value: string, enabled: boolean, label: string) {
    if (!enabled || !isTrendSource(value)) {
      onNotice(`${label} 模块即将上线`)
      return
    }

    setSource(value)
  }

  const state: TrendQueryState = {
    source,
    period,
    searchInput,
    keyword,
    language,
    expandedQuickFilter,
    refreshTick,
  }

  const actions: TrendQueryStateActions = {
    setSearchInput,
    setPeriod,
    setLanguage,
    setExpandedQuickFilter,
    applySearchKeyword,
    handleSearch,
    handleResetSearch,
    handleSelectSource,
  }

  return {
    state,
    actions,
    sourceOptions: TREND_SOURCE_OPTIONS satisfies TrendSourceOption[],
    periodOptions: TREND_PERIOD_OPTIONS satisfies TrendPeriodOption[],
    derived: {
      activeSourceMeta: getTrendSourceMeta(source),
      selectedLanguageLabel: language || '全部',
      selectedKeywordLabel: keyword || '未设置',
    },
  }
}
