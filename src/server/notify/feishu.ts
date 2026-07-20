import type { TrendItem, TrendPeriod, TrendSource } from '@/modules/trends/types'
import { createHmac } from 'node:crypto'
import { getTrendPeriodLabel, getTrendSourceMeta } from '@/modules/trends/catalog'
import { queryTrendItems } from '@/modules/trends/service'
import { getFeishuDailyPushEnv } from '@/server/notify/env'

interface TrendDigestSection {
  source: TrendSource
  label: string
  items: TrendItem[]
  error?: string
}

interface FeishuWebhookResponse {
  code?: number
  msg?: string
}

interface FeishuTextMessagePayload {
  msg_type: 'text'
  content: {
    text: string
  }
  timestamp?: string
  sign?: string
}

function formatDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

function buildSectionLines(section: TrendDigestSection) {
  const lines: string[] = []
  lines.push(`【${section.label}】`)

  if (section.error) {
    lines.push(`- 拉取失败：${section.error}`)
    return lines
  }

  if (section.items.length === 0) {
    lines.push('- 暂无数据')
    return lines
  }

  for (const item of section.items) {
    lines.push(`${item.rank}. ${truncateText(item.title, 56)} (${item.stars}⭐)`)
    lines.push(item.url)
  }

  return lines
}

async function fetchTrendSection(source: TrendSource, period: TrendPeriod, limit: number): Promise<TrendDigestSection> {
  const label = getTrendSourceMeta(source).label

  try {
    const result = await queryTrendItems({
      source,
      period,
      limit,
      offset: 0,
    })

    return {
      source,
      label,
      items: result.items,
    }
  }
  catch (error) {
    return {
      source,
      label,
      items: [],
      error: error instanceof Error ? error.message : 'unknown error',
    }
  }
}

function buildDigestText(sections: TrendDigestSection[], period: TrendPeriod, timeZone: string) {
  const lines: string[] = []
  lines.push(`🔥 每日热点推送（${getTrendPeriodLabel(period)}）`)
  lines.push(`更新时间：${formatDateTime(new Date(), timeZone)}`)
  lines.push('')

  sections.forEach((section, index) => {
    lines.push(...buildSectionLines(section))

    if (index < sections.length - 1) {
      lines.push('')
    }
  })

  return lines.join('\n')
}

function buildBotSignature(secret: string) {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const stringToSign = `${timestamp}\n${secret}`
  const sign = createHmac('sha256', stringToSign).digest('base64')

  return { timestamp, sign }
}

async function pushTextMessageToFeishu(webhookUrl: string, message: string, botSecret?: string) {
  const payload: FeishuTextMessagePayload = {
    msg_type: 'text',
    content: {
      text: message,
    },
  }

  if (botSecret) {
    const { timestamp, sign } = buildBotSignature(botSecret)
    payload.timestamp = timestamp
    payload.sign = sign
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null) as FeishuWebhookResponse | null

  if (!response.ok) {
    throw new Error(`Feishu webhook request failed: ${response.status}`)
  }

  if (!json || typeof json.code !== 'number') {
    throw new Error('Feishu webhook returned an invalid response')
  }

  if (json.code !== 0) {
    throw new Error(`Feishu webhook error: ${json.code} ${json.msg || 'unknown error'}`)
  }
}

export async function pushDailyTrendDigestToFeishu() {
  const env = getFeishuDailyPushEnv()
  const sections = await Promise.all(
    env.sources.map(source => fetchTrendSection(source, env.period, env.limit)),
  )

  const message = buildDigestText(sections, env.period, env.timezone)

  await pushTextMessageToFeishu(env.webhookUrl, message, env.botSecret)

  const failedSources = sections
    .filter(section => section.error)
    .map(section => section.source)

  return {
    pushedAt: new Date().toISOString(),
    period: env.period,
    sources: env.sources,
    failedSources,
  }
}
