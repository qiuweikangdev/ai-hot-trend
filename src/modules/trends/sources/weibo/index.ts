import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { WeiboTrendProvider } from '@/modules/trends/sources/weibo/provider'

export const weiboTrendSourceModule: TrendSourceModule = {
  id: 'weibo',
  createProvider: () => new WeiboTrendProvider(),
}

export { WeiboTrendProvider } from '@/modules/trends/sources/weibo/provider'
