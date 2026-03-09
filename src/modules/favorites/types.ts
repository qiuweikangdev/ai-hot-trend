import type { TrendSource } from '@/modules/trends/types'

export interface FavoritePayload {
  source: TrendSource
  trendId: string
  title: string
  fullName: string
  description: string
  url: string
  language: string | null
  stars: number
  forks: number
  ownerAvatarUrl: string
}

export interface FavoriteItem extends FavoritePayload {
  id: string
  userId: string
  createdAt: string
}
