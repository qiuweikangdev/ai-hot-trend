import type { TrendQuery } from '@/modules/trends/types'
import {
  DEFAULT_TREND_LIMIT,
  DEFAULT_TREND_PERIOD,
  DEFAULT_TREND_SOURCE,
  MAX_TREND_LIMIT,
} from '@/modules/trends/catalog'
import { isTrendPeriod, isTrendSource } from '@/modules/trends/types'

export interface TrendRequestQueryInput {
  source?: string | null
  period?: string | null
  language?: string | null
  keyword?: string | null
  limit?: string | null
  offset?: string | null
}

function parseSource(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_TREND_SOURCE
  }

  if (!isTrendSource(value)) {
    throw new Error(`不支持的热点源: ${value}`)
  }

  return value
}

function parsePeriod(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_TREND_PERIOD
  }

  if (!isTrendPeriod(value)) {
    throw new Error(`不支持的时间范围: ${value}`)
  }

  return value
}

function parseLimit(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_TREND_LIMIT
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('limit 参数必须为正整数')
  }

  return Math.min(parsed, MAX_TREND_LIMIT)
}

function parseOffset(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function parseTextValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

// Shared parsing keeps the API route thin and gives future entry points
// a single place to validate trend queries.
export function parseTrendRequestQuery(input: TrendRequestQueryInput): TrendQuery {
  return {
    source: parseSource(input.source),
    period: parsePeriod(input.period),
    language: parseTextValue(input.language),
    keyword: parseTextValue(input.keyword),
    limit: parseLimit(input.limit),
    offset: parseOffset(input.offset),
  }
}
