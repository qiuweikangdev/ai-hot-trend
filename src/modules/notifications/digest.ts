import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { queryTrendItems } from '@/modules/trends/service'

interface NotificationDigestOptions {
  sources: TrendSource[]
  period: TrendPeriod
  limit: number
}

// 单个热点源失败不会阻塞其他来源，最终消息会保留成功抓取到的内容。
export async function buildNotificationDigest({ sources, period, limit }: NotificationDigestOptions) {
  const sections = await Promise.all(sources.map(async (source) => {
    try {
      const result = await queryTrendItems({ source, period, limit, offset: 0 })
      return `${source.toUpperCase()}\n${result.items.map(item => `${item.rank}. ${item.title}\n${item.url}`).join('\n')}`
    }
    catch {
      return `${source.toUpperCase()}\nUnable to fetch this source.`
    }
  }))

  return `AI Hot Trend daily digest\nChina time: ${new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}\n\n${sections.join('\n\n')}`
}
