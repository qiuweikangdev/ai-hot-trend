import type { GithubRepoSearchItem } from '@/modules/trends/sources/github/types'
import type { TrendItem } from '@/modules/trends/types'
import { mapGithubRepositoryToTrendItem } from '@/modules/trends/sources/github/mapper'

export function mapGoRepositoryToTrendItem(item: GithubRepoSearchItem, index: number): TrendItem {
  return {
    ...mapGithubRepositoryToTrendItem(item, index),
    id: `go:${item.id}`,
    source: 'go',
    language: item.language || 'Go',
  }
}
