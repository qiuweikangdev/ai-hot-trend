import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { GithubTrendProvider } from '@/modules/trends/sources/github/provider'

export const githubTrendSourceModule: TrendSourceModule = {
  id: 'github',
  createProvider: () => new GithubTrendProvider(),
}

export { GithubTrendProvider } from '@/modules/trends/sources/github/provider'
