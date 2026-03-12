import { authEnv, enabledProviderMap } from '@/server/auth/env'

export const socialProviders = {
  ...(enabledProviderMap.github
    ? {
        github: {
          clientId: authEnv.githubClientId,
          clientSecret: authEnv.githubClientSecret,
          redirectURI: authEnv.githubRedirectURI,
          prompt: 'select_account' as const,
        },
      }
    : {}),
  ...(enabledProviderMap.google
    ? {
        google: {
          clientId: authEnv.googleClientId,
          clientSecret: authEnv.googleClientSecret,
          redirectURI: authEnv.googleRedirectURI,
        },
      }
    : {}),
}
