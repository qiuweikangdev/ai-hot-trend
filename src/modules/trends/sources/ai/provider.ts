import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { BestOfJsProject } from '@/modules/trends/sources/ai/types'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchBestOfJsAiProjects } from '@/modules/trends/sources/ai/api'
import { mapBestOfJsProjectToTrendItem } from '@/modules/trends/sources/ai/mapper'

const BEST_OF_JS_PAGE_SIZE = 30
const MAX_PAGE_FETCH = 8

function matchesQuery(project: BestOfJsProject, query: TrendQuery) {
  const language = query.language?.trim().toLowerCase()

  if (language && !'ai'.includes(language)) {
    return false
  }

  const keyword = query.keyword?.trim().toLowerCase()

  if (!keyword) {
    return true
  }

  const haystack = [
    project.name,
    project.full_name,
    project.description ?? '',
    ...(project.tags ?? []),
  ].join(' ').toLowerCase()

  return haystack.includes(keyword)
}

export class AiTrendProvider implements TrendProvider {
  readonly source = 'ai' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const targetCount = query.offset + query.limit
    const startPage = Math.floor(query.offset / BEST_OF_JS_PAGE_SIZE) + 1
    const collected: BestOfJsProject[] = []
    const seenSlugs = new Set<string>()

    for (let page = startPage; page < startPage + MAX_PAGE_FETCH; page += 1) {
      const pageItems = await fetchBestOfJsAiProjects(query.period, page)

      if (!pageItems.length) {
        break
      }

      for (const item of pageItems) {
        if (seenSlugs.has(item.slug) || !matchesQuery(item, query)) {
          continue
        }

        seenSlugs.add(item.slug)
        collected.push(item)
      }

      if (collected.length >= targetCount) {
        break
      }
    }

    return collected
      .slice(query.offset, query.offset + query.limit)
      .map((item, index) => {
        return mapBestOfJsProjectToTrendItem(item, index, query.period)
      })
  }
}
