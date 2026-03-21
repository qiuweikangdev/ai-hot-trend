import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { ReactTrendProvider } from '@/modules/trends/sources/react/provider'

export const reactTrendSourceModule: TrendSourceModule = {
  id: 'react',
  createProvider: () => new ReactTrendProvider(),
}

export { ReactTrendProvider } from '@/modules/trends/sources/react/provider'
