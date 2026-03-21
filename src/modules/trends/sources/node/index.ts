import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { NodeTrendProvider } from '@/modules/trends/sources/node/provider'

export const nodeTrendSourceModule: TrendSourceModule = {
  id: 'node',
  createProvider: () => new NodeTrendProvider(),
}

export { NodeTrendProvider } from '@/modules/trends/sources/node/provider'
