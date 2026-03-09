import { GithubTrendProvider } from '@/modules/trends/providers/github'
import { registerTrendProvider } from '@/modules/trends/registry'

let isProviderBootstrapped = false

export function bootstrapTrendProviders() {
  if (isProviderBootstrapped) {
    return
  }

  registerTrendProvider(new GithubTrendProvider())
  isProviderBootstrapped = true
}
