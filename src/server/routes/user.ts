import { Hono } from 'hono'

const userRoute = new Hono()

userRoute.get('/', (c) => {
  return c.json({
    success: true,
    message: 'user route ready',
    timestamp: new Date().toISOString(),
  })
})

export default userRoute
