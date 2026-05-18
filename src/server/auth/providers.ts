import type { GithubProfile, GoogleProfile } from 'better-auth/social-providers'
import { getAuthEnv, getEnabledProviderMap } from '@/server/auth/env'

function normalizeUsername(value: string | null | undefined) {
  const username = value?.trim()

  if (!username) {
    return undefined
  }

  return username
}

function getEmailPrefix(email: string | null | undefined) {
  if (!email) {
    return undefined
  }

  const [prefix] = email.split('@')

  return normalizeUsername(prefix)
}

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
            overrideUserInfoOnSignIn: true,
            mapProfileToUser(profile: GithubProfile) {
              return {
                username: normalizeUsername(profile.login) ?? normalizeUsername(profile.name) ?? getEmailPrefix(profile.email),
              }
            },
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
            overrideUserInfoOnSignIn: true,
            mapProfileToUser(profile: GoogleProfile) {
              return {
                username: getEmailPrefix(profile.email) ?? normalizeUsername(profile.name),
              }
            },
            // prompt: 'consent' as const, // 每次重新授权
          },
        }
      : {}),
  }
}
