import type { JuejinFeedItem } from '@/modules/trends/sources/juejin/types'
import type { TrendItem } from '@/modules/trends/types'

function normalizeDescription(value: string | undefined) {
  const text = value?.trim()

  if (!text) {
    return '暂无摘要'
  }

  return text.replaceAll('\n', ' ')
}

function normalizeTimestamp(value: string | undefined) {
  if (!value) {
    return new Date().toISOString()
  }

  const timestamp = Number.parseInt(value, 10)

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return new Date().toISOString()
  }

  return new Date(timestamp * 1000).toISOString()
}

const HTTP_URL_REGEX = /^https?:\/\//

function buildJuejinUrl(item: JuejinFeedItem) {
  const externalLink = item.article_info.link_url?.trim()

  if (externalLink && HTTP_URL_REGEX.test(externalLink)) {
    return externalLink
  }

  return `https://juejin.cn/post/${item.article_id}`
}

function encodeSvgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function buildJuejinAvatar(seed: string) {
  const normalizedSeed = seed.trim().toLowerCase()
  const hash = [...normalizedSeed].reduce((sum, char) => {
    return (sum + char.charCodeAt(0)) % 360
  }, 0)

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='hsl(${hash} 82% 58%)'/><stop offset='100%' stop-color='hsl(${(hash + 36) % 360} 76% 44%)'/></linearGradient></defs><rect width='64' height='64' rx='16' fill='url(#g)'/><text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' font-size='30' font-family='Arial, Helvetica, sans-serif' fill='white' font-weight='700'>掘</text></svg>`

  return encodeSvgDataUri(svg)
}

function resolveJuejinAvatar(item: JuejinFeedItem, ownerName: string) {
  const avatar = item.author_user_info?.avatar_large?.trim()

  if (avatar && HTTP_URL_REGEX.test(avatar)) {
    return avatar
  }

  return buildJuejinAvatar(ownerName)
}

function inferLanguage(tags: string[]) {
  const keyword = tags.join(' ').toLowerCase()

  const languageKeywords = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'php', 'vue', 'react']
  const matched = languageKeywords.find(item => keyword.includes(item))

  return matched ?? null
}

export function mapJuejinItemToTrendItem(item: JuejinFeedItem, index: number): TrendItem {
  const tags = (item.tags ?? []).map(tag => tag.tag_name?.trim()).filter(Boolean) as string[]
  const viewCount = Math.max(0, item.article_info.view_count ?? 0)
  const diggCount = Math.max(0, item.article_info.digg_count ?? 0)
  const commentCount = Math.max(0, item.article_info.comment_count ?? 0)
  const hotIndex = Math.max(0, item.article_info.hot_index ?? 0)
  const createdAt = normalizeTimestamp(item.article_info.ctime)
  const updatedAt = normalizeTimestamp(item.article_info.mtime)
  const ownerName = item.author_user_info?.user_name?.trim() || '掘金用户'

  return {
    id: `juejin:${item.article_id}`,
    source: 'juejin',
    rank: index + 1,
    title: item.article_info.title || '未命名文章',
    fullName: tags.length ? `#${tags[0]}` : '掘金文章',
    owner: ownerName,
    description: normalizeDescription(item.article_info.brief_content),
    url: buildJuejinUrl(item),
    ownerAvatarUrl: resolveJuejinAvatar(item, ownerName),
    language: inferLanguage(tags),
    stars: hotIndex > 0 ? hotIndex : viewCount,
    forks: commentCount,
    hotScore: hotIndex > 0 ? hotIndex : (viewCount * 2 + diggCount * 20 + commentCount * 10),
    createdAt,
    updatedAt,
  }
}
