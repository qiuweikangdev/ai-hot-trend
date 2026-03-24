import type { WeiboHotTopic } from '@/modules/trends/sources/weibo/types'
import type { TrendItem } from '@/modules/trends/types'

const WEIBO_AVATAR = 'https://weibo.com/favicon.ico'

function normalizeKeyword(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '微博热搜'
  }

  return trimmed
}

function createTopicId(keyword: string) {
  return `weibo:${encodeURIComponent(keyword.toLowerCase())}`
}

export function mapWeiboTopicToTrendItem(topic: WeiboHotTopic, index: number): TrendItem {
  const now = new Date().toISOString()
  const rank = index + 1
  const keyword = normalizeKeyword(topic.keyword || topic.title)
  const hotValue = Math.max(10, 220 - rank * 6)

  return {
    id: createTopicId(keyword),
    source: 'weibo',
    rank,
    title: topic.title || keyword,
    fullName: keyword,
    owner: '微博热搜',
    description: `微博实时热点第 ${rank} 位`,
    url: topic.url,
    ownerAvatarUrl: WEIBO_AVATAR,
    language: null,
    stars: hotValue,
    forks: 0,
    hotScore: hotValue * 100,
    createdAt: now,
    updatedAt: now,
  }
}
