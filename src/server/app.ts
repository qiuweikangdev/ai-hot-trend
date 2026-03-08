import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { registerAuthRoutes } from '@/server/routes/auth'
import userRoute from '@/server/routes/user'

const app = new Hono().basePath('/api')

app.use('*', logger())

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Hono API is running',
  })
})

registerAuthRoutes(app)
app.route('/user', userRoute)

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'API route not found',
      path: c.req.path,
    },
    404,
  )
})

app.onError((error, c) => {
  console.error(error)

  return c.json(
    {
      success: false,
      message: 'Internal server error',
    },
    500,
  )
})

export default app
