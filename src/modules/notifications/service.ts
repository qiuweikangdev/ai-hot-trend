import type { Prisma } from '@prisma/client'
import type { FeishuConfig } from '@/modules/notifications/providers/feishu'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { getPrisma } from '@/lib/prisma'
import { decryptNotificationConfig, encryptNotificationConfig } from '@/modules/notifications/crypto'
import { getFeishuPublicSummary, parseFeishuConfig, sendFeishuText } from '@/modules/notifications/providers/feishu'
import { parseSubscriptionInput } from '@/modules/notifications/subscription'

export interface NotificationCapabilities {
  provider: 'vercel' | 'cloudflare' | 'local'
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

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

async function getSavedFeishuConfig(userId: string) {
  const channel = await getPrisma().notificationChannel.findUnique({
    where: { userId_type: { userId, type: 'feishu' } },
  })
  if (!channel)
    return null
  return decryptNotificationConfig<FeishuConfig>({
    ciphertext: channel.encryptedConfig,
    iv: channel.encryptionIv,
    tag: channel.encryptionTag,
  })
}

// 将部署平台能力转换为前端可消费的配置：Vercel 固定每日时段，Cloudflare 与本地可选五分钟时段。
export function getNotificationCapabilities(): NotificationCapabilities {
  const configuredProvider = process.env.NOTIFICATION_SCHEDULER_PROVIDER?.trim()
  const provider = configuredProvider === 'vercel' || configuredProvider === 'cloudflare' || configuredProvider === 'local'
    ? configuredProvider
    : process.env.NODE_ENV === 'production' ? 'vercel' : 'local'
  const resolutionMinutes = provider === 'vercel' ? 1440 : 5
  const fixedDeliveryMinute = provider === 'vercel'
    ? parseFixedMinute(process.env.NOTIFICATION_FIXED_DELIVERY_TIME) ?? 540
    : undefined
  return { provider, resolutionMinutes, fixedDeliveryMinute }
}

// 查询始终以当前会话用户 userId 为条件，任何用户都无法读取其他人的机器人配置。
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
  // 编辑时密钥输入框留空代表保留旧密钥，避免前端无法回显密钥时误把它清空。
  const existingConfig = await getSavedFeishuConfig(userId)
  const config = parseFeishuConfig({
    // Webhook 同样支持留空保留，编辑订阅规则时不会因为凭证字段未回显而保存失败。
    webhookUrl: hasValue(input.webhookUrl) ? input.webhookUrl : existingConfig?.webhookUrl,
    secret: hasValue(input.secret)
      ? input.secret
      : existingConfig?.secret,
  })
  const parsedSubscription = parseSubscriptionInput(input.subscription)
  const capabilities = getNotificationCapabilities()
  // Vercel 免费日程只有一次每日调用，服务端覆盖客户端提交的时间，防止绕过前端限制。
  const subscription = {
    ...parsedSubscription,
    scheduledMinute: capabilities.fixedDeliveryMinute ?? parsedSubscription.scheduledMinute,
  }
  const encrypted = await encryptNotificationConfig(config)
  const isEnabled = typeof input.isEnabled === 'boolean' ? input.isEnabled : true
  // 通道与订阅使用同一个 upsert 保存，确保首次配置和后续修改保持一致。
  const channel = await getPrisma().notificationChannel.upsert({
    where: { userId_type: { userId, type: 'feishu' } },
    create: { userId, type: 'feishu', encryptedConfig: encrypted.ciphertext, encryptionIv: encrypted.iv, encryptionTag: encrypted.tag, isEnabled, subscription: { create: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled } } },
    update: { encryptedConfig: encrypted.ciphertext, encryptionIv: encrypted.iv, encryptionTag: encrypted.tag, isEnabled, subscription: { upsert: { create: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled }, update: { sources: subscription.sources as Prisma.InputJsonValue, period: subscription.period, limit: subscription.limit, scheduledMinute: subscription.scheduledMinute, isEnabled } } } },
  })
  return { id: channel.id, summary: getFeishuPublicSummary(config) }
}

export async function testFeishuSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  // 签名密钥不会回传到前端；测试时输入为空则复用数据库中已加密保存的配置。
  const existingConfig = await getSavedFeishuConfig(userId)
  const config = parseFeishuConfig({
    webhookUrl: hasValue(input.webhookUrl) ? input.webhookUrl : existingConfig?.webhookUrl,
    secret: hasValue(input.secret) ? input.secret : existingConfig?.secret,
  })
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
