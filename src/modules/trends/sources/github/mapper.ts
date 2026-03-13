import type { GithubRepoSearchItem } from '@/modules/trends/sources/github/types'
import type { TrendItem } from '@/modules/trends/types'

function normalizeDescription(value: string | null) {
  if (!value) {
    return '暂无项目描述'
  }

  return value.replaceAll('\n', ' ').trim()
}

export function mapGithubRepositoryToTrendItem(item: GithubRepoSearchItem, index: number): TrendItem {
  return {
    id: `github:${item.id}`,
    source: 'github',
    rank: index + 1,
    title: item.name,
    fullName: item.full_name,
    owner: item.owner.login,
    description: normalizeDescription(item.description),
    url: item.html_url,
    ownerAvatarUrl: item.owner.avatar_url,
    language: item.language,
    stars: item.stargazers_count,
    forks: item.forks_count,
    hotScore: Math.round(item.stargazers_count + item.forks_count * 0.6),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}
