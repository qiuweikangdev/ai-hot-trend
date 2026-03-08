import { authClient } from '@/lib/auth-client'

type SocialProvider = 'google' | 'github'

async function signInWithSocial(provider: SocialProvider, callbackURL = '/') {
  return authClient.signIn.social({
    provider,
    callbackURL,
  })
}

export async function signInWithGoogle(callbackURL = '/') {
  return signInWithSocial('google', callbackURL)
}

export async function signInWithGithub(callbackURL = '/') {
  return signInWithSocial('github', callbackURL)
}
