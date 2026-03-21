import type { BestOfJsProject } from '@/modules/trends/sources/node/types'
import type { TrendItem, TrendPeriod } from '@/modules/trends/types'

const PERIOD_TREND_FIELD_MAP: Record<TrendPeriod, keyof BestOfJsProject['trends']> = {
  today: 'daily',
  week: 'weekly',
  month: 'monthly',
}

function normalizeDescription(value: string | null | undefined) {
  const text = value?.trim()

  if (!text) {
    return '暂无项目描述'
  }

  return text.replaceAll('\n', ' ')
}

function normalizeDate(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const maybeDate = new Date(value)

  if (Number.isNaN(maybeDate.getTime())) {
    return fallback
  }

  return maybeDate.toISOString()
}

function buildOwnerAvatarUrl(ownerId: number | undefined) {
  if (!ownerId) {
    return 'https://avatars.githubusercontent.com/u/9919?v=4&s=96'
  }

  return `https://avatars.githubusercontent.com/u/${ownerId}?v=4&s=96`
}

export function mapBestOfJsProjectToTrendItem(
  item: BestOfJsProject,
  index: number,
  period: TrendPeriod,
): TrendItem {
  const nowIso = new Date().toISOString()
  const trendField = PERIOD_TREND_FIELD_MAP[period]
  const trendDelta = Math.max(0, item.trends?.[trendField] ?? 0)
  const [owner = 'unknown'] = item.full_name.split('/')

  return {
    id: `node:${item.slug}`,
    source: 'node',
    rank: index + 1,
    title: item.name,
    fullName: item.full_name,
    owner,
    description: normalizeDescription(item.description),
    url: `https://bestofjs.org/projects/${item.slug}`,
    ownerAvatarUrl: buildOwnerAvatarUrl(item.owner_id),
    language: 'Node',
    stars: trendDelta,
    forks: Math.max(0, item.stars),
    hotScore: trendDelta * 1000 + Math.max(0, item.stars),
    createdAt: normalizeDate(item.created_at, nowIso),
    updatedAt: normalizeDate(item.pushed_at, nowIso),
  }
}
