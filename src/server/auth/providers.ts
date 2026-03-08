import { authEnv, enabledProviderMap } from '@/server/auth/env'

export const socialProviders = {
  ...(enabledProviderMap.github
    ? {
        github: {
          clientId: authEnv.githubClientId,
          clientSecret: authEnv.githubClientSecret,
        },
      }
    : {}),
  ...(enabledProviderMap.google
    ? {
        google: {
          clientId: authEnv.googleClientId,
          clientSecret: authEnv.googleClientSecret,
        },
      }
    : {}),
}
