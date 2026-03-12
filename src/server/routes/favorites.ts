import type { FavoritePayload } from '@/modules/favorites/types'
import type { TrendSource } from '@/modules/trends/types'
import { Hono } from 'hono'
import { favoriteService } from '@/modules/favorites/service'
import { TREND_SOURCE_VALUES } from '@/modules/trends/types'
import { auth } from '@/server/auth'

const favoritesRoute = new Hono()

interface SessionUser {
  id?: string
}

interface SessionData {
  userId?: string
}

interface SessionPayload {
  user?: SessionUser
  session?: SessionData
}

function normalizeText(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeCount(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.round(value))
}

function parseSource(value: unknown): TrendSource | null {
  if (typeof value !== 'string') {
    return null
  }

  return TREND_SOURCE_VALUES.includes(value as TrendSource)
    ? value as TrendSource
    : null
}

async function getSessionUserId(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: {
      disableRefresh: true,
    },
  })

  const payload = session as SessionPayload | null
  return payload?.user?.id || payload?.session?.userId || null
}

function parseFavoritePayload(rawValue: unknown): FavoritePayload | null {
  if (!rawValue || typeof rawValue !== 'object') {
    return null
  }

  const raw = rawValue as Record<string, unknown>
  const source = parseSource(raw.source)

  if (!source) {
    return null
  }

  const trendId = normalizeText(raw.trendId)
  const title = normalizeText(raw.title)
  const fullName = normalizeText(raw.fullName)
  const url = normalizeText(raw.url)

  if (!trendId || !title || !fullName || !url) {
    return null
  }

  return {
    source,
    trendId,
    title,
    fullName,
    description: normalizeText(raw.description, '暂无项目描述'),
    url,
    language: normalizeText(raw.language, '未知'),
    stars: normalizeCount(raw.stars),
    forks: normalizeCount(raw.forks),
    ownerAvatarUrl: normalizeText(raw.ownerAvatarUrl),
  }
}

favoritesRoute.get('/', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)

  if (!userId) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  const data = await favoriteService.listByUser(userId)

  return c.json({
    success: true,
    data,
  })
})

favoritesRoute.post('/', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)

  if (!userId) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  const body = await c.req.json().catch(() => null) as { item?: unknown } | null
  const payload = parseFavoritePayload(body?.item)

  if (!payload) {
    return c.json(
      {
        success: false,
        message: '参数错误，无法收藏当前项目',
      },
      400,
    )
  }

  const data = await favoriteService.upsert(userId, payload)

  return c.json(
    {
      success: true,
      data,
    },
    201,
  )
})

favoritesRoute.delete('/', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)

  if (!userId) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  const body = await c.req.json().catch(() => null) as {
    source?: unknown
    trendId?: unknown
  } | null
  const source = parseSource(body?.source)
  const trendId = normalizeText(body?.trendId)

  if (!source || !trendId) {
    return c.json(
      {
        success: false,
        message: '参数错误，无法取消收藏',
      },
      400,
    )
  }

  const data = await favoriteService.remove(userId, source, trendId)

  return c.json({
    success: true,
    data,
  })
})

export default favoritesRoute
