import type { AuthSessionSnapshot } from '@/lib/auth-session'
import { headers } from 'next/headers'
import { cache } from 'react'
import { getAuth } from '@/server/auth'
import 'server-only'

interface BetterAuthSessionPayload {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export const getServerSessionSnapshot = cache(async (): Promise<AuthSessionSnapshot> => {
  const requestHeaders = await headers()
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: {
      disableRefresh: true,
    },
  }) as BetterAuthSessionPayload | null

  if (!session?.user?.id) {
    return {
      user: null,
    }
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  }
})
