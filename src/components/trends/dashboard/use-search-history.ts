'use client'

import { useState } from 'react'

const SEARCH_HISTORY_STORAGE_KEY = 'trend-dashboard-search-history'
const SEARCH_HISTORY_LIMIT = 5

function normalizeKeyword(value: string) {
  return value.trim()
}

function getInitialRecentKeywords() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .filter(item => typeof item === 'string')
      .map(normalizeKeyword)
      .filter(Boolean)
      .slice(0, SEARCH_HISTORY_LIMIT)
  }
  catch {
    return []
  }
}

export function useSearchHistory() {
  const [recentKeywords, setRecentKeywords] = useState<string[]>(getInitialRecentKeywords)

  function updateRecentKeywords(nextKeywords: string[]) {
    setRecentKeywords(nextKeywords)

    try {
      window.localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(nextKeywords))
    }
    catch {
      // ignore storage failures so search stays usable in restricted browsers
    }
  }

  function addKeyword(keyword: string) {
    const normalizedKeyword = normalizeKeyword(keyword)

    if (!normalizedKeyword) {
      return
    }

    const nextKeywords = [normalizedKeyword, ...recentKeywords.filter(item => item !== normalizedKeyword)]
      .slice(0, SEARCH_HISTORY_LIMIT)

    updateRecentKeywords(nextKeywords)
  }

  function clearKeywords() {
    updateRecentKeywords([])
  }

  return {
    recentKeywords,
    addKeyword,
    clearKeywords,
  }
}
