import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { AiTrendProvider } from '@/modules/trends/sources/ai/provider'

export const aiTrendSourceModule: TrendSourceModule = {
  id: 'ai',
  createProvider: () => new AiTrendProvider(),
}

export { AiTrendProvider } from '@/modules/trends/sources/ai/provider'
