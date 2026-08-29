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
