import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { isTrendPeriod, isTrendSource } from '@/modules/trends/types'

const DEFAULT_DAILY_SOURCES: TrendSource[] = ['ai', 'github', 'npm', 'weibo', 'zhihu']
const DEFAULT_DAILY_PERIOD: TrendPeriod = 'today'
const DEFAULT_DAILY_LIMIT = 5
const MAX_DAILY_LIMIT = 10
const DEFAULT_DAILY_TIMEZONE = 'Asia/Shanghai'

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ''
}

function parseTrendSources(rawValue: string): TrendSource[] {
  if (!rawValue) {
    return DEFAULT_DAILY_SOURCES
  }

  const sources = rawValue
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (sources.length === 0) {
    return DEFAULT_DAILY_SOURCES
  }

  for (const source of sources) {
    if (!isTrendSource(source)) {
      throw new Error(`FEISHU_DAILY_SOURCES contains unsupported source: ${source}`)
    }
  }

  return [...new Set(sources as TrendSource[])]
}

function parseTrendPeriod(rawValue: string): TrendPeriod {
  if (!rawValue) {
    return DEFAULT_DAILY_PERIOD
  }

  if (!isTrendPeriod(rawValue)) {
    throw new Error(`FEISHU_DAILY_PERIOD is invalid: ${rawValue}`)
  }

  return rawValue
}

function parseDailyLimit(rawValue: string) {
  if (!rawValue) {
    return DEFAULT_DAILY_LIMIT
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`FEISHU_DAILY_LIMIT must be a positive integer, got: ${rawValue}`)
  }

  return Math.min(parsed, MAX_DAILY_LIMIT)
}

export function getFeishuDailyPushEnv() {
  const webhookUrl = readEnv('FEISHU_BOT_WEBHOOK_URL')

  if (!webhookUrl) {
    throw new Error('FEISHU_BOT_WEBHOOK_URL is required')
  }

  const cronToken = readEnv('FEISHU_PUSH_CRON_TOKEN') || readEnv('CRON_SECRET')

  if (process.env.NODE_ENV === 'production' && !cronToken) {
    throw new Error('FEISHU_PUSH_CRON_TOKEN or CRON_SECRET is required in production')
  }

  return {
    webhookUrl,
    botSecret: readEnv('FEISHU_BOT_SECRET'),
    cronToken,
    period: parseTrendPeriod(readEnv('FEISHU_DAILY_PERIOD')),
    limit: parseDailyLimit(readEnv('FEISHU_DAILY_LIMIT')),
    sources: parseTrendSources(readEnv('FEISHU_DAILY_SOURCES')),
    timezone: readEnv('FEISHU_DAILY_TIMEZONE') || DEFAULT_DAILY_TIMEZONE,
  }
}
