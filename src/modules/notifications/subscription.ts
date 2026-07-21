import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { isTrendPeriod, isTrendSource } from '@/modules/trends/types'

export interface NotificationSubscriptionInput {
  sources: TrendSource[]
  period: TrendPeriod
  limit: number
  scheduledMinute: number
}

function invalidSubscription(): never {
  throw new Error('Invalid notification subscription')
}

export function parseSubscriptionInput(value: unknown): NotificationSubscriptionInput {
  if (!value || typeof value !== 'object') {
    return invalidSubscription()
  }

  const input = value as Record<string, unknown>
  const rawSources = input.sources

  if (!Array.isArray(rawSources) || rawSources.length === 0) {
    return invalidSubscription()
  }

  const sources = [...new Set(rawSources)]

  if (!sources.every(source => typeof source === 'string' && isTrendSource(source))) {
    return invalidSubscription()
  }

  if (typeof input.period !== 'string' || !isTrendPeriod(input.period)) {
    return invalidSubscription()
  }

  if (typeof input.limit !== 'number' || !Number.isInteger(input.limit) || input.limit < 1 || input.limit > 10) {
    return invalidSubscription()
  }

  if (
    typeof input.scheduledMinute !== 'number'
    || !Number.isInteger(input.scheduledMinute)
    || input.scheduledMinute < 0
    || input.scheduledMinute >= 24 * 60
    || input.scheduledMinute % 5 !== 0
  ) {
    return invalidSubscription()
  }

  return {
    sources: sources as TrendSource[],
    period: input.period,
    limit: input.limit,
    scheduledMinute: input.scheduledMinute,
  }
}
