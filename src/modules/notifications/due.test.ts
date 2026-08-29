import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { getChinaDateKey, getChinaMinuteOfDay, isSubscriptionDue } from '@/modules/notifications/due'

test('converts dates to China calendar values without depending on server timezone', () => {
  const instant = new Date('2026-07-20T01:05:00.000Z')

  assert.equal(getChinaDateKey(instant), '2026-07-20')
  assert.equal(getChinaMinuteOfDay(instant), 545)
})

test('matches the exact five-minute daily slot and supports a fifteen-minute catch-up window', () => {
  const scheduledMinute = 540

  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:00:00.000Z'), scheduledMinute, resolutionMinutes: 5 }), true)
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:15:00.000Z'), scheduledMinute, resolutionMinutes: 5 }), true)
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:20:00.000Z'), scheduledMinute, resolutionMinutes: 5 }), false)
})

test('uses the platform fixed slot for daily Vercel scheduling', () => {
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:00:00.000Z'), scheduledMinute: 540, resolutionMinutes: 1440, fixedDeliveryMinute: 540 }), true)
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:35:00.000Z'), scheduledMinute: 540, resolutionMinutes: 1440, fixedDeliveryMinute: 540 }), true)
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T02:00:00.000Z'), scheduledMinute: 540, resolutionMinutes: 1440, fixedDeliveryMinute: 540 }), false)
  assert.equal(isSubscriptionDue({ now: new Date('2026-07-20T01:00:00.000Z'), scheduledMinute: 545, resolutionMinutes: 1440, fixedDeliveryMinute: 540 }), false)
})
