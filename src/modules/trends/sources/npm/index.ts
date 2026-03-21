import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { NpmTrendProvider } from '@/modules/trends/sources/npm/provider'

export const npmTrendSourceModule: TrendSourceModule = {
  id: 'npm',
  createProvider: () => new NpmTrendProvider(),
}

export { NpmTrendProvider } from '@/modules/trends/sources/npm/provider'
