import process from 'node:process'

const AUTH_BASE_URL_FALLBACK = 'http://localhost:3000'
const AUTH_SECRET_FALLBACK = 'dev-only-better-auth-secret-change-me-32chars'

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ''
}

function readRequiredEnv(name: string, fallback: string) {
  const value = readEnv(name)

  if (value) {
    return value
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[better-auth] Missing environment variable: ${name}`)
  }

  return fallback
}

const trustedOrigins = readEnv('BETTER_AUTH_TRUSTED_ORIGINS')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

export const authEnv = {
  baseURL: readRequiredEnv('BETTER_AUTH_URL', AUTH_BASE_URL_FALLBACK),
  secret: readRequiredEnv('BETTER_AUTH_SECRET', AUTH_SECRET_FALLBACK),
  githubClientId: readEnv('GITHUB_CLIENT_ID'),
  githubClientSecret: readEnv('GITHUB_CLIENT_SECRET'),
  googleClientId: readEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: readEnv('GOOGLE_CLIENT_SECRET'),
  trustedOrigins,
}

export const enabledProviderMap = {
  github: Boolean(authEnv.githubClientId && authEnv.githubClientSecret),
  google: Boolean(authEnv.googleClientId && authEnv.googleClientSecret),
}
