import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { githubTrendSourceModule } from '@/modules/trends/sources/github'
import { npmTrendSourceModule } from '@/modules/trends/sources/npm'
import { vueTrendSourceModule } from '@/modules/trends/sources/vue'

export const trendSourceModules: TrendSourceModule[] = [
  githubTrendSourceModule,
  npmTrendSourceModule,
  vueTrendSourceModule,
]
