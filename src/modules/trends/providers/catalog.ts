import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { githubTrendSourceModule } from '@/modules/trends/sources/github'

export const trendSourceModules: TrendSourceModule[] = [
  githubTrendSourceModule,
]
