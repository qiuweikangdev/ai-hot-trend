import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import { Hono } from 'hono'
import { dispatchDueNotifications } from '@/modules/notifications/dispatcher'

const internalNotificationsRoute = new Hono()

function isAuthorized(value: string) {
  const expected = process.env.NOTIFICATION_DISPATCH_TOKEN?.trim() || process.env.CRON_SECRET?.trim()
  if (!expected || !value.startsWith('Bearer '))
    return false
  const supplied = value.slice(7).trim()
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

internalNotificationsRoute.post('/dispatch/:provider?', async (c) => {
  if (!isAuthorized(c.req.header('authorization') || ''))
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  const provider = c.req.param('provider') || c.req.header('x-notification-scheduler')
  if (provider !== 'vercel' && provider !== 'cloudflare')
    return c.json({ success: false, message: 'Invalid scheduler' }, 400)
  try {
    const data = await dispatchDueNotifications(provider)
    return c.json({ success: true, data })
  }
  catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : 'Dispatch failed' }, 500)
  }
})

export default internalNotificationsRoute
