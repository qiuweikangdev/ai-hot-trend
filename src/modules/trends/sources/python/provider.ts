import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { searchGithubTrendingRepositories } from '@/modules/trends/sources/github/api'
import { mapPythonRepositoryToTrendItem } from '@/modules/trends/sources/python/mapper'

const PYTHON_LANGUAGE = 'Python'

export class PythonTrendProvider implements TrendProvider {
  readonly source = 'python' as const

  async fetchTrends(query: TrendQuery, context: TrendProviderContext): Promise<TrendItem[]> {
    const payload = await searchGithubTrendingRepositories({
      ...query,
      language: PYTHON_LANGUAGE,
    }, context.now)

    return payload.items.map((item, index) => {
      return mapPythonRepositoryToTrendItem(item, index)
    })
  }
}
