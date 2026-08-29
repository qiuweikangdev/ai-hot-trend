import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { sendFeishuText } from '@/modules/notifications/providers/feishu'

const FEISHU_CONFIG = { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test' }
const FEISHU_ERROR_PATTERN = /19021: sign match fail/

test('accepts the StatusCode response returned by Feishu custom bots', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ StatusCode: 0, StatusMessage: 'success' }), { status: 200 })

  try {
    await assert.doesNotReject(() => sendFeishuText(FEISHU_CONFIG, 'diagnostic'))
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('includes Feishu rejection details in the provider error', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 19021, msg: 'sign match fail' }), { status: 200 })

  try {
    await assert.rejects(() => sendFeishuText(FEISHU_CONFIG, 'diagnostic'), FEISHU_ERROR_PATTERN)
  }
  finally {
    globalThis.fetch = originalFetch
  }
})
