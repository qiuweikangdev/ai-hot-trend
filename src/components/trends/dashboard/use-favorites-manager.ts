'use client'

import type { AuthSessionUser } from '@/lib/auth-session'
import type { FavoriteItem } from '@/modules/favorites/types'
import type { TrendItem } from '@/modules/trends/types'
import { useEffect, useMemo, useState } from 'react'
import {
  createFavorite,
  fetchFavorites,
  removeFavorite,
} from '@/modules/favorites/client'
import { buildFavoriteKey } from './utils'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

interface UseFavoritesManagerOptions {
  sessionUser: AuthSessionUser | null
  sessionUserId: string
  onNotice: (message: string) => void
  onRequireLogin: (message: string) => void
}

export function useFavoritesManager({
  sessionUser,
  sessionUserId,
  onNotice,
  onRequireLogin,
}: UseFavoritesManagerOptions) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [favoriteBusyKey, setFavoriteBusyKey] = useState('')

  const favoriteKeySet = useMemo(() => {
    return new Set(favorites.map(item => buildFavoriteKey(item.source, item.trendId)))
  }, [favorites])

  useEffect(() => {
    let cancelled = false

    async function loadFavorites() {
      if (!sessionUserId) {
        setFavorites([])
        setIsFavoriteLoading(false)
        return
      }

      setIsFavoriteLoading(true)

      try {
        const data = await fetchFavorites()

        if (!cancelled) {
          setFavorites(data?.items ?? [])
        }
      }
      catch {
        if (!cancelled) {
          setFavorites([])
        }
      }
      finally {
        if (!cancelled) {
          setIsFavoriteLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [sessionUserId])

  async function handleToggleFavorite(item: TrendItem) {
    if (!sessionUser) {
      onRequireLogin('请先登录后再收藏')
      return
    }

    const favoriteKey = buildFavoriteKey(item.source, item.id)
    const isFavorite = favoriteKeySet.has(favoriteKey)

    setFavoriteBusyKey(favoriteKey)

    try {
      const data = isFavorite
        ? await removeFavorite(item.source, item.id)
        : await createFavorite(item)

      setFavorites(data.items)
      onNotice(isFavorite ? `已取消收藏 ${item.title}` : `已收藏 ${item.title}`)
    }
    catch (error) {
      const message = getErrorMessage(error, '收藏操作失败')

      if (message === 'UNAUTHORIZED') {
        onRequireLogin('请先登录后再收藏')
      }
      else {
        onNotice(message)
      }
    }
    finally {
      setFavoriteBusyKey('')
    }
  }

  async function handleRemoveFavorite(item: FavoriteItem) {
    const favoriteKey = buildFavoriteKey(item.source, item.trendId)
    setFavoriteBusyKey(favoriteKey)

    try {
      const data = await removeFavorite(item.source, item.trendId)
      setFavorites(data.items)
      onNotice(`已取消收藏 ${item.title}`)
    }
    catch (error) {
      const message = getErrorMessage(error, '取消收藏失败')

      if (message === 'UNAUTHORIZED') {
        onRequireLogin('登录状态已失效，请重新登录')
      }
      else {
        onNotice(message)
      }
    }
    finally {
      setFavoriteBusyKey('')
    }
  }

  return {
    state: {
      favorites,
      isFavoriteLoading,
      favoriteBusyKey,
    },
    derived: {
      favoriteCount: favorites.length,
      favoriteKeySet,
    },
    actions: {
      setFavorites,
      handleToggleFavorite,
      handleRemoveFavorite,
    },
  }
}
