import type { TrendProvider } from '@/modules/trends/provider'
import type { TrendSource } from '@/modules/trends/types'

const providerRegistry = new Map<TrendSource, TrendProvider>()

export function registerTrendProvider(provider: TrendProvider) {
  providerRegistry.set(provider.source, provider)
}

export function getTrendProvider(source: TrendSource) {
  return providerRegistry.get(source)
}

export function listTrendProviders() {
  return [...providerRegistry.values()]
}
