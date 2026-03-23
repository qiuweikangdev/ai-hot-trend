import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { JuejinFeedItem } from '@/modules/trends/sources/juejin/types'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchJuejinHotFeed, filterJuejinItems } from '@/modules/trends/sources/juejin/api'
import { mapJuejinItemToTrendItem } from '@/modules/trends/sources/juejin/mapper'

const JUEJIN_PAGE_LIMIT = 20
const MAX_PAGE_FETCH = 8

export class JuejinTrendProvider implements TrendProvider {
  readonly source = 'juejin' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const targetCount = query.offset + query.limit
    const collected: JuejinFeedItem[] = []
    const seenArticleIds = new Set<string>()

    let cursor = '0'

    for (let index = 0; index < MAX_PAGE_FETCH; index += 1) {
      const page = await fetchJuejinHotFeed(cursor, JUEJIN_PAGE_LIMIT)

      if (!page.items.length) {
        break
      }

      const filteredItems = filterJuejinItems(page.items, query.keyword, query.language)

      for (const item of filteredItems) {
        if (seenArticleIds.has(item.article_id)) {
          continue
        }

        seenArticleIds.add(item.article_id)
        collected.push(item)
      }

      if (collected.length >= targetCount || !page.hasMore) {
        break
      }

      cursor = page.nextCursor
    }

    return collected
      .slice(query.offset, query.offset + query.limit)
      .map((item, index) => {
        return mapJuejinItemToTrendItem(item, index)
      })
  }
}
