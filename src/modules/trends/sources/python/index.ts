import type { TrendSourceModule } from '@/modules/trends/sources/module'
import { PythonTrendProvider } from '@/modules/trends/sources/python/provider'

export const pythonTrendSourceModule: TrendSourceModule = {
  id: 'python',
  createProvider: () => new PythonTrendProvider(),
}

export { PythonTrendProvider } from '@/modules/trends/sources/python/provider'
