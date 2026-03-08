import { handle } from 'hono/vercel'
import app from '@/server/app'

const handler = handle(app)

export const runtime = 'nodejs'

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler
