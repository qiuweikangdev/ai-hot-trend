export interface Env {
  APP_BASE_URL: string
  NOTIFICATION_DISPATCH_TOKEN: string
}

interface ScheduledEvent {}

interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(fetch(`${env.APP_BASE_URL}/api/internal/notifications/dispatch/cloudflare`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NOTIFICATION_DISPATCH_TOKEN}`,
      },
    }))
  },
}
