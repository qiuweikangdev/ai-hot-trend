import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchV2exHotTopics } from '@/modules/trends/sources/v2ex/api'
import { mapV2exTopicToTrendItem } from '@/modules/trends/sources/v2ex/mapper'

export class V2exTrendProvider implements TrendProvider {
  readonly source = 'v2ex' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const allTopics = await fetchV2exHotTopics()

    const filteredTopics = allTopics.filter((topic) => {
      const keyword = query.keyword?.trim().toLowerCase()
      const language = query.language?.trim().toLowerCase()

      if (!keyword && !language) {
        return true
      }

      const haystack = [
        topic.title,
        topic.content ?? '',
        topic.node.name,
        topic.node.title,
        topic.member.username,
        topic.member.tagline ?? '',
      ].join(' ').toLowerCase()

      const keywordMatched = keyword ? haystack.includes(keyword) : true
      const languageMatched = language ? haystack.includes(language) : true

      return keywordMatched && languageMatched
    })

    return filteredTopics
      .slice(query.offset, query.offset + query.limit)
      .map((topic, index) => {
        return mapV2exTopicToTrendItem(topic, index)
      })
  }
}
