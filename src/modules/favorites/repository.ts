import type { FavoriteItem, FavoritePayload } from '@/modules/favorites/types'
import { getPrisma } from '@/lib/prisma'
import { TREND_SOURCE_VALUES } from '@/modules/trends/types'

export interface FavoriteRepository {
  listByUser: (userId: string) => Promise<FavoriteItem[]>
  upsert: (userId: string, payload: FavoritePayload) => Promise<FavoriteItem>
  remove: (userId: string, source: string, trendId: string) => Promise<boolean>
}

function mapFavoriteToItem(favorite: {
  id: string
  userId: string
  source: string
  trendId: string
  title: string
  fullName: string
  description: string
  url: string
  language: string | null
  stars: number
  forks: number
  ownerAvatarUrl: string
  createdAt: Date
}) {
  const source = TREND_SOURCE_VALUES.includes(favorite.source as FavoriteItem['source'])
    ? favorite.source as FavoriteItem['source']
    : 'github'

  return {
    id: favorite.id,
    userId: favorite.userId,
    source,
    trendId: favorite.trendId,
    title: favorite.title,
    fullName: favorite.fullName,
    description: favorite.description,
    url: favorite.url,
    language: favorite.language,
    stars: favorite.stars,
    forks: favorite.forks,
    ownerAvatarUrl: favorite.ownerAvatarUrl,
    createdAt: favorite.createdAt.toISOString(),
  }
}

export class PrismaFavoriteRepository implements FavoriteRepository {
  async listByUser(userId: string) {
    const prisma = getPrisma()

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return favorites.map(mapFavoriteToItem)
  }

  async upsert(userId: string, payload: FavoritePayload) {
    const prisma = getPrisma()

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_source_trendId: {
          userId,
          source: payload.source,
          trendId: payload.trendId,
        },
      },
      create: {
        userId,
        source: payload.source,
        trendId: payload.trendId,
        title: payload.title,
        fullName: payload.fullName,
        description: payload.description,
        url: payload.url,
        language: payload.language,
        stars: payload.stars,
        forks: payload.forks,
        ownerAvatarUrl: payload.ownerAvatarUrl,
      },
      update: {
        title: payload.title,
        fullName: payload.fullName,
        description: payload.description,
        url: payload.url,
        language: payload.language,
        stars: payload.stars,
        forks: payload.forks,
        ownerAvatarUrl: payload.ownerAvatarUrl,
      },
    })

    return mapFavoriteToItem(favorite)
  }

  async remove(userId: string, source: string, trendId: string) {
    const prisma = getPrisma()

    const result = await prisma.favorite.deleteMany({
      where: {
        userId,
        source,
        trendId,
      },
    })

    return result.count > 0
  }
}
