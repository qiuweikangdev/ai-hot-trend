import type { TrendProvider, TrendProviderContext } from '@/modules/trends/provider'
import type { TrendItem, TrendQuery } from '@/modules/trends/types'
import { fetchNpmDownloadStats, searchNpmTrendingPackages } from '@/modules/trends/sources/npm/api'
import { mapNpmPackageToTrendItem } from '@/modules/trends/sources/npm/mapper'

export class NpmTrendProvider implements TrendProvider {
  readonly source = 'npm' as const

  async fetchTrends(query: TrendQuery, _context: TrendProviderContext): Promise<TrendItem[]> {
    const payload = await searchNpmTrendingPackages(query)
    const packageNames = payload.objects.map(item => item.package.name)
    const downloadStats = await fetchNpmDownloadStats(query.period, packageNames)

    const rankedItems = payload.objects
      .map((item) => {
        const downloads = downloadStats.get(item.package.name) ?? 0

        return {
          item,
          downloads,
        }
      })
      .sort((left, right) => {
        return right.downloads - left.downloads
      })
      .slice(0, query.limit)

    return rankedItems.map((entry, index) => {
      return mapNpmPackageToTrendItem(entry.item, index, entry.downloads)
    })
  }
}
