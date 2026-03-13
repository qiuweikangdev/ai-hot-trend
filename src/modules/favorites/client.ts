import type { FavoriteItem } from '@/modules/favorites/types'
import type { TrendItem, TrendSource } from '@/modules/trends/types'

interface FavoriteSummary {
  count: number
  items: FavoriteItem[]
}

interface FavoritesResponse {
  success: boolean
  message?: string
  data?: FavoriteSummary
}

async function readFavoriteResponse(response: Response) {
  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  const json = await response.json() as FavoritesResponse

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || '收藏操作失败')
  }

  return json.data
}

export async function fetchFavorites() {
  const response = await fetch('/api/favorites', {
    cache: 'no-store',
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  return readFavoriteResponse(response)
}

export async function createFavorite(item: TrendItem) {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        source: item.source,
        trendId: item.id,
        title: item.title,
        fullName: item.fullName,
        description: item.description,
        url: item.url,
        language: item.language,
        stars: item.stars,
        forks: item.forks,
        ownerAvatarUrl: item.ownerAvatarUrl,
      },
    }),
  })

  return readFavoriteResponse(response)
}

export async function removeFavorite(source: TrendSource, trendId: string) {
  const response = await fetch('/api/favorites', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source,
      trendId,
    }),
  })

  return readFavoriteResponse(response)
}
