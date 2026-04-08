import { getAuthEnv, getEnabledProviderMap } from '@/server/auth/env'

export function getSocialProviders() {
  const authEnv = getAuthEnv()
  const enabledProviderMap = getEnabledProviderMap()

  return {
    ...(enabledProviderMap.github
      ? {
          github: {
            clientId: authEnv.githubClientId,
            clientSecret: authEnv.githubClientSecret,
            redirectURI: authEnv.githubRedirectURI,
            // prompt: 'select_account' as const,
          },
        }
      : {}),
    ...(enabledProviderMap.google
      ? {
          google: {
            clientId: authEnv.googleClientId,
            clientSecret: authEnv.googleClientSecret,
            redirectURI: authEnv.googleRedirectURI,
            // prompt: 'consent' as const, // 每次重新授权
          },
        }
      : {}),
  }
}
