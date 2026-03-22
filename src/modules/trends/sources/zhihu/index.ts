import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { ZhihuTrendProvider } from '@/modules/trends/sources/zhihu/provider'

export const zhihuTrendSourceModule: TrendSourceModule = {
  id: 'zhihu',
  createProvider: () => new ZhihuTrendProvider(),
}

export { ZhihuTrendProvider } from '@/modules/trends/sources/zhihu/provider'
