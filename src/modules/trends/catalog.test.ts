import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { TREND_SOURCE_OPTIONS } from '@/modules/trends/catalog'

test('orders enabled trend sources for navigation', () => {
  assert.deepEqual(
    TREND_SOURCE_OPTIONS
      .filter(option => option.enabled)
      .map(option => option.label),
    ['AI', 'Python', 'Go', 'Github', 'Node', 'React', 'Vue', 'npm', '组件库', 'V2EX', '知乎', '掘金', '微博'],
  )
})
