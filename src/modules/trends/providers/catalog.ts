import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { aiTrendSourceModule } from '@/modules/trends/sources/ai'
import { componentTrendSourceModule } from '@/modules/trends/sources/component'
import { githubTrendSourceModule } from '@/modules/trends/sources/github'
import { juejinTrendSourceModule } from '@/modules/trends/sources/juejin'
import { nodeTrendSourceModule } from '@/modules/trends/sources/node'
import { npmTrendSourceModule } from '@/modules/trends/sources/npm'
import { pythonTrendSourceModule } from '@/modules/trends/sources/python'
import { reactTrendSourceModule } from '@/modules/trends/sources/react'
import { v2exTrendSourceModule } from '@/modules/trends/sources/v2ex'
import { vueTrendSourceModule } from '@/modules/trends/sources/vue'
import { weiboTrendSourceModule } from '@/modules/trends/sources/weibo'
import { zhihuTrendSourceModule } from '@/modules/trends/sources/zhihu'

export const trendSourceModules: TrendSourceModule[] = [
  githubTrendSourceModule,
  npmTrendSourceModule,
  nodeTrendSourceModule,
  reactTrendSourceModule,
  vueTrendSourceModule,
  aiTrendSourceModule,
  pythonTrendSourceModule,
  componentTrendSourceModule,
  zhihuTrendSourceModule,
  juejinTrendSourceModule,
  v2exTrendSourceModule,
  weiboTrendSourceModule,
]
