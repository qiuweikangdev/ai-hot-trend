import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchWeiboHotTopics, filterWeiboHotTopics } from '@/modules/trends/sources/weibo/api'
import { mapWeiboTopicToTrendItem } from '@/modules/trends/sources/weibo/mapper'

export class WeiboTrendProvider implements TrendProvider {
  readonly source = 'weibo' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const allTopics = await fetchWeiboHotTopics()
    const filteredTopics = filterWeiboHotTopics(allTopics, query.keyword, query.language)

    return filteredTopics
      .slice(query.offset, query.offset + query.limit)
      .map((topic, index) => {
        return mapWeiboTopicToTrendItem(topic, index)
      })
  }
}
