import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'
import { authEnv } from '@/server/auth/env'
import { socialProviders } from '@/server/auth/providers'

export const auth = betterAuth({
  baseURL: authEnv.baseURL,
  database: prismaAdapter(prisma, {
    provider: 'mysql',
  }),
  secret: authEnv.secret,
  socialProviders,
  trustedOrigins: authEnv.trustedOrigins,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },
})
