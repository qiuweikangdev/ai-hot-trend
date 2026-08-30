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
        const stats = downloadStats.get(item.package.name)

        return {
          item,
          stats,
        }
      })
      .filter(entry => entry.stats && entry.stats.currentDownloads > 0)
      .sort((left, right) => {
        return right.stats!.growthRate - left.stats!.growthRate
      })
      .slice(query.offset, query.offset + query.limit)

    return rankedItems.map((entry, index) => {
      return mapNpmPackageToTrendItem(
        entry.item,
        query.offset + index,
        entry.stats!.currentDownloads,
        entry.stats!.growthRate,
      )
    })
  }
}
