import { Buffer } from 'node:buffer'
import process from 'node:process'

interface EncryptedValue {
  ciphertext: string
  iv: string
  tag: string
}

// 所有用户的机器人凭证共用同一把服务端密钥；缺失或长度不正确时立即失败，避免意外以明文降级。
function getEncryptionKey() {
  const encoded = process.env.NOTIFICATION_ENCRYPTION_KEY_BASE64?.trim()
  if (!encoded)
    throw new Error('NOTIFICATION_ENCRYPTION_KEY_BASE64 is required')
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32)
    throw new Error('NOTIFICATION_ENCRYPTION_KEY_BASE64 must encode 32 bytes')
  return key
}

export async function encryptNotificationConfig(value: unknown): Promise<EncryptedValue> {
  // AES-GCM 每次加密都必须使用新的随机 IV，同一份 Webhook 重复保存也不会产生相同密文。
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', getEncryptionKey(), 'AES-GCM', false, ['encrypt'])
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value))))
  // Web Crypto 会把认证标签附在密文末尾；拆开保存便于 Prisma 字段建模，解密时再拼回。
  const tag = encrypted.slice(-16)
  return { ciphertext: Buffer.from(encrypted.slice(0, -16)).toString('base64'), iv: Buffer.from(iv).toString('base64'), tag: Buffer.from(tag).toString('base64') }
}

export async function decryptNotificationConfig<T>(value: EncryptedValue): Promise<T> {
  const iv = Buffer.from(value.iv, 'base64')
  // AES-GCM 解密必须同时验证认证标签，密文或标签被篡改会直接抛错。
  const ciphertext = Buffer.concat([Buffer.from(value.ciphertext, 'base64'), Buffer.from(value.tag, 'base64')])
  const key = await crypto.subtle.importKey('raw', getEncryptionKey(), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plain)) as T
}
