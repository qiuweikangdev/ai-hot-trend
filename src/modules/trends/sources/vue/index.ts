import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { VueTrendProvider } from '@/modules/trends/sources/vue/provider'

export const vueTrendSourceModule: TrendSourceModule = {
  id: 'vue',
  createProvider: () => new VueTrendProvider(),
}

export { VueTrendProvider } from '@/modules/trends/sources/vue/provider'
