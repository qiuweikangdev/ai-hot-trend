import type { FavoritePayload } from '@/modules/favorites/types'
import { MemoryFavoriteRepository } from '@/modules/favorites/repository'

class FavoriteService {
  constructor(private readonly repository = new MemoryFavoriteRepository()) {}

  listByUser(userId: string) {
    const items = this.repository.listByUser(userId)

    return {
      count: items.length,
      items,
    }
  }

  upsert(userId: string, payload: FavoritePayload) {
    const item = this.repository.upsert(userId, payload)
    const summary = this.listByUser(userId)

    return {
      item,
      count: summary.count,
      items: summary.items,
    }
  }

  remove(userId: string, source: string, trendId: string) {
    const removed = this.repository.remove(userId, source, trendId)
    const summary = this.listByUser(userId)

    return {
      removed,
      count: summary.count,
      items: summary.items,
    }
  }
}

export const favoriteService = new FavoriteService()
