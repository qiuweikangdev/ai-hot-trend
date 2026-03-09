import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendPeriod, TrendQuery } from '@/modules/trends/types'
import process from 'node:process'

interface GithubRepoSearchItem {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

interface GithubRepoSearchResponse {
  items: GithubRepoSearchItem[]
}

const PERIOD_DAY_MAP: Record<TrendPeriod, number> = {
  today: 1,
  week: 7,
  month: 30,
}

function buildSinceDate(period: TrendPeriod, now: Date) {
  const fromDate = new Date(now.getTime())
  fromDate.setUTCDate(fromDate.getUTCDate() - PERIOD_DAY_MAP[period])
  return fromDate.toISOString().slice(0, 10)
}

function normalizeDescription(value: string | null) {
  if (!value) {
    return '暂无项目描述'
  }

  return value.replaceAll('\n', ' ').trim()
}

export class GithubTrendProvider implements TrendProvider {
  readonly source = 'github' as const

  async fetchTrends(query: TrendQuery, context: TrendProviderContext): Promise<TrendItem[]> {
    const createdAfter = buildSinceDate(query.period, context.now)
    const language = query.language?.trim()
    const keyword = query.keyword?.trim()

    const conditions = [
      `created:>=${createdAfter}`,
      'archived:false',
      'is:public',
    ]

    if (language) {
      conditions.push(`language:${language}`)
    }

    if (keyword) {
      conditions.push(`${keyword} in:name,description`)
    }

    const searchParams = new URLSearchParams({
      q: conditions.join(' '),
      sort: 'stars',
      order: 'desc',
      per_page: String(query.limit),
      page: '1',
    })

    const githubToken = process.env.GITHUB_TOKEN?.trim()

    const response = await fetch(`https://api.github.com/search/repositories?${searchParams.toString()}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ai-hot-trend',
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub 热点抓取失败: ${response.status} ${errorText}`)
    }

    const payload = await response.json() as GithubRepoSearchResponse

    return payload.items.map((item, index) => {
      const description = normalizeDescription(item.description)

      return {
        id: `github:${item.id}`,
        source: this.source,
        rank: index + 1,
        title: item.name,
        fullName: item.full_name,
        owner: item.owner.login,
        description,
        url: item.html_url,
        ownerAvatarUrl: item.owner.avatar_url,
        language: item.language,
        stars: item.stargazers_count,
        forks: item.forks_count,
        hotScore: Math.round(item.stargazers_count + item.forks_count * 0.6),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }
    })
  }
}
