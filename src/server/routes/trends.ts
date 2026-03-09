import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { Hono } from 'hono'
import { queryTrendItems } from '@/modules/trends/service'
import {
  TREND_PERIOD_VALUES,
  TREND_SOURCE_VALUES,

} from '@/modules/trends/types'

const trendsRoute = new Hono()

function parseSource(value: string | null): TrendSource {
  if (!value) {
    return 'github'
  }

  if (!TREND_SOURCE_VALUES.includes(value as TrendSource)) {
    throw new Error(`不支持的热点源: ${value}`)
  }

  return value as TrendSource
}

function parsePeriod(value: string | null): TrendPeriod {
  if (!value) {
    return 'week'
  }

  if (!TREND_PERIOD_VALUES.includes(value as TrendPeriod)) {
    throw new Error(`不支持的时间范围: ${value}`)
  }

  return value as TrendPeriod
}

function parseLimit(value: string | null) {
  if (!value) {
    return 18
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('limit 参数必须为正整数')
  }

  return Math.min(parsed, 30)
}

function parseTextValue(value: string | null) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

trendsRoute.get('/', async (c) => {
  try {
    const source = parseSource(c.req.query('source') ?? null)
    const period = parsePeriod(c.req.query('period') ?? null)
    const limit = parseLimit(c.req.query('limit') ?? null)
    const language = parseTextValue(c.req.query('language') ?? null)
    const keyword = parseTextValue(c.req.query('keyword') ?? null)

    const data = await queryTrendItems({
      source,
      period,
      language,
      keyword,
      limit,
    })

    return c.json({
      success: true,
      data,
    })
  }
  catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '热点查询失败',
      },
      400,
    )
  }
})

export default trendsRoute
