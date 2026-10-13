import type { TrendItem, TrendSource } from '@/modules/trends/types'

const GITHUB_REPOSITORY_SOURCES: ReadonlySet<TrendSource> = new Set([
  'github',
  'python',
  'go',
  'node',
  'react',
  'vue',
  'ai',
  'component',
])
const GITHUB_URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/[^/\s]+\/[^/\s?#]+/i
const GITHUB_REPOSITORY_NAME_PATTERN = /^[^/@\s]+\/[^/\s]+$/
const COPY_WHITESPACE_PATTERN = /\s+/g

function normalizeCopyValue(value: string, fallback: string) {
  const normalizedValue = value.replace(COPY_WHITESPACE_PATTERN, ' ').trim()

  return normalizedValue || fallback
}

export function getTrendCopyUrl(item: Pick<TrendItem, 'source' | 'fullName' | 'url'>) {
  const normalizedUrl = item.url.trim()

  if (GITHUB_URL_PATTERN.test(normalizedUrl)) {
    return normalizedUrl
  }

  if (GITHUB_REPOSITORY_SOURCES.has(item.source)) {
    const repositoryName = item.fullName.trim()

    if (GITHUB_REPOSITORY_NAME_PATTERN.test(repositoryName)) {
      return `https://github.com/${repositoryName}`
    }
  }

  return normalizedUrl
}

export function formatTrendCopyContent(item: TrendItem) {
  return [
    `热点标题：${normalizeCopyValue(item.title, '未命名热点')}`,
    `热点描述：${normalizeCopyValue(item.description, '暂无简介')}`,
    `所在链接：${getTrendCopyUrl(item)}`,
  ].join('\n')
}

export function formatCompactCount(value: number) {
  if (value >= 10000) {
    const displayValue = value / 10000
    const formattedValue = Number.isInteger(displayValue)
      ? displayValue.toFixed(0)
      : displayValue.toFixed(1)

    return `${formattedValue}万`
  }

  return String(value)
}

export function formatTrendDate(value: string) {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
