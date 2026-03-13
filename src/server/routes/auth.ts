import type { Hono } from 'hono'
import { getAuth } from '@/server/auth'

const AUTH_METHODS = ['GET', 'POST']

export function registerAuthRoutes(app: Hono) {
  app.on(AUTH_METHODS, '/auth', (c) => {
    return getAuth().handler(c.req.raw)
  })

  app.on(AUTH_METHODS, '/auth/*', (c) => {
    return getAuth().handler(c.req.raw)
  })
}
