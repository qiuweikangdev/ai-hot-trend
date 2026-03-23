import type { V2exTopic } from '@/modules/trends/sources/v2ex/types'

const V2EX_HOT_API_URL = 'https://www.v2ex.com/api/topics/hot.json'
const V2EX_PROXY_API_URL = 'https://r.jina.ai/http://www.v2ex.com/?tab=hot'

const HOT_SECTION_REGEX = /今日热议主题([\s\S]*?)最热节点/
const TOPIC_ID_REGEX = /\/t\/(\d+)/

function parseHotLine(line: string) {
  if (!line.includes('/member/') || !line.includes('/t/')) {
    return null
  }

  const imageNameStart = line.indexOf(': ')
  const imageNameEnd = line.indexOf('](', imageNameStart)
  const avatarStart = line.indexOf('](', imageNameEnd) + 2
  const avatarEnd = line.indexOf(')', avatarStart)
  const titleStart = line.indexOf('[', avatarEnd) + 1
  const titleEnd = line.indexOf('](', titleStart)
  const topicUrlStart = line.indexOf('](', titleEnd) + 2
  const topicUrlEnd = line.indexOf(')', topicUrlStart)

  if (imageNameStart < 0 || imageNameEnd < 0 || avatarStart < 2 || avatarEnd < 0 || titleStart < 1 || titleEnd < 0 || topicUrlStart < 2 || topicUrlEnd < 0) {
    return null
  }

  const username = line.slice(imageNameStart + 2, imageNameEnd).trim()
  const avatarUrl = line.slice(avatarStart, avatarEnd).trim()
  const title = line.slice(titleStart, titleEnd).trim()
  const topicUrl = line.slice(topicUrlStart, topicUrlEnd).trim()

  if (!username || !avatarUrl || !title || !topicUrl.includes('/t/')) {
    return null
  }

  const topicIdMatch = topicUrl.match(TOPIC_ID_REGEX)
  const topicId = Number.parseInt(topicIdMatch?.[1] || '0', 10)

  return {
    username,
    avatarUrl,
    title,
    topicUrl,
    topicId,
  }
}

function parseProxyPayload(rawText: string): V2exTopic[] {
  const sectionMatch = rawText.match(HOT_SECTION_REGEX)
  const hotSection = sectionMatch?.[1] ?? rawText
  const lines = hotSection.split('\n').map(line => line.trim()).filter(Boolean)
  const parsedLines = lines
    .map(parseHotLine)
    .filter((entry): entry is NonNullable<ReturnType<typeof parseHotLine>> => Boolean(entry))

  const nowSec = Math.floor(Date.now() / 1000)

  return parsedLines.map((entry, index) => {
    const username = entry.username || `v2ex-user-${index + 1}`
    const avatarUrl = entry.avatarUrl || 'https://www.v2ex.com/static/img/v2ex@2x.png'
    const title = entry.title || 'V2EX 热议话题'
    const url = entry.topicUrl || 'https://www.v2ex.com'
    const topicId = entry.topicId

    return {
      id: Number.isNaN(topicId) ? index + 1 : topicId,
      title,
      url,
      created: nowSec,
      last_modified: nowSec,
      replies: 0,
      content: title,
      node: {
        id: 0,
        name: 'hot',
        title: '今日热议',
        url: 'https://www.v2ex.com/?tab=hot',
        topics: 0,
        stars: 0,
        avatar_large: avatarUrl,
      },
      member: {
        id: 0,
        username,
        url: `https://www.v2ex.com/member/${username}`,
        tagline: '',
        avatar_large: avatarUrl,
      },
    }
  })
}

async function fetchDirectHotTopics() {
  const response = await fetch(V2EX_HOT_API_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`V2EX 热点抓取失败: ${response.status} ${errorText}`)
  }

  return await response.json() as V2exTopic[]
}

async function fetchProxyHotTopics() {
  const response = await fetch(V2EX_PROXY_API_URL, {
    headers: {
      'Accept': 'text/plain',
      'User-Agent': 'ai-hot-trend',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`V2EX 代理热点抓取失败: ${response.status} ${errorText}`)
  }

  const rawText = await response.text()
  const topics = parseProxyPayload(rawText)

  if (!topics.length) {
    throw new Error('V2EX 代理热点抓取失败: 未解析到任何热点条目')
  }

  return topics
}

export async function fetchV2exHotTopics() {
  try {
    return await fetchDirectHotTopics()
  }
  catch {
    return await fetchProxyHotTopics()
  }
}
