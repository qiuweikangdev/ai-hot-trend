import type { FeishuConfig } from '@/modules/notifications/providers/feishu'
import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import process from 'node:process'
import { getPrisma } from '@/lib/prisma'
import { decryptNotificationConfig } from '@/modules/notifications/crypto'
import { getChinaDateKey, isSubscriptionDue } from '@/modules/notifications/due'
import { sendFeishuText } from '@/modules/notifications/providers/feishu'
import { queryTrendItems } from '@/modules/trends/service'

// 调度来源必须和当前运行环境一致，避免迁移期间 Vercel 与 Cloudflare 同时投递。
function getDispatcherConfig() {
  const configuredProvider = process.env.NOTIFICATION_SCHEDULER_PROVIDER?.trim()
  const provider = configuredProvider === 'vercel' || configuredProvider === 'cloudflare' || configuredProvider === 'local'
    ? configuredProvider
    : process.env.NODE_ENV === 'production' ? 'vercel' : 'local'
  const resolutionMinutes = provider === 'vercel' ? 1440 : 5
  const fixed = process.env.NOTIFICATION_FIXED_DELIVERY_TIME || '09:00'
  const [hour, minute] = fixed.split(':').map(Number)
  return { provider, resolutionMinutes: resolutionMinutes as 5 | 1440, fixedDeliveryMinute: hour * 60 + minute }
}

// 单个热点源失败不会阻塞其他来源，最终消息会保留成功抓取到的内容。
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

export async function dispatchDueNotifications(requestProvider: 'vercel' | 'cloudflare' | 'local') {
  const config = getDispatcherConfig()
  if (requestProvider !== config.provider)
    throw new Error('Scheduler provider mismatch')
  const now = new Date()
  const today = getChinaDateKey(now)
  // 只扫描启用的飞书订阅，并限制单次批量，避免一次定时调用占用过长。
  const candidates = await getPrisma().notificationSubscription.findMany({ where: { isEnabled: true, channel: { isEnabled: true, type: 'feishu' } }, include: { channel: true }, take: 100 })
  let sent = 0
  let failed = 0
  for (const subscription of candidates) {
    if (!isSubscriptionDue({ now, scheduledMinute: subscription.scheduledMinute, resolutionMinutes: config.resolutionMinutes, fixedDeliveryMinute: config.fixedDeliveryMinute }))
      continue
    try {
      // 利用 subscriptionId 与中国日期的唯一索引先抢占投递权；重复调用会因唯一约束失败而跳过。
      await getPrisma().notificationDelivery.create({ data: { subscriptionId: subscription.id, deliveryDate: today, scheduledMinute: subscription.scheduledMinute, status: 'processing' } })
    }
    catch { continue }
    try {
      const channelConfig = await decryptNotificationConfig<FeishuConfig>({ ciphertext: subscription.channel.encryptedConfig, iv: subscription.channel.encryptionIv, tag: subscription.channel.encryptionTag })
      const sources = subscription.sources as TrendSource[]
      const message = await buildDigest(sources, subscription.period as TrendPeriod, subscription.limit)
      // 只有成功抢占投递权后才访问外部 Webhook，避免重复消息。
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
