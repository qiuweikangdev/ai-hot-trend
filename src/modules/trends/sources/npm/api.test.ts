import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { searchNpmTrendingPackages } from '@/modules/trends/sources/npm/api'

function buildSearchObject(name: string, date: string) {
  return {
    package: {
      name,
      version: '1.0.0',
      date,
    },
    score: {
      final: 1,
      detail: {
        quality: 1,
        popularity: 1,
        maintenance: 1,
      },
    },
  }
}

test('fills npm results from subsequent search pages after activity filtering', async () => {
  const originalFetch = globalThis.fetch
  const recentDate = new Date().toISOString()
  const calls: number[] = []

  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    const from = Number(url.searchParams.get('from'))
    calls.push(from)

    const recentPackage = buildSearchObject(`recent-${from}`, recentDate)
    const objects = Array.from({ length: 120 }, (_, index) => (
      index === 0 ? recentPackage : buildSearchObject(`stale-${from}-${index}`, '2020-01-01T00:00:00.000Z')
    ))

    return new Response(JSON.stringify({ objects }), { status: 200 })
  }

  try {
    const result = await searchNpmTrendingPackages({
      source: 'npm',
      period: 'today',
      language: undefined,
      keyword: undefined,
      limit: 3,
      offset: 0,
    })

    assert.equal(result.objects.length, 3)
    assert.deepEqual(calls, [0, 120, 240])
    assert.deepEqual(result.objects.map(item => item.package.name), ['recent-0', 'recent-120', 'recent-240'])
  }
  finally {
    globalThis.fetch = originalFetch
  }
})
