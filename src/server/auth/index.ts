import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { getPrisma } from '@/lib/prisma'
import { getAuthEnv } from '@/server/auth/env'
import { getSocialProviders } from '@/server/auth/providers'

function createAuth() {
  const authEnv = getAuthEnv()

  return betterAuth({
    baseURL: authEnv.baseURL,
    database: prismaAdapter(getPrisma(), {
      provider: 'mysql',
    }),
    secret: authEnv.secret,
    socialProviders: getSocialProviders(),
    trustedOrigins: authEnv.trustedOrigins,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24,
      },
    },
    advanced: {
      cookies: {
        state: {
          attributes: {
            sameSite: 'Lax',
          },
        },
      },
    },
  })
}

let authInstance: ReturnType<typeof createAuth> | undefined

export function getAuth() {
  if (authInstance) {
    return authInstance
  }

  authInstance = createAuth()

  return authInstance
}
