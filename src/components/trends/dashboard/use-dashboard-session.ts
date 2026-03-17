'use client'

import type { AuthSessionSnapshot } from '@/lib/auth-session'
import { authClient } from '@/lib/auth-client'

export function useDashboardSession(initialSession: AuthSessionSnapshot | null) {
  const clientSession = authClient.useSession()

  const session = {
    ...clientSession,
    data: clientSession.data ?? (clientSession.isPending ? initialSession : null),
    isPending: clientSession.isPending && !initialSession,
  }
  const sessionUser = session.data?.user ?? null

  return {
    clientSession,
    session,
    sessionUser,
    sessionUserId: sessionUser?.id ?? '',
  }
}
