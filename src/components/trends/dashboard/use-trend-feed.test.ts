import type { TrendResult } from '@/modules/trends/types'
/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as trendFeedModule from './use-trend-feed'

const NOT_LOADING_PATTERN = /data-loading="false"/
const SERVER_RENDERED_TREND_PATTERN = /Server-rendered trend/

const initialTrendData: TrendResult = {
  source: 'ai',
  period: 'week',
  fetchedAt: '2026-07-30T00:00:00.000Z',
  stale: false,
  items: [
    {
      id: 'server-rendered-trend',
      source: 'ai',
      rank: 1,
      title: 'Server-rendered trend',
      fullName: 'example/server-rendered-trend',
      owner: 'example',
      description: 'Trend data rendered into the initial HTML response.',
      url: 'https://example.com/server-rendered-trend',
      ownerAvatarUrl: '',
      language: 'TypeScript',
      stars: 100,
      forks: 10,
      hotScore: 90,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    },
  ],
}

function TrendFeedProbe() {
  const trendFeed = trendFeedModule.useTrendFeed({
    source: 'ai',
    period: 'week',
    language: '',
    keyword: '',
    limit: 18,
    refreshTick: 0,
    initialTrendData,
  } as Parameters<typeof trendFeedModule.useTrendFeed>[0] & { initialTrendData: TrendResult })

  return createElement(
    'output',
    { 'data-loading': String(trendFeed.isTrendLoading) },
    trendFeed.trendData?.items[0]?.title ?? '',
  )
}

test('keeps server-rendered trend data visible during the initial client render', () => {
  const html = renderToStaticMarkup(createElement(TrendFeedProbe))

  assert.match(html, NOT_LOADING_PATTERN)
  assert.match(html, SERVER_RENDERED_TREND_PATTERN)
})

test('does not request the same trend query again after hydration', () => {
  const shouldRequestTrendFeed = (
    trendFeedModule as unknown as {
      shouldRequestTrendFeed?: (
        currentRequest: {
          source: string
          period: string
          language: string
          keyword: string
          limit: number
          refreshTick: number
        },
        previousRequest: {
          source: string
          period: string
          language: string
          keyword: string
          limit: number
          refreshTick: number
        } | null,
      ) => boolean
    }
  ).shouldRequestTrendFeed

  assert.equal(typeof shouldRequestTrendFeed, 'function')

  const serverRequest = {
    source: 'ai',
    period: 'week',
    language: '',
    keyword: '',
    limit: 18,
    refreshTick: 0,
  }

  assert.equal(shouldRequestTrendFeed?.({ ...serverRequest }, serverRequest), false)
  assert.equal(shouldRequestTrendFeed?.({ ...serverRequest, source: 'github' }, serverRequest), true)
  assert.equal(shouldRequestTrendFeed?.({ ...serverRequest, refreshTick: 1 }, serverRequest), true)
})
