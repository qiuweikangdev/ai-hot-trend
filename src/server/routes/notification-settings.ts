import type { Context } from 'hono'
import { Hono } from 'hono'
import { deleteFeishuSettings, deleteQqEmailSettings, getNotificationCapabilities, getNotificationSettings, saveFeishuSettings, saveQqEmailSettings, testFeishuSettings, testQqEmailSettings } from '@/modules/notifications/service'
import { getAuth } from '@/server/auth'

const notificationSettingsRoute = new Hono()

interface SessionPayload { user?: { id?: string }, session?: { userId?: string } }

async function getSessionUserId(headers: Headers) {
  const session = await getAuth().api.getSession({ headers, query: { disableRefresh: true } }) as SessionPayload | null
  return session?.user?.id || session?.session?.userId || null
}

async function requireUser(c: Context) {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId)
    return null
  return userId
}

notificationSettingsRoute.get('/capabilities', c => c.json({ success: true, data: getNotificationCapabilities() }))
notificationSettingsRoute.get('/', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  return c.json({ success: true, data: await getNotificationSettings(userId) })
})
notificationSettingsRoute.put('/feishu', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  try {
    const data = await saveFeishuSettings(userId, await c.req.json())
    return c.json({ success: true, data })
  }
  catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : 'Invalid settings' }, 400)
  }
})
notificationSettingsRoute.put('/email', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  try {
    const data = await saveQqEmailSettings(userId, await c.req.json())
    return c.json({ success: true, data })
  }
  catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : 'Invalid settings' }, 400)
  }
})
notificationSettingsRoute.post('/feishu/test', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  try {
    const data = await testFeishuSettings(userId, await c.req.json())
    return c.json({ success: true, data })
  }
  catch {
    return c.json({ success: false, message: 'Feishu test failed' }, 502)
  }
})
notificationSettingsRoute.post('/email/test', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  try {
    const data = await testQqEmailSettings(userId, await c.req.json())
    return c.json({ success: true, data })
  }
  catch {
    return c.json({ success: false, message: 'QQ邮箱测试失败，请检查邮箱地址和授权码。' }, 502)
  }
})
notificationSettingsRoute.delete('/feishu', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  await deleteFeishuSettings(userId)
  return c.json({ success: true })
})
notificationSettingsRoute.delete('/email', async (c) => {
  const userId = await requireUser(c)
  if (!userId)
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  await deleteQqEmailSettings(userId)
  return c.json({ success: true })
})

export default notificationSettingsRoute
