import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { V2exTrendProvider } from '@/modules/trends/sources/v2ex/provider'

export const v2exTrendSourceModule: TrendSourceModule = {
  id: 'v2ex',
  createProvider: () => new V2exTrendProvider(),
}

export { V2exTrendProvider } from '@/modules/trends/sources/v2ex/provider'
