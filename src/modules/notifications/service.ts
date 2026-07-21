import type { Prisma } from '@prisma/client'
import type { FeishuConfig } from '@/modules/notifications/providers/feishu'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { getPrisma } from '@/lib/prisma'
import { decryptNotificationConfig, encryptNotificationConfig } from '@/modules/notifications/crypto'
import { getFeishuPublicSummary, parseFeishuConfig, sendFeishuText } from '@/modules/notifications/providers/feishu'
import { parseSubscriptionInput } from '@/modules/notifications/subscription'

export interface NotificationCapabilities {
  provider: 'vercel' | 'cloudflare'
  resolutionMinutes: 5 | 1440
  fixedDeliveryMinute?: number
}

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function parseFixedMinute(rawValue: string | undefined) {
  if (!rawValue || !TIME_PATTERN.test(rawValue))
    return undefined
  const [hour, minute] = rawValue.split(':').map(Number)
  return hour * 60 + minute
}

export function getNotificationCapabilities(): NotificationCapabilities {
  const provider = process.env.NOTIFICATION_SCHEDULER_PROVIDER === 'cloudflare' ? 'cloudflare' : 'vercel'
  const resolutionMinutes = provider === 'cloudflare' ? 5 : 1440
  const fixedDeliveryMinute = provider === 'vercel'
    ? parseFixedMinute(process.env.NOTIFICATION_FIXED_DELIVERY_TIME) ?? 540
    : undefined
  return { provider, resolutionMinutes, fixedDeliveryMinute }
}

export async function getNotificationSettings(userId: string) {
  const channel = await getPrisma().notificationChannel.findUnique({ where: { userId_type: { userId, type: 'feishu' } }, include: { subscription: true } })
  if (!channel)
    return { channel: null, capabilities: getNotificationCapabilities() }
  const config = await decryptNotificationConfig<FeishuConfig>({ ciphertext: channel.encryptedConfig, iv: channel.encryptionIv, tag: channel.encryptionTag })
  return {
    channel: {
      id: channel.id,
      type: channel.type,
      isEnabled: channel.isEnabled,
      summary: getFeishuPublicSummary(config),
      subscription: channel.subscription && { sources: channel.subscription.sources, period: channel.subscription.period, limit: channel.subscription.limit, scheduledMinute: channel.subscription.scheduledMinute, isEnabled: channel.subscription.isEnabled },
      lastTestedAt: channel.lastTestedAt,
      lastTestStatus: channel.lastTestStatus,
      lastTestMessage: channel.lastTestMessage,
    },
    capabilities: getNotificationCapabilities(),
  }
}

export async function saveFeishuSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  const existing = await getPrisma().notificationChannel.findUnique({
    where: { userId_type: { userId, type: 'feishu' } },
  })
  const existingConfig = existing
    ? await decryptNotificationConfig<FeishuConfig>({
        ciphertext: existing.encryptedConfig,
        iv: existing.encryptionIv,
        tag: existing.encryptionTag,
      })
    : null
  const config = parseFeishuConfig({
    webhookUrl: input.webhookUrl,
    secret: typeof input.secret === 'string' && input.secret.trim()
      ? input.secret
      : existingConfig?.secret,
  })
  const parsedSubscription = parseSubscriptionInput(input.subscription)
  const capabilities = getNotificationCapabilities()
  const subscription = {
    ...parsedSubscription,
    scheduledMinute: capabilities.fixedDeliveryMinute ?? parsedSubscription.scheduledMinute,
  }
  const encrypted = await encryptNotificationConfig(config)
  const isEnabled = typeof input.isEnabled === 'boolean' ? input.isEnabled : true
  const channel = await getPrisma().notificationChannel.upsert({
    where: { userId_type: { userId, type: 'feishu' } },
    create: { userId, type: 'feishu', encryptedConfig: encrypted.ciphertext, encryptionIv: encrypted.iv, encryptionTag: encrypted.tag, isEnabled, subscription: { create: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled } } },
    update: { encryptedConfig: encrypted.ciphertext, encryptionIv: encrypted.iv, encryptionTag: encrypted.tag, isEnabled, subscription: { upsert: { create: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled }, update: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled } } } },
  })
  return { id: channel.id, summary: getFeishuPublicSummary(config) }
}

export async function testFeishuSettings(userId: string, value: unknown) {
  const config = parseFeishuConfig(value)
  try {
    await sendFeishuText(config, 'AI Hot Trend test notification. Your Feishu robot is connected.')
    await getPrisma().notificationChannel.updateMany({ where: { userId, type: 'feishu' }, data: { lastTestedAt: new Date(), lastTestStatus: 'sent', lastTestMessage: 'Test message sent' } })
    return { success: true }
  }
  catch (error) {
    await getPrisma().notificationChannel.updateMany({ where: { userId, type: 'feishu' }, data: { lastTestedAt: new Date(), lastTestStatus: 'failed', lastTestMessage: 'Test message failed' } })
    throw error
  }
}

export async function deleteFeishuSettings(userId: string) {
  await getPrisma().notificationChannel.deleteMany({ where: { userId, type: 'feishu' } })
}

export function formatMinuteOfDay(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export type { TrendPeriod, TrendSource }
