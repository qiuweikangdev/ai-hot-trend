import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { githubTrendSourceModule } from '@/modules/trends/sources/github'
import { npmTrendSourceModule } from '@/modules/trends/sources/npm'

export const trendSourceModules: TrendSourceModule[] = [
  githubTrendSourceModule,
  npmTrendSourceModule,
]
