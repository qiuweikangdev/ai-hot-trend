import { Buffer } from 'node:buffer'
import { Hono } from 'hono'
import { prisma } from '@/lib/prisma'
import { auth } from '@/server/auth'
import { authEnv, enabledProviderMap } from '@/server/auth/env'

const userRoute = new Hono()

interface SessionUser {
  id?: string
}

interface SessionData {
  userId?: string
}

interface SessionPayload {
  user?: SessionUser
  session?: SessionData
}

function getSessionUserId(session: unknown) {
  const payload = session as SessionPayload | null
  return payload?.user?.id || payload?.session?.userId || null
}

async function revokeGithubGrantByUserId(userId: string) {
  if (!authEnv.githubClientId || !authEnv.githubClientSecret) {
    return { revoked: false, reason: 'github_not_configured' }
  }

  const githubAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'github',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (!githubAccount?.accessToken) {
    return { revoked: false, reason: 'github_account_not_found' }
  }

  const basicAuthToken = Buffer
    .from(`${authEnv.githubClientId}:${authEnv.githubClientSecret}`)
    .toString('base64')

  const response = await fetch(
    `https://api.github.com/applications/${authEnv.githubClientId}/grant`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${basicAuthToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'ai-hot-trend',
      },
      body: JSON.stringify({
        access_token: githubAccount.accessToken,
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok && response.status !== 404 && response.status !== 422) {
    const text = await response.text()
    throw new Error(`撤销 GitHub 授权失败: ${response.status} ${text}`)
  }

  return {
    revoked: true,
  }
}

userRoute.get('/', (c) => {
  return c.json({
    success: true,
    message: 'user route ready',
    timestamp: new Date().toISOString(),
  })
})

userRoute.get('/providers', (c) => {
  return c.json({
    success: true,
    data: enabledProviderMap,
  })
})

userRoute.get('/session', async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  const userId = getSessionUserId(session)

  if (!userId) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  return c.json({
    success: true,
    data: session,
  })
})

userRoute.post('/revoke-github', async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
    query: {
      disableRefresh: true,
    },
  })

  const userId = getSessionUserId(session)

  if (!userId) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      401,
    )
  }

  try {
    const data = await revokeGithubGrantByUserId(userId)

    return c.json({
      success: true,
      data,
    })
  }
  catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'GitHub 授权撤销失败',
      },
      502,
    )
  }
})

export default userRoute
