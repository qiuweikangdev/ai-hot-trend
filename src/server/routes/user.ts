import { Hono } from 'hono'
import { auth } from '@/server/auth'
import { enabledProviderMap } from '@/server/auth/env'

const userRoute = new Hono()

userRoute.get('/', (c) => {
  return c.json({
    success: true,
    message: 'user route ready',
    timestamp: new Date().toISOString(),
  })
})

userRoute.get('/providers', (c) => {
  return c.json({
    success: true,
    data: enabledProviderMap,
  })
})

userRoute.get('/session', async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  return c.json({
    success: true,
    data: session,
  })
})

export default userRoute
