/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSubscriptionInput } from '@/modules/notifications/subscription'

const INVALID_SUBSCRIPTION = /Invalid notification subscription/

test('normalizes selected trend sources and digest preferences', () => {
  assert.deepEqual(
    parseSubscriptionInput({
      sources: ['ai', 'github', 'ai'],
      period: 'today',
      limit: 5,
      scheduledMinute: 540,
    }),
    {
      sources: ['ai', 'github'],
      period: 'today',
      limit: 5,
      scheduledMinute: 540,
    },
  )
})

test('rejects invalid subscription input', () => {
  assert.throws(
    () => parseSubscriptionInput({
      sources: [],
      period: 'year',
      limit: 11,
      scheduledMinute: 542,
    }),
    INVALID_SUBSCRIPTION,
  )
})
