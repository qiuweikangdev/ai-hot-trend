import type { Context } from 'hono'
import process from 'node:process'
import { Hono } from 'hono'
import { pushDailyTrendDigestToFeishu } from '@/server/notify/feishu'

const notifyRoute = new Hono()

function readRequestToken(c: Context) {
  const authHeader = c.req.header('authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''

  return bearer || c.req.header('x-cron-token') || ''
}

function verifyCronToken(c: Context, expectedToken: string) {
  if (!expectedToken) {
    return true
  }

  const requestToken = readRequestToken(c)
  return requestToken === expectedToken
}

function readCronTokenFromEnv() {
  return process.env.FEISHU_PUSH_CRON_TOKEN?.trim()
    || process.env.CRON_SECRET?.trim()
    || ''
}

async function handlePush(c: Context) {
  try {
    const expectedToken = readCronTokenFromEnv()

    if (!verifyCronToken(c, expectedToken)) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        401,
      )
    }

    const data = await pushDailyTrendDigestToFeishu()

    return c.json({
      success: true,
      data,
    })
  }
  catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Feishu push failed',
      },
      502,
    )
  }
}

notifyRoute.get('/feishu/daily', handlePush)
notifyRoute.post('/feishu/daily', handlePush)

export default notifyRoute
