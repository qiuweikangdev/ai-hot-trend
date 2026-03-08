'use client'

import { AlertCircle, CheckCircle2, Github, Loader2, LogOut } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { signInWithGithub, signInWithGoogle } from '@/lib/auth-social'

type SocialProvider = 'google' | 'github'

type ProviderStatus = Record<SocialProvider, boolean>

const DEFAULT_PROVIDER_STATUS: ProviderStatus = {
  google: false,
  github: false,
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path fill="#EA4335" d="M12 10.2v4.08h5.67c-.25 1.33-1.01 2.46-2.15 3.23l3.47 2.69c2.03-1.87 3.2-4.62 3.2-7.9 0-.76-.07-1.5-.2-2.2z" />
      <path fill="#34A853" d="M12 22c2.9 0 5.34-.96 7.11-2.6l-3.47-2.69c-.96.65-2.2 1.03-3.64 1.03-2.8 0-5.18-1.89-6.03-4.42H2.39v2.78A10.74 10.74 0 0 0 12 22" />
      <path fill="#4A90E2" d="M5.97 13.32A6.44 6.44 0 0 1 5.63 11c0-.81.14-1.6.34-2.32V5.9H2.39A10.74 10.74 0 0 0 1.27 11c0 1.73.41 3.37 1.12 4.9z" />
      <path fill="#FBBC05" d="M12 4.26c1.58 0 2.98.54 4.1 1.6l3.07-3.07C17.33 1.1 14.9 0 12 0A10.74 10.74 0 0 0 2.39 5.9l3.58 2.78c.85-2.53 3.23-4.42 6.03-4.42" />
    </svg>
  )
}

function getDisplayName(user: { name?: string | null, email?: string | null }) {
  return user.name || user.email || '用户'
}

function getInitial(value: string) {
  return value.slice(0, 1).toUpperCase()
}

export function LoginPanel() {
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')

  const session = authClient.useSession()

  const [providers, setProviders] = useState<ProviderStatus>(DEFAULT_PROVIDER_STATUS)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const displayErrorMessage = errorMessage || (oauthError ? `登录失败：${oauthError}` : '')

  useEffect(() => {
    let isMounted = true

    async function loadProviders() {
      if (session.data?.user) {
        setIsLoadingProviders(false)
        return
      }

      try {
        const response = await fetch('/api/user/providers', {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }

        const json = await response.json() as {
          data?: Partial<ProviderStatus>
        }

        if (!isMounted) {
          return
        }

        setProviders({
          google: Boolean(json.data?.google),
          github: Boolean(json.data?.github),
        })
      }
      catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('无法获取登录渠道状态，请稍后再试。')
      }
      finally {
        if (isMounted) {
          setIsLoadingProviders(false)
        }
      }
    }

    loadProviders()

    return () => {
      isMounted = false
    }
  }, [session.data?.user])

  async function handleSocialLogin(provider: SocialProvider) {
    if (!providers[provider]) {
      setErrorMessage('当前渠道未配置，请联系管理员补充 OAuth 参数。')
      return
    }

    setErrorMessage('')
    setPendingProvider(provider)

    try {
      if (provider === 'google') {
        await signInWithGoogle('/')
      }
      else {
        await signInWithGithub('/')
      }
    }
    catch (error) {
      const fallback = '登录失败，请稍后重试。'
      setErrorMessage(error instanceof Error ? error.message : fallback)
      setPendingProvider(null)
    }
  }

  async function handleSignOut() {
    setErrorMessage('')

    try {
      await authClient.signOut()
      await session.refetch()
    }
    catch {
      setErrorMessage('退出登录失败，请稍后重试。')
    }
  }

  if (session.isPending) {
    return (
      <Card className="border-white/60 bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl">登录中</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在检查会话
          </div>
        </CardContent>
      </Card>
    )
  }

  if (session.data?.user) {
    const displayName = getDisplayName(session.data.user)
    const initial = getInitial(displayName)

    return (
      <Card className="border-emerald-200/80 bg-white/95 shadow-xl shadow-emerald-900/10 backdrop-blur-md">
        <CardHeader className="gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            登录成功
          </div>
          <CardTitle className="text-2xl">
            欢迎回来，
            {displayName}
          </CardTitle>
          <CardDescription>当前账号已登录。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <div
              className="flex size-11 items-center justify-center rounded-full bg-primary/10 bg-cover bg-center text-sm font-semibold text-primary"
              style={session.data.user.image
                ? { backgroundImage: `url(${session.data.user.image})` }
                : undefined}
            >
              {session.data.user.image ? null : initial}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{session.data.user.email || '未提供邮箱'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="size-4" />
            退出登录
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-white/60 bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-md">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>选择一个社交账号继续</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          type="button"
          className="h-11 w-full justify-start rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800"
          onClick={() => handleSocialLogin('github')}
          disabled={isLoadingProviders || !providers.github || pendingProvider !== null}
        >
          {pendingProvider === 'github'
            ? (
                <Loader2 className="size-4 animate-spin" />
              )
            : (
                <Github className="size-4" />
              )}
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-start rounded-lg border-slate-200 bg-white px-4"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoadingProviders || !providers.google || pendingProvider !== null}
        >
          {pendingProvider === 'google'
            ? (
                <Loader2 className="size-4 animate-spin" />
              )
            : (
                <GoogleIcon />
              )}
          Google
        </Button>

        {displayErrorMessage
          ? (
              <p className="flex items-start gap-2 text-sm text-rose-600">
                <AlertCircle className="mt-0.5 size-4" />
                {displayErrorMessage}
              </p>
            )
          : null}
      </CardContent>
    </Card>
  )
}
