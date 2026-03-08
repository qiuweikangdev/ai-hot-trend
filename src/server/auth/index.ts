import { betterAuth } from 'better-auth'
import { authEnv } from '@/server/auth/env'
import { socialProviders } from '@/server/auth/providers'

export const auth = betterAuth({
  baseURL: authEnv.baseURL,
  secret: authEnv.secret,
  socialProviders,
  trustedOrigins: authEnv.trustedOrigins,
})
