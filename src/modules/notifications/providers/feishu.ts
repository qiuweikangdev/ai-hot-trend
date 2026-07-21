import { createHmac } from 'node:crypto'

export interface FeishuConfig { webhookUrl: string, secret?: string }

export function parseFeishuConfig(value: unknown): FeishuConfig {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid Feishu configuration')
  const input = value as Record<string, unknown>
  if (typeof input.webhookUrl !== 'string')
    throw new Error('Invalid Feishu configuration')
  const url = new URL(input.webhookUrl.trim())
  if (url.protocol !== 'https:' || url.hostname !== 'open.feishu.cn' || !url.pathname.startsWith('/open-apis/bot/v2/hook/'))
    throw new Error('Invalid Feishu webhook URL')
  if (input.secret !== undefined && typeof input.secret !== 'string')
    throw new Error('Invalid Feishu configuration')
  return { webhookUrl: url.toString(), secret: typeof input.secret === 'string' ? input.secret.trim() || undefined : undefined }
}

export function getFeishuPublicSummary(config: FeishuConfig) {
  const token = config.webhookUrl.split('/').pop() || ''
  return { label: 'Feishu robot', maskedTarget: `open.feishu.cn/.../${token.slice(0, 4)}****` }
}

export async function sendFeishuText(config: FeishuConfig, text: string) {
  const payload: { msg_type: 'text', content: { text: string }, timestamp?: string, sign?: string } = { msg_type: 'text', content: { text } }
  if (config.secret) {
    payload.timestamp = String(Math.floor(Date.now() / 1000))
    payload.sign = createHmac('sha256', `${payload.timestamp}\n${config.secret}`).digest('base64')
  }
  const response = await fetch(config.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
  const result = await response.json().catch(() => null) as { code?: number } | null
  if (!response.ok || result?.code !== 0)
    throw new Error('Feishu robot rejected the request')
}
