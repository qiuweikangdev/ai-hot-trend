import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { searchGithubTrendingRepositories } from '@/modules/trends/sources/github/api'
import { mapGoRepositoryToTrendItem } from '@/modules/trends/sources/go/mapper'

const GO_LANGUAGE = 'Go'

export class GoTrendProvider implements TrendProvider {
  readonly source = 'go' as const

  async fetchTrends(query: TrendQuery, context: TrendProviderContext): Promise<TrendItem[]> {
    const payload = await searchGithubTrendingRepositories({
      ...query,
      language: GO_LANGUAGE,
    }, context.now)

    return payload.items.map((item, index) => {
      return mapGoRepositoryToTrendItem(item, index)
    })
  }
}
