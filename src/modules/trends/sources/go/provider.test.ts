import type { GithubRepoSearchItem } from '@/modules/trends/sources/github/types'
import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { bootstrapTrendProviders } from '@/modules/trends/providers'
import { parseTrendRequestQuery } from '@/modules/trends/query'
import { getTrendProvider } from '@/modules/trends/registry'

test('registered Go source queries GitHub with Go language, filters and pagination', async () => {
  bootstrapTrendProviders()
  const provider = getTrendProvider('go')
  assert.ok(provider)

  const originalFetch = globalThis.fetch
  const requests: URL[] = []
  const repository: GithubRepoSearchItem = {
    id: 42,
    name: 'demo',
    full_name: 'acme/demo',
    description: 'A Go\nproject',
    html_url: 'https://github.com/acme/demo',
    language: null,
    stargazers_count: 100,
    forks_count: 10,
    created_at: '2026-10-09T00:00:00.000Z',
    updated_at: '2026-10-09T00:00:00.000Z',
    owner: { login: 'acme', avatar_url: 'https://github.com/acme.png' },
  }

  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)))
    return new Response(JSON.stringify({ items: [repository] }), { status: 200 })
  }

  try {
    for (const [period, since] of [['today', '2026-10-08'], ['week', '2026-10-02'], ['month', '2026-09-09']]) {
      const query = parseTrendRequestQuery({
        source: 'go',
        period,
        language: 'Python',
        keyword: ' server ',
        limit: '18',
        offset: '18',
      })
      const items = await provider.fetchTrends(query, { now: new Date('2026-10-09T00:00:00.000Z') })
      const url = requests.at(-1)!

      assert.equal(url.origin + url.pathname, 'https://api.github.com/search/repositories')
      assert.equal(url.searchParams.get('q'), `created:>=${since} archived:false is:public language:Go server in:name,description`)
      assert.equal(url.searchParams.get('sort'), 'stars')
      assert.equal(url.searchParams.get('order'), 'desc')
      assert.equal(url.searchParams.get('per_page'), '18')
      assert.equal(url.searchParams.get('page'), '2')
      assert.equal(items[0].id, 'go:42')
      assert.equal(items[0].source, 'go')
      assert.equal(items[0].language, 'Go')
      assert.equal(items[0].description, 'A Go project')
      assert.equal(items[0].url, repository.html_url)
      assert.equal(items[0].hotScore, 106)
    }
  }
  finally {
    globalThis.fetch = originalFetch
  }
})
