import type { NpmDownloadsPointResponse, NpmSearchObject, NpmSearchResponse } from '@/modules/trends/sources/npm/types'
import type { TrendPeriod, TrendQuery } from '@/modules/trends/types'

const PERIOD_POINT_RANGE_MAP: Record<TrendPeriod, string> = {
  today: 'last-day',
  week: 'last-week',
  month: 'last-month',
}

const PERIOD_RANGE_START_MAP: Record<TrendPeriod, string> = {
  today: 'last-week',
  week: 'last-month',
  month: 'last-year',
}

const BULK_DOWNLOAD_CHUNK_SIZE = 40
const NPM_SEARCH_PAGE_SIZE = 120
const MAX_NPM_SEARCH_PAGES = 5

const LANGUAGE_KEYWORD_MAP: Record<string, string> = {
  'js': 'javascript',
  'javascript': 'javascript',
  'ts': 'typescript',
  'typescript': 'typescript',
  'python': 'python',
  'py': 'python',
  'go': 'go-lang',
  'golang': 'go-lang',
  'rust': 'rust',
  'rs': 'rust',
  'java': 'java',
  'csharp': 'c-sharp',
  'c#': 'c-sharp',
  'cpp': 'c-plus-plus',
  'c++': 'c-plus-plus',
  'ruby': 'ruby',
  'rb': 'ruby',
  'php': 'php',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'dart': 'dart',
  'vue': 'vue',
  'react': 'react',
  'angular': 'angular',
  'svelte': 'svelte',
  'node': 'nodejs',
  'nodejs': 'nodejs',
  'deno': 'deno',
  'bun': 'bun',
}

const WHITESPACE_REGEX = /\s+/g

function resolveLanguageKeyword(input: string): string | null {
  const normalized = input.trim().toLowerCase().replace(WHITESPACE_REGEX, '')

  if (LANGUAGE_KEYWORD_MAP[normalized]) {
    return LANGUAGE_KEYWORD_MAP[normalized]
  }

  if (normalized.includes('script')) {
    return 'javascript'
  }

  return null
}

export function buildNpmSearchConditions(query: TrendQuery): string[] {
  const conditions: string[] = []
  const keyword = query.keyword?.trim()
  const language = query.language?.trim()

  if (keyword) {
    const mapped = resolveLanguageKeyword(keyword)

    if (mapped) {
      conditions.push(`keywords:${mapped}`)
    }
    else {
      conditions.push(keyword)
    }
  }

  if (language) {
    const mapped = resolveLanguageKeyword(language)

    if (mapped) {
      conditions.push(`keywords:${mapped}`)
    }
    else {
      conditions.push(`keywords:${language}`)
    }
  }

  if (!conditions.length) {
    conditions.push('javascript')
  }

  return conditions
}

function getActivityCutoff(period: TrendPeriod): Date {
  const now = new Date()
  const daysMap: Record<TrendPeriod, number> = {
    today: 1,
    week: 7,
    month: 30,
  }
  const days = daysMap[period]
  now.setDate(now.getDate() - days)
  return now
}

export function isPackageRecentlyUpdated(dateString: string | undefined, period: TrendPeriod): boolean {
  if (!dateString) {
    return false
  }

  const packageDate = new Date(dateString)
  const cutoff = getActivityCutoff(period)
  return packageDate >= cutoff
}

async function fetchNpmSearchPage(conditions: string[], from: number): Promise<NpmSearchResponse> {
  const searchParams = new URLSearchParams({
    text: conditions.join(' '),
    size: String(NPM_SEARCH_PAGE_SIZE),
    from: String(from),
  })

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

  const payload = await response.json() as NpmSearchResponse
  return payload
}

export async function searchNpmTrendingPackages(query: TrendQuery): Promise<NpmSearchResponse> {
  const conditions = buildNpmSearchConditions(query)
  const targetCount = query.offset + query.limit
  const activePackages: NpmSearchObject[] = []
  let lastPayload: NpmSearchResponse = { objects: [] }

  for (let page = 0; page < MAX_NPM_SEARCH_PAGES && activePackages.length < targetCount; page++) {
    const payload = await fetchNpmSearchPage(conditions, page * NPM_SEARCH_PAGE_SIZE)
    lastPayload = payload
    activePackages.push(...payload.objects.filter(obj => isPackageRecentlyUpdated(obj.package.date, query.period)))

    if (payload.objects.length < NPM_SEARCH_PAGE_SIZE)
      break
  }

  return {
    ...lastPayload,
    objects: activePackages.slice(0, targetCount),
  }
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

function sumDownloads(downloads: { downloads: number }[]) {
  return downloads.reduce((sum, entry) => sum + entry.downloads, 0)
}

async function fetchRangeDownloads(packageName: string, period: TrendPeriod): Promise<number> {
  const range = PERIOD_RANGE_START_MAP[period]
  const encoded = encodeURIComponent(packageName)

  try {
    const response = await fetch(`https://api.npmjs.org/downloads/range/${range}/${encoded}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ai-hot-trend',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return 0
    }

    const data = await response.json() as { downloads: { downloads: number }[] }
    return sumDownloads(data.downloads)
  }
  catch {
    return 0
  }
}

async function fetchCurrentPeriodDownloads(packageName: string, period: TrendPeriod): Promise<number> {
  const range = PERIOD_POINT_RANGE_MAP[period]
  const encoded = encodeURIComponent(packageName)

  try {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${range}/${encoded}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ai-hot-trend',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return 0
    }

    const data = await response.json() as { downloads?: number }
    return typeof data.downloads === 'number' ? data.downloads : 0
  }
  catch {
    return 0
  }
}

export interface NpmDownloadStats {
  currentDownloads: number
  previousDownloads: number
  growthRate: number
}

async function fetchSinglePackageDownloads(packageName: string, period: TrendPeriod): Promise<NpmDownloadStats> {
  const [current, previous] = await Promise.all([
    fetchCurrentPeriodDownloads(packageName, period),
    fetchRangeDownloads(packageName, period),
  ])

  const previousBaseline = Math.max(previous, 1)
  const growthRate = previous > 0 ? ((current - previous) / previousBaseline) * 100 : (current > 0 ? 100 : 0)

  return {
    currentDownloads: current,
    previousDownloads: previous,
    growthRate: Math.max(0, growthRate),
  }
}

async function fetchBulkCurrentPeriod(range: string, packageNames: string[]): Promise<Map<string, number>> {
  const encodedNames = packageNames.map(n => encodeURIComponent(n)).join(',')

  try {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${range}/${encodedNames}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ai-hot-trend',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return new Map()
    }

    return normalizeNpmDownloadResponse(await response.json() as NpmDownloadsPointResponse)
  }
  catch {
    return new Map()
  }
}

export async function fetchNpmDownloadStats(period: TrendPeriod, packageNames: string[]): Promise<Map<string, NpmDownloadStats>> {
  if (!packageNames.length) {
    return new Map<string, NpmDownloadStats>()
  }

  const statsMap = new Map<string, NpmDownloadStats>()
  const uniqueNames = [...new Set(packageNames)]
  const scopedPackages = uniqueNames.filter(name => name.startsWith('@'))
  const unscopedPackages = uniqueNames.filter(name => !name.startsWith('@'))
  const currentRange = PERIOD_POINT_RANGE_MAP[period]

  const currentBulkMap = await fetchBulkCurrentPeriod(currentRange, unscopedPackages)

  for (const name of unscopedPackages) {
    const current = currentBulkMap.get(name) ?? 0
    statsMap.set(name, {
      currentDownloads: current,
      previousDownloads: 0,
      growthRate: current > 0 ? 100 : 0,
    })
  }

  for (const chunk of chunkArray(scopedPackages, BULK_DOWNLOAD_CHUNK_SIZE)) {
    const results = await Promise.all(
      chunk.map(async (name) => {
        const stats = await fetchSinglePackageDownloads(name, period)
        return [name, stats] as const
      }),
    )

    for (const [name, stats] of results) {
      statsMap.set(name, stats)
    }
  }

  const previousRanges = await Promise.all(
    unscopedPackages.map(async (name) => {
      const previous = await fetchRangeDownloads(name, period)
      const current = statsMap.get(name)?.currentDownloads ?? 0
      const previousBaseline = Math.max(previous, 1)
      const growthRate = previous > 0 ? ((current - previous) / previousBaseline) * 100 : (current > 0 ? 100 : 0)
      return [name, {
        currentDownloads: current,
        previousDownloads: previous,
        growthRate: Math.max(0, growthRate),
      }] as const
    }),
  )

  for (const [name, stats] of previousRanges) {
    statsMap.set(name, stats)
  }

  return statsMap
}
