import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { ComponentTrendProvider } from '@/modules/trends/sources/component/provider'

export const componentTrendSourceModule: TrendSourceModule = {
  id: 'component',
  createProvider: () => new ComponentTrendProvider(),
}

export { ComponentTrendProvider } from '@/modules/trends/sources/component/provider'
