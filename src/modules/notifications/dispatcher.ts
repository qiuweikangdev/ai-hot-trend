import type { FeishuConfig } from '@/modules/notifications/providers/feishu'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { getPrisma } from '@/lib/prisma'
import { decryptNotificationConfig } from '@/modules/notifications/crypto'
import { getChinaDateKey, isSubscriptionDue } from '@/modules/notifications/due'
import { sendFeishuText } from '@/modules/notifications/providers/feishu'
import { queryTrendItems } from '@/modules/trends/service'

function getDispatcherConfig() {
  const provider = process.env.NOTIFICATION_SCHEDULER_PROVIDER === 'cloudflare' ? 'cloudflare' : 'vercel'
  const resolutionMinutes = provider === 'cloudflare' ? 5 : 1440
  const fixed = process.env.NOTIFICATION_FIXED_DELIVERY_TIME || '09:00'
  const [hour, minute] = fixed.split(':').map(Number)
  return { provider, resolutionMinutes: resolutionMinutes as 5 | 1440, fixedDeliveryMinute: hour * 60 + minute }
}

async function buildDigest(sources: TrendSource[], period: TrendPeriod, limit: number) {
  const sections = await Promise.all(sources.map(async (source) => {
    try {
      const result = await queryTrendItems({ source, period, limit, offset: 0 })
      return `${source.toUpperCase()}\n${result.items.map(item => `${item.rank}. ${item.title}\n${item.url}`).join('\n')}`
    }
    catch { return `${source.toUpperCase()}\nUnable to fetch this source.` }
  }))
  return `AI Hot Trend daily digest\nChina time: ${new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}\n\n${sections.join('\n\n')}`
}

export async function dispatchDueNotifications(requestProvider: 'vercel' | 'cloudflare') {
  const config = getDispatcherConfig()
  if (requestProvider !== config.provider)
    throw new Error('Scheduler provider mismatch')
  const now = new Date()
  const today = getChinaDateKey(now)
  const candidates = await getPrisma().notificationSubscription.findMany({ where: { isEnabled: true, channel: { isEnabled: true, type: 'feishu' } }, include: { channel: true }, take: 100 })
  let sent = 0
  let failed = 0
  for (const subscription of candidates) {
    if (!isSubscriptionDue({ now, scheduledMinute: subscription.scheduledMinute, resolutionMinutes: config.resolutionMinutes, fixedDeliveryMinute: config.fixedDeliveryMinute }))
      continue
    try {
      await getPrisma().notificationDelivery.create({ data: { subscriptionId: subscription.id, deliveryDate: today, scheduledMinute: subscription.scheduledMinute, status: 'processing' } })
    }
    catch { continue }
    try {
      const channelConfig = await decryptNotificationConfig<FeishuConfig>({ ciphertext: subscription.channel.encryptedConfig, iv: subscription.channel.encryptionIv, tag: subscription.channel.encryptionTag })
      const sources = subscription.sources as TrendSource[]
      const message = await buildDigest(sources, subscription.period as TrendPeriod, subscription.limit)
      await sendFeishuText(channelConfig, message)
      await getPrisma().notificationDelivery.updateMany({ where: { subscriptionId: subscription.id, deliveryDate: today }, data: { status: 'sent', finishedAt: new Date() } })
      sent++
    }
    catch {
      await getPrisma().notificationDelivery.updateMany({ where: { subscriptionId: subscription.id, deliveryDate: today }, data: { status: 'failed', finishedAt: new Date(), failureMessage: 'Delivery failed' } })
      failed++
    }
  }
  return { sent, failed, date: today }
}
