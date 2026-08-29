import type { TrendItem } from '@/modules/trends/types'
import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { formatTrendCopyContent, getTrendCopyUrl } from '@/modules/trends/presenters'

function createTrendItem(overrides: Partial<TrendItem> = {}): TrendItem {
  return {
    id: 'ai:demo',
    source: 'ai',
    rank: 1,
    title: 'Demo',
    fullName: 'acme/demo',
    owner: 'acme',
    description: 'A demo project',
    url: 'https://bestofjs.org/projects/demo',
    ownerAvatarUrl: '',
    language: 'AI',
    stars: 10,
    forks: 2,
    hotScore: 12,
    createdAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z',
    ...overrides,
  }
}

test('prefers an existing GitHub URL when copying a trend', () => {
  const item = createTrendItem({ url: 'https://github.com/acme/actual-demo' })

  assert.equal(getTrendCopyUrl(item), 'https://github.com/acme/actual-demo')
})

test('builds a GitHub URL from repository metadata before using the source URL', () => {
  const item = createTrendItem()

  assert.equal(getTrendCopyUrl(item), 'https://github.com/acme/demo')
})

test('formats copied trend content in a stable aligned order', () => {
  const item = createTrendItem({
    title: '  Demo\nProject ',
    description: ' A description\nwith line breaks ',
    source: 'zhihu',
    fullName: '123',
    url: 'https://www.zhihu.com/question/123',
  })

  assert.equal(
    formatTrendCopyContent(item),
    '热点标题：Demo Project\n热点描述：A description with line breaks\n所在链接：https://www.zhihu.com/question/123',
  )
})
