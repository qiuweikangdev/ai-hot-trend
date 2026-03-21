import type { NpmDownloadsPointResponse, NpmSearchResponse } from '@/modules/trends/sources/npm/types'
import type { TrendPeriod, TrendQuery } from '@/modules/trends/types'

const PERIOD_RANGE_MAP: Record<TrendPeriod, string> = {
  today: 'last-day',
  week: 'last-week',
  month: 'last-month',
}

const BULK_DOWNLOAD_CHUNK_SIZE = 40

function buildNpmSearchParams(query: TrendQuery) {
  const keyword = query.keyword?.trim()
  const language = query.language?.trim()

  const conditions: string[] = []

  if (keyword) {
    conditions.push(keyword)
  }

  if (language) {
    conditions.push(`keywords:${language}`)
  }

  if (!conditions.length) {
    conditions.push('javascript')
  }

  return new URLSearchParams({
    text: conditions.join(' '),
    size: String(Math.min(query.limit * 4, 80)),
    from: String(query.offset),
  })
}

export async function searchNpmTrendingPackages(query: TrendQuery) {
  const searchParams = buildNpmSearchParams(query)

  const response = await fetch(`https://registry.npmjs.org/-/v1/search?${searchParams.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`npm 热点抓取失败: ${response.status} ${errorText}`)
  }

  return await response.json() as NpmSearchResponse
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function normalizeNpmDownloadResponse(response: NpmDownloadsPointResponse): Map<string, number> {
  const maybeSingle = response as { package?: string, downloads?: number }

  if (typeof maybeSingle.package === 'string' && typeof maybeSingle.downloads === 'number') {
    return new Map([[maybeSingle.package, maybeSingle.downloads]])
  }

  return new Map(
    Object.entries(response as Record<string, { downloads: number }>).map(([packageName, payload]) => {
      return [packageName, typeof payload.downloads === 'number' ? payload.downloads : 0]
    }),
  )
}

async function fetchSingleNpmDownload(periodRange: string, packageName: string) {
  const response = await fetch(`https://api.npmjs.org/downloads/point/${periodRange}/${encodeURIComponent(packageName)}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return 0
  }

  const payload = await response.json() as { downloads?: number }
  return typeof payload.downloads === 'number' ? payload.downloads : 0
}

async function fetchBulkNpmDownloads(periodRange: string, packageNames: string[]) {
  const encodedPackageNames = packageNames.map(packageName => encodeURIComponent(packageName)).join(',')
  const response = await fetch(`https://api.npmjs.org/downloads/point/${periodRange}/${encodedPackageNames}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json() as NpmDownloadsPointResponse
  return normalizeNpmDownloadResponse(payload)
}

export async function fetchNpmDownloadStats(period: TrendPeriod, packageNames: string[]): Promise<Map<string, number>> {
  if (!packageNames.length) {
    return new Map<string, number>()
  }

  const periodRange = PERIOD_RANGE_MAP[period]
  const uniqueNames = [...new Set(packageNames)]
  const scopedPackages = uniqueNames.filter(packageName => packageName.startsWith('@'))
  const unscopedPackages = uniqueNames.filter(packageName => !packageName.startsWith('@'))
  const statsMap = new Map<string, number>()

  for (const chunk of chunkArray(unscopedPackages, BULK_DOWNLOAD_CHUNK_SIZE)) {
    const bulkResult = await fetchBulkNpmDownloads(periodRange, chunk)

    if (bulkResult) {
      for (const [packageName, downloads] of bulkResult) {
        statsMap.set(packageName, downloads)
      }

      continue
    }

    const fallbackResults = await Promise.all(chunk.map(async (packageName) => {
      const downloads = await fetchSingleNpmDownload(periodRange, packageName)
      return [packageName, downloads] as const
    }))

    for (const [packageName, downloads] of fallbackResults) {
      statsMap.set(packageName, downloads)
    }
  }

  if (scopedPackages.length) {
    const scopedResults = await Promise.all(scopedPackages.map(async (packageName) => {
      const downloads = await fetchSingleNpmDownload(periodRange, packageName)
      return [packageName, downloads] as const
    }))

    for (const [packageName, downloads] of scopedResults) {
      statsMap.set(packageName, downloads)
    }
  }

  for (const packageName of uniqueNames) {
    if (!statsMap.has(packageName)) {
      statsMap.set(packageName, 0)
    }
  }

  return statsMap
}
