import type { TrendProvider } from '@/modules/trends/provider'
import type { TrendSource } from '@/modules/trends/types'

export interface TrendSourceModule {
  readonly id: TrendSource
  createProvider: () => TrendProvider
}
