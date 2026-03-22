import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchZhihuHotItems } from '@/modules/trends/sources/zhihu/api'
import { mapZhihuItemToTrendItem } from '@/modules/trends/sources/zhihu/mapper'

export class ZhihuTrendProvider implements TrendProvider {
  readonly source = 'zhihu' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const rawItems = await fetchZhihuHotItems(query.limit + query.offset)
    const sliced = rawItems.slice(query.offset, query.offset + query.limit)
    const targets = sliced.map(raw => raw.target).filter(Boolean)

    return targets.map((item, index) => {
      return mapZhihuItemToTrendItem(item, index)
    })
  }
}
