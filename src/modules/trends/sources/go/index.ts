import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { GoTrendProvider } from '@/modules/trends/sources/go/provider'

export const goTrendSourceModule: TrendSourceModule = {
  id: 'go',
  createProvider: () => new GoTrendProvider(),
}

export { GoTrendProvider } from '@/modules/trends/sources/go/provider'
