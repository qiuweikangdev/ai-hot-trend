import type { Prisma } from '@prisma/client'
import type { FeishuConfig } from '@/modules/notifications/providers/feishu'
import type { QqEmailConfig } from '@/modules/notifications/providers/qq-email'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { getPrisma } from '@/lib/prisma'
import { decryptNotificationConfig, encryptNotificationConfig } from '@/modules/notifications/crypto'
import { buildNotificationDigest } from '@/modules/notifications/digest'
import { getFeishuPublicSummary, parseFeishuConfig, sendFeishuText } from '@/modules/notifications/providers/feishu'
import { getQqEmailPublicSummary, parseQqEmailConfig, sendQqEmail } from '@/modules/notifications/providers/qq-email'
import { parseSubscriptionInput } from '@/modules/notifications/subscription'

export interface NotificationCapabilities {
  provider: 'vercel' | 'cloudflare' | 'local'
  resolutionMinutes: 5 | 1440
  fixedDeliveryMinute?: number
}

export type NotificationChannelType = 'feishu' | 'email'

interface NotificationChannelSettings {
  id: string
  type: NotificationChannelType
  isEnabled: boolean
  summary: { label: string, maskedTarget: string, target?: string }
  email?: string
  recipientEmail?: string
  subscription: { sources: TrendSource[], period: TrendPeriod, limit: number, scheduledMinute: number, isEnabled: boolean } | null
  lastTestedAt: Date | null
  lastTestStatus: string | null
  lastTestMessage: string | null
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

async function getSavedChannelConfig<T>(userId: string, type: NotificationChannelType) {
  const channel = await getPrisma().notificationChannel.findUnique({
    where: { userId_type: { userId, type } },
  })
  if (!channel)
    return null
  return decryptNotificationConfig<T>({
    ciphertext: channel.encryptedConfig,
    iv: channel.encryptionIv,
    tag: channel.encryptionTag,
  })
}

function parseManualNotificationInput(value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')

  const input = value as Record<string, unknown>
  return {
    input,
    subscription: parseSubscriptionInput(input.subscription),
  }
}

async function saveChannelConfig({
  userId,
  type,
  config,
  isEnabled,
  rawSubscription,
}: {
  userId: string
  type: NotificationChannelType
  config: FeishuConfig | QqEmailConfig
  isEnabled: boolean
  rawSubscription: unknown
}) {
  const parsedSubscription = parseSubscriptionInput(rawSubscription)
  const capabilities = getNotificationCapabilities()
  // Vercel 每天只有一次调度，服务端覆盖客户端提交的时间，防止保存无法兑现的时间。
  const subscription = {
    ...parsedSubscription,
    scheduledMinute: capabilities.fixedDeliveryMinute ?? parsedSubscription.scheduledMinute,
  }
  const encrypted = await encryptNotificationConfig(config)
  const channel = await getPrisma().notificationChannel.upsert({
    where: { userId_type: { userId, type } },
    create: {
      userId,
      type,
      encryptedConfig: encrypted.ciphertext,
      encryptionIv: encrypted.iv,
      encryptionTag: encrypted.tag,
      isEnabled,
      subscription: {
        create: {
          sources: subscription.sources as Prisma.InputJsonValue,
          period: subscription.period,
          limit: subscription.limit,
          scheduledMinute: subscription.scheduledMinute,
          isEnabled,
        },
      },
    },
    update: {
      encryptedConfig: encrypted.ciphertext,
      encryptionIv: encrypted.iv,
      encryptionTag: encrypted.tag,
      isEnabled,
      subscription: {
        upsert: {
          create: {
            sources: subscription.sources as Prisma.InputJsonValue,
            period: subscription.period,
            limit: subscription.limit,
            scheduledMinute: subscription.scheduledMinute,
            isEnabled,
          },
          update: {
            sources: subscription.sources as Prisma.InputJsonValue,
            period: subscription.period,
            limit: subscription.limit,
            scheduledMinute: subscription.scheduledMinute,
            isEnabled,
          },
        },
      },
    },
  })
  return { id: channel.id }
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
  const channels = await getPrisma().notificationChannel.findMany({
    where: { userId, type: { in: ['feishu', 'email'] } },
    include: { subscription: true },
  })
  const settings: Record<NotificationChannelType, NotificationChannelSettings | null> = { feishu: null, email: null }

  for (const channel of channels) {
    const type = channel.type as NotificationChannelType
    const config = type === 'feishu'
      ? await decryptNotificationConfig<FeishuConfig>({ ciphertext: channel.encryptedConfig, iv: channel.encryptionIv, tag: channel.encryptionTag })
      : await decryptNotificationConfig<QqEmailConfig>({ ciphertext: channel.encryptedConfig, iv: channel.encryptionIv, tag: channel.encryptionTag })
    const summary = type === 'feishu' ? getFeishuPublicSummary(config as FeishuConfig) : getQqEmailPublicSummary(config as QqEmailConfig)
    settings[type] = {
      id: channel.id,
      type,
      isEnabled: channel.isEnabled,
      summary,
      ...(type === 'email'
        ? {
            email: (config as QqEmailConfig).email,
            recipientEmail: (config as QqEmailConfig).recipientEmail,
          }
        : {}),
      subscription: channel.subscription && {
        sources: channel.subscription.sources as TrendSource[],
        period: channel.subscription.period as TrendPeriod,
        limit: channel.subscription.limit,
        scheduledMinute: channel.subscription.scheduledMinute,
        isEnabled: channel.subscription.isEnabled,
      },
      lastTestedAt: channel.lastTestedAt,
      lastTestStatus: channel.lastTestStatus,
      lastTestMessage: channel.lastTestMessage,
    }
  }

  return { channel: settings.feishu, channels: settings, capabilities: getNotificationCapabilities() }
}

export async function saveFeishuSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  // 编辑时密钥输入框留空代表保留旧密钥，避免前端无法回显密钥时误把它清空。
  const existingConfig = await getSavedChannelConfig<FeishuConfig>(userId, 'feishu')
  const config = parseFeishuConfig({
    // Webhook 同样支持留空保留，编辑订阅规则时不会因为凭证字段未回显而保存失败。
    webhookUrl: hasValue(input.webhookUrl) ? input.webhookUrl : existingConfig?.webhookUrl,
    secret: hasValue(input.secret)
      ? input.secret
      : existingConfig?.secret,
  })
  const isEnabled = typeof input.isEnabled === 'boolean' ? input.isEnabled : true
  const channel = await saveChannelConfig({ userId, type: 'feishu', config, isEnabled, rawSubscription: input.subscription })
  return { ...channel, summary: getFeishuPublicSummary(config) }
}

export async function testFeishuSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  // 签名密钥不会回传到前端；测试时输入为空则复用数据库中已加密保存的配置。
  const existingConfig = await getSavedChannelConfig<FeishuConfig>(userId, 'feishu')
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

export async function pushFeishuNotification(userId: string, value: unknown) {
  const { input, subscription } = parseManualNotificationInput(value)
  const existingConfig = await getSavedChannelConfig<FeishuConfig>(userId, 'feishu')
  const config = parseFeishuConfig({
    webhookUrl: hasValue(input.webhookUrl) ? input.webhookUrl : existingConfig?.webhookUrl,
    secret: hasValue(input.secret) ? input.secret : existingConfig?.secret,
  })
  const message = await buildNotificationDigest(subscription)
  await sendFeishuText(config, message)
  return { success: true }
}

export async function deleteFeishuSettings(userId: string) {
  await getPrisma().notificationChannel.deleteMany({ where: { userId, type: 'feishu' } })
}

export async function saveQqEmailSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  const existingConfig = await getSavedChannelConfig<QqEmailConfig>(userId, 'email')
  const config = parseQqEmailConfig({
    email: hasValue(input.email) ? input.email : existingConfig?.email,
    recipientEmail: hasValue(input.recipientEmail) ? input.recipientEmail : existingConfig?.recipientEmail,
    authorizationCode: hasValue(input.authorizationCode) ? input.authorizationCode : existingConfig?.authorizationCode,
  })
  const isEnabled = typeof input.isEnabled === 'boolean' ? input.isEnabled : true
  const channel = await saveChannelConfig({ userId, type: 'email', config, isEnabled, rawSubscription: input.subscription })
  return { ...channel, summary: getQqEmailPublicSummary(config), email: config.email, recipientEmail: config.recipientEmail }
}

export async function testQqEmailSettings(userId: string, value: unknown) {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid notification settings')
  const input = value as Record<string, unknown>
  const existingConfig = await getSavedChannelConfig<QqEmailConfig>(userId, 'email')
  const config = parseQqEmailConfig({
    email: hasValue(input.email) ? input.email : existingConfig?.email,
    recipientEmail: hasValue(input.recipientEmail) ? input.recipientEmail : existingConfig?.recipientEmail,
    authorizationCode: hasValue(input.authorizationCode) ? input.authorizationCode : existingConfig?.authorizationCode,
  })
  try {
    await sendQqEmail(config, 'AI Hot Trend test notification. Your QQ email is connected.', 'AI Hot Trend test notification')
    await getPrisma().notificationChannel.updateMany({ where: { userId, type: 'email' }, data: { lastTestedAt: new Date(), lastTestStatus: 'sent', lastTestMessage: 'Test message sent' } })
    return { success: true }
  }
  catch (error) {
    await getPrisma().notificationChannel.updateMany({ where: { userId, type: 'email' }, data: { lastTestedAt: new Date(), lastTestStatus: 'failed', lastTestMessage: 'Test message failed' } })
    throw error
  }
}

export async function pushQqEmailNotification(userId: string, value: unknown) {
  const { input, subscription } = parseManualNotificationInput(value)
  const existingConfig = await getSavedChannelConfig<QqEmailConfig>(userId, 'email')
  const config = parseQqEmailConfig({
    email: hasValue(input.email) ? input.email : existingConfig?.email,
    recipientEmail: hasValue(input.recipientEmail) ? input.recipientEmail : existingConfig?.recipientEmail,
    authorizationCode: hasValue(input.authorizationCode) ? input.authorizationCode : existingConfig?.authorizationCode,
  })
  const message = await buildNotificationDigest(subscription)
  await sendQqEmail(config, message)
  return { success: true }
}

export async function deleteQqEmailSettings(userId: string) {
  await getPrisma().notificationChannel.deleteMany({ where: { userId, type: 'email' } })
}

export function formatMinuteOfDay(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export type { TrendPeriod, TrendSource }
