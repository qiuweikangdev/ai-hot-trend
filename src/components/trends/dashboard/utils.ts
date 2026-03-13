import type { TrendItem } from '@/modules/trends/types'

export function buildFavoriteKey(source: string, trendId: string) {
  return `${source}:${trendId}`
}

export function getDisplayName(user: { name?: string | null, email?: string | null }) {
  return user.name || user.email || '用户'
}

export function trimText(value: string) {
  return value.trim()
}

export function collectQuickLanguages(items: TrendItem[] | undefined, presetLanguages: string[]) {
  const languages = items
    ?.map(item => item.language)
    .filter((item): item is string => Boolean(item)) ?? []

  return [...new Set([...presetLanguages, ...languages])]
}
