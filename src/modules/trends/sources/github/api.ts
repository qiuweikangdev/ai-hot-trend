import type { GithubRepoSearchResponse } from '@/modules/trends/sources/github/types'
import type { TrendPeriod, TrendQuery } from '@/modules/trends/types'
import process from 'node:process'

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

function buildGithubSearchParams(query: TrendQuery, now: Date) {
  const createdAfter = buildSinceDate(query.period, now)
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

  const page = Math.floor(query.offset / query.limit) + 1

  return new URLSearchParams({
    q: conditions.join(' '),
    sort: 'stars',
    order: 'desc',
    per_page: String(query.limit),
    page: String(page),
  })
}

// Keep GitHub-specific HTTP details isolated inside the source module so the
// generic trends layer only deals with provider contracts.
export async function searchGithubTrendingRepositories(query: TrendQuery, now: Date) {
  const searchParams = buildGithubSearchParams(query, now)
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

  return await response.json() as GithubRepoSearchResponse
}
