import type { V2exTopic } from '@/modules/trends/sources/v2ex/types'
import type { TrendItem } from '@/modules/trends/types'

function normalizeDescription(value: string | undefined, fallback: string) {
  const text = value?.trim()

  if (!text) {
    return fallback
  }

  return text.replaceAll('\n', ' ')
}

function normalizeTimestamp(value: number | undefined) {
  if (!value || value <= 0) {
    return new Date().toISOString()
  }

  const date = new Date(value * 1000)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }

  return date.toISOString()
}

const ABSOLUTE_URL_REGEX = /https?:\/\/[^\s)]+/

function normalizeExternalUrl(value: string | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  const matched = trimmed.match(ABSOLUTE_URL_REGEX)?.[0]

  if (!matched) {
    return null
  }

  if (matched.startsWith('http://')) {
    return `https://${matched.slice('http://'.length)}`
  }

  return matched
}

function resolveV2exUrl(value: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  if (value.startsWith('/')) {
    return `https://www.v2ex.com${value}`
  }

  return `https://www.v2ex.com/t/${value}`
}

function resolveV2exAvatar(topic: V2exTopic) {
  const memberAvatar = normalizeExternalUrl(topic.member.avatar_large)

  if (memberAvatar) {
    return memberAvatar
  }

  const nodeAvatar = normalizeExternalUrl(topic.node.avatar_large)

  if (nodeAvatar) {
    return nodeAvatar
  }

  return 'https://www.v2ex.com/static/img/v2ex@2x.png'
}

export function mapV2exTopicToTrendItem(topic: V2exTopic, index: number): TrendItem {
  const replies = Math.max(0, topic.replies || 0)
  const nodeStars = Math.max(0, topic.node.stars || 0)

  return {
    id: `v2ex:${topic.id}`,
    source: 'v2ex',
    rank: index + 1,
    title: topic.title,
    fullName: `#${topic.node.title || topic.node.name}`,
    owner: topic.member.username || 'v2ex',
    description: normalizeDescription(topic.content, topic.title),
    url: resolveV2exUrl(topic.url),
    ownerAvatarUrl: resolveV2exAvatar(topic),
    language: null,
    stars: replies,
    forks: nodeStars,
    hotScore: replies * 20 + nodeStars * 8,
    createdAt: normalizeTimestamp(topic.created),
    updatedAt: normalizeTimestamp(topic.last_modified),
  }
}
