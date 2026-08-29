import assert from 'node:assert/strict'
/* eslint-disable test/no-import-node-test */
import test from 'node:test'
import { getQqEmailPublicSummary, parseQqEmailConfig } from '@/modules/notifications/providers/qq-email'

const INVALID_CONFIG = /Invalid QQ email configuration/

test('parses QQ email credentials and recipient', () => {
  const config = parseQqEmailConfig({
    email: '123456@qq.com',
    recipientEmail: 'alerts@example.com',
    authorizationCode: 'qq-auth-code',
  })

  assert.deepEqual(config, {
    email: '123456@qq.com',
    recipientEmail: 'alerts@example.com',
    authorizationCode: 'qq-auth-code',
  })
  assert.deepEqual(getQqEmailPublicSummary(config), {
    label: 'QQ邮箱',
    maskedTarget: '12****@qq.com → al****@example.com',
    target: '123456@qq.com → alerts@example.com',
  })
})

test('rejects malformed QQ email settings', () => {
  assert.throws(
    () => parseQqEmailConfig({
      email: 'not-an-email',
      recipientEmail: 'alerts@example.com',
      authorizationCode: 'qq-auth-code',
    }),
    INVALID_CONFIG,
  )
  assert.throws(
    () => parseQqEmailConfig({
      email: '123456@qq.com',
      recipientEmail: 'alerts@example.com',
      authorizationCode: 'short',
    }),
    INVALID_CONFIG,
  )
})
