import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { searchGithubTrendingRepositories } from '@/modules/trends/sources/github/api'
import { mapGithubRepositoryToTrendItem } from '@/modules/trends/sources/github/mapper'

export class GithubTrendProvider implements TrendProvider {
  readonly source = 'github' as const

  async fetchTrends(query: TrendQuery, context: TrendProviderContext): Promise<TrendItem[]> {
    const payload = await searchGithubTrendingRepositories(query, context.now)

    return payload.items.map((item, index) => {
      return mapGithubRepositoryToTrendItem(item, index)
    })
  }
}
