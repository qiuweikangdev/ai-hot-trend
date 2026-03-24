import type { WeiboHotTopic } from '@/modules/trends/sources/weibo/types'

const WEIBO_HOT_PAGE_URL = 'https://weibo.cn/pub/?vt=4&pos=108'
const HOT_TOPIC_LINK_REGEX = /<div class="c"><a href="([^"]+)">([\s\S]*?)<\/a><\/div>/g
const HTML_TAG_REGEX = /<[^>]+>/g
const HTML_ENTITY_REGEX = /&(amp|lt|gt|quot|#39|nbsp);/g

function decodeHtmlEntities(value: string) {
  return value.replace(HTML_ENTITY_REGEX, (_, token: string) => {
    switch (token) {
      case 'amp':
        return '&'
      case 'lt':
        return '<'
      case 'gt':
        return '>'
      case 'quot':
        return '"'
      case '#39':
        return '\''
      case 'nbsp':
        return ' '
      default:
        return ''
    }
  })
}

function normalizeText(value: string) {
  return decodeHtmlEntities(value)
    .replace(HTML_TAG_REGEX, '')
    .replaceAll('\n', ' ')
    .replaceAll('\r', ' ')
    .trim()
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()

  if (trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`
  }

  if (trimmed.startsWith('/')) {
    return `https://weibo.cn${trimmed}`
  }

  return WEIBO_HOT_PAGE_URL
}

function extractKeywordFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const q = parsed.searchParams.get('q')?.trim()

    if (!q) {
      return ''
    }

    return q
  }
  catch {
    return ''
  }
}

function parseHotTopics(rawHtml: string): WeiboHotTopic[] {
  const topics: WeiboHotTopic[] = []
  const seenKeys = new Set<string>()

  for (const match of rawHtml.matchAll(HOT_TOPIC_LINK_REGEX)) {
    const url = normalizeUrl(match[1])
    const title = normalizeText(match[2])

    if (!title) {
      continue
    }

    const keyword = extractKeywordFromUrl(url) || title
    const uniqueKey = `${keyword}::${url}`

    if (seenKeys.has(uniqueKey)) {
      continue
    }

    seenKeys.add(uniqueKey)

    topics.push({
      title,
      keyword,
      url,
    })
  }

  if (!topics.length) {
    throw new Error('微博热搜抓取失败: 未解析到任何热点条目')
  }

  return topics
}

export async function fetchWeiboHotTopics() {
  const response = await fetch(WEIBO_HOT_PAGE_URL, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`微博热搜抓取失败: ${response.status} ${errorText}`)
  }

  const rawHtml = await response.text()
  return parseHotTopics(rawHtml)
}

export function filterWeiboHotTopics(topics: WeiboHotTopic[], keyword?: string, language?: string) {
  const normalizedKeyword = keyword?.trim().toLowerCase()
  const normalizedLanguage = language?.trim().toLowerCase()

  if (!normalizedKeyword && !normalizedLanguage) {
    return topics
  }

  return topics.filter((topic) => {
    const text = `${topic.title} ${topic.keyword}`.toLowerCase()
    const keywordMatched = normalizedKeyword ? text.includes(normalizedKeyword) : true
    const languageMatched = normalizedLanguage ? text.includes(normalizedLanguage) : true

    return keywordMatched && languageMatched
  })
}
