import { trendSourceModules } from '@/modules/trends/providers/catalog'
import { registerTrendProvider } from '@/modules/trends/registry'

let isProviderBootstrapped = false

export function bootstrapTrendProviders() {
  if (isProviderBootstrapped) {
    return
  }

  // Providers are bootstrapped from a single factory list so new sources only
  // need to register once in the trends domain.
  for (const sourceModule of trendSourceModules) {
    registerTrendProvider(sourceModule.createProvider())
  }

  isProviderBootstrapped = true
}
