import type { FavoriteItem, FavoritePayload } from '@/modules/favorites/types'

export interface FavoriteRepository {
  listByUser: (userId: string) => FavoriteItem[]
  upsert: (userId: string, payload: FavoritePayload) => FavoriteItem
  remove: (userId: string, source: string, trendId: string) => boolean
}

function buildFavoriteKey(source: string, trendId: string) {
  return `${source}:${trendId}`
}

export class MemoryFavoriteRepository implements FavoriteRepository {
  private data = new Map<string, Map<string, FavoriteItem>>()

  listByUser(userId: string) {
    const favorites = this.data.get(userId)

    if (!favorites) {
      return []
    }

    return [...favorites.values()].toSorted((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
  }

  upsert(userId: string, payload: FavoritePayload) {
    const byUser = this.data.get(userId) ?? new Map<string, FavoriteItem>()
    const key = buildFavoriteKey(payload.source, payload.trendId)
    const existing = byUser.get(key)

    const item: FavoriteItem = {
      ...payload,
      userId,
      id: existing?.id ?? key,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    byUser.set(key, item)
    this.data.set(userId, byUser)

    return item
  }

  remove(userId: string, source: string, trendId: string) {
    const byUser = this.data.get(userId)

    if (!byUser) {
      return false
    }

    return byUser.delete(buildFavoriteKey(source, trendId))
  }
}
