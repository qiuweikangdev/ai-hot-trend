import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { JuejinTrendProvider } from '@/modules/trends/sources/juejin/provider'

export const juejinTrendSourceModule: TrendSourceModule = {
  id: 'juejin',
  createProvider: () => new JuejinTrendProvider(),
}

export { JuejinTrendProvider } from '@/modules/trends/sources/juejin/provider'
