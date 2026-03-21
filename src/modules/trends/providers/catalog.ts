import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { githubTrendSourceModule } from '@/modules/trends/sources/github'
import { nodeTrendSourceModule } from '@/modules/trends/sources/node'
import { npmTrendSourceModule } from '@/modules/trends/sources/npm'
import { reactTrendSourceModule } from '@/modules/trends/sources/react'
import { vueTrendSourceModule } from '@/modules/trends/sources/vue'

export const trendSourceModules: TrendSourceModule[] = [
  githubTrendSourceModule,
  npmTrendSourceModule,
  nodeTrendSourceModule,
  reactTrendSourceModule,
  vueTrendSourceModule,
]
