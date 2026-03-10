import type { FavoritePayload } from '@/modules/favorites/types'
import { PrismaFavoriteRepository } from '@/modules/favorites/repository'

class FavoriteService {
  constructor(private readonly repository = new PrismaFavoriteRepository()) {}

  async listByUser(userId: string) {
    const items = await this.repository.listByUser(userId)

    return {
      count: items.length,
      items,
    }
  }

  async upsert(userId: string, payload: FavoritePayload) {
    const item = await this.repository.upsert(userId, payload)
    const summary = await this.listByUser(userId)

    return {
      item,
      count: summary.count,
      items: summary.items,
    }
  }

  async remove(userId: string, source: string, trendId: string) {
    const removed = await this.repository.remove(userId, source, trendId)
    const summary = await this.listByUser(userId)

    return {
      removed,
      count: summary.count,
      items: summary.items,
    }
  }
}

export const favoriteService = new FavoriteService()
