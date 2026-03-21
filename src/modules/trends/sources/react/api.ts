import type { BestOfJsProject, BestOfJsSortPeriod } from '@/modules/trends/sources/react/types'
import type { TrendPeriod } from '@/modules/trends/types'

const PROJECT_CHUNK_PATTERN = /\\"project\\":(\{[\s\S]*?\}),\\"size\\":\d+/g

const PERIOD_SORT_MAP: Record<TrendPeriod, BestOfJsSortPeriod> = {
  today: 'daily',
  week: 'weekly',
  month: 'monthly',
}

function parseProjectsFromHtml(html: string): BestOfJsProject[] {
  const matches = [...html.matchAll(PROJECT_CHUNK_PATTERN)]

  return matches.flatMap((match) => {
    const rawProject = match[1]?.replaceAll('\\"', '"')

    if (!rawProject) {
      return []
    }

    try {
      return [JSON.parse(rawProject) as BestOfJsProject]
    }
    catch {
      return []
    }
  })
}

export async function fetchBestOfJsReactProjects(period: TrendPeriod, page: number): Promise<BestOfJsProject[]> {
  const sort = PERIOD_SORT_MAP[period]
  const searchParams = new URLSearchParams({
    sort,
    tags: 'react',
    page: String(page),
  })

  const response = await fetch(`https://bestofjs.org/projects?${searchParams.toString()}`, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Best of JS React 热点抓取失败: ${response.status} ${errorText}`)
  }

  const html = await response.text()
  return parseProjectsFromHtml(html)
}
