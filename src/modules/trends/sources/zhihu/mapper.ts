import type { ZhihuHotItem } from '@/modules/trends/sources/zhihu/types'
import type { TrendItem } from '@/modules/trends/types'

function normalizeDate(value: number | string | undefined) {
  const fallback = new Date().toISOString()

  if (value === undefined || value === null) {
    return fallback
  }

  const timestamp = typeof value === 'string' ? Number.parseInt(value, 10) : value

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return fallback
  }

  const date = new Date(timestamp * 1000)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toISOString()
}

const ZHIHU_API_URL_REGEX = /https?:\/\/api\.zhihu\.com\/(questions|articles)\/(\d+)/
const ZHIHU_URL_ID_REGEX = /\/(questions|articles)\/(\d+)/

function buildZhihuWebUrl(apiUrl: string | undefined) {
  if (!apiUrl) {
    return 'https://www.zhihu.com'
  }

  const match = apiUrl.match(ZHIHU_API_URL_REGEX)

  if (match) {
    const [, type, id] = match
    const webType = type === 'questions' ? 'question' : type
    return `https://www.zhihu.com/${webType}/${id}`
  }

  if (apiUrl.startsWith('https://www.zhihu.com')) {
    return apiUrl
  }

  return 'https://www.zhihu.com'
}

function buildZhihuAvatar(_author: ZhihuHotItem['author'] | undefined) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#0066FF"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="42" font-family="Georgia,serif" fill="white" font-weight="700">知</text></svg>'

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function buildOwnerName(author: ZhihuHotItem['author'] | undefined) {
  const name = author?.name?.trim()

  if (name) {
    return name
  }

  return '知乎用户'
}

function extractQuestionFromUrl(url: string | undefined) {
  if (!url) {
    return ''
  }

  const match = url.match(ZHIHU_URL_ID_REGEX)

  if (match) {
    return match[2]
  }

  return url
}

export function mapZhihuItemToTrendItem(item: ZhihuHotItem, index: number): TrendItem {
  const createdAt = normalizeDate(item.created)
  const followerCount = Math.max(0, item.follower_count ?? 0)
  const answerCount = Math.max(0, item.answer_count ?? 0)
  const commentCount = Math.max(0, item.comment_count ?? 0)

  return {
    id: `zhihu:${item.id}`,
    source: 'zhihu',
    rank: index + 1,
    title: item.title ?? '未知标题',
    fullName: extractQuestionFromUrl(item.url),
    owner: buildOwnerName(item.author),
    description: item.excerpt?.trim() || item.title || '暂无摘要',
    url: buildZhihuWebUrl(item.url),
    ownerAvatarUrl: buildZhihuAvatar(item.author),
    language: null,
    stars: followerCount,
    forks: answerCount,
    hotScore: (followerCount * 10) + (answerCount * 5) + (commentCount * 2),
    createdAt,
    updatedAt: createdAt,
  }
}
