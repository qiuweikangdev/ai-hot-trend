import process from 'node:process'

const AUTH_BASE_URL_FALLBACK = 'http://localhost:3000'
const AUTH_SECRET_FALLBACK = 'dev-only-better-auth-secret-change-me-32chars'
const LOCAL_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

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

function toOrigin(value: string) {
  try {
    return new URL(value).origin
  }
  catch {
    return ''
  }
}

const baseURL = readRequiredEnv('BETTER_AUTH_URL', AUTH_BASE_URL_FALLBACK)
const appURL = readEnv('NEXT_PUBLIC_APP_URL') || baseURL

const envTrustedOrigins = readEnv('BETTER_AUTH_TRUSTED_ORIGINS')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const trustedOrigins = [...new Set([
  ...envTrustedOrigins,
  toOrigin(baseURL),
  toOrigin(appURL),
  ...LOCAL_TRUSTED_ORIGINS,
].filter(Boolean))]

export const authEnv = {
  baseURL,
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
