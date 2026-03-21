import type { NpmSearchObject } from '@/modules/trends/sources/npm/types'
import type { TrendItem } from '@/modules/trends/types'

function normalizeDescription(value: string | undefined) {
  const text = value?.trim()

  if (!text) {
    return '暂无包描述'
  }

  return text.replaceAll('\n', ' ')
}

function encodeSvgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function buildNpmAvatar(seed: string) {
  const normalizedSeed = seed.trim().toLowerCase()
  const hash = [...normalizedSeed].reduce((sum, char) => {
    return (sum + char.charCodeAt(0)) % 360
  }, 0)
  const letter = seed.trim().charAt(0).toUpperCase() || 'N'

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='hsl(${hash} 78% 62%)'/><stop offset='100%' stop-color='hsl(${(hash + 30) % 360} 72% 45%)'/></linearGradient></defs><rect width='64' height='64' rx='32' fill='url(#g)'/><text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' font-size='30' font-family='Arial, Helvetica, sans-serif' fill='white' font-weight='700'>${letter}</text></svg>`

  return encodeSvgDataUri(svg)
}

function inferLanguageFromKeywords(keywords: string[] | undefined) {
  if (!keywords?.length) {
    return null
  }

  const candidateKeywords = ['typescript', 'javascript', 'vue', 'react', 'svelte', 'solid', 'node']
  const matched = keywords.find(keyword => candidateKeywords.includes(keyword.toLowerCase()))

  return matched ?? null
}

export function mapNpmPackageToTrendItem(item: NpmSearchObject, index: number, downloads: number): TrendItem {
  const packageName = item.package.name
  const publishDate = item.package.date ?? new Date().toISOString()
  const qualityScore = Math.max(1, Math.round(item.score.detail.quality * 1000))
  const maintenanceScore = Math.max(1, Math.round(item.score.detail.maintenance * 1000))
  const normalizedDownloads = Math.max(0, downloads)

  return {
    id: `npm:${packageName}`,
    source: 'npm',
    rank: index + 1,
    title: packageName,
    fullName: packageName,
    owner: item.package.publisher?.username ?? item.package.maintainers?.[0]?.username ?? 'npm',
    description: normalizeDescription(item.package.description),
    url: item.package.links?.npm ?? `https://www.npmjs.com/package/${packageName}`,
    ownerAvatarUrl: buildNpmAvatar(packageName),
    language: inferLanguageFromKeywords(item.package.keywords),
    stars: normalizedDownloads,
    forks: qualityScore,
    hotScore: normalizedDownloads + maintenanceScore,
    createdAt: publishDate,
    updatedAt: publishDate,
  }
}
