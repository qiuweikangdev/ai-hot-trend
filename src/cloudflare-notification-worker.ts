export interface Env {
  APP_BASE_URL: string
  NOTIFICATION_DISPATCH_TOKEN: string
}

interface ScheduledEvent {}

interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void
}

const TRAILING_SLASHES_PATTERN = /\/+$/

export default {
  async fetch(_request: Request) {
    return new Response(JSON.stringify({
      service: 'ai-hot-trend-notification-scheduler',
      status: 'ok',
      message: 'This Worker is only used for scheduled notifications. Open APP_BASE_URL to use the application.',
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const appBaseUrl = env.APP_BASE_URL.replace(TRAILING_SLASHES_PATTERN, '')
    ctx.waitUntil(fetch(`${appBaseUrl}/api/internal/notifications/dispatch/cloudflare`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NOTIFICATION_DISPATCH_TOKEN}`,
      },
    }))
  },
}
