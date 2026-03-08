import type { Hono } from 'hono'
import { auth } from '@/server/auth'

const AUTH_METHODS = ['GET', 'POST']

export function registerAuthRoutes(app: Hono) {
  app.on(AUTH_METHODS, '/auth', (c) => {
    return auth.handler(c.req.raw)
  })

  app.on(AUTH_METHODS, '/auth/*', (c) => {
    return auth.handler(c.req.raw)
  })
}
