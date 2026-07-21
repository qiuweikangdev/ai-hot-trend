import { Buffer } from 'node:buffer'
import process from 'node:process'

interface EncryptedValue {
  ciphertext: string
  iv: string
  tag: string
}

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
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', getEncryptionKey(), 'AES-GCM', false, ['encrypt'])
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value))))
  const tag = encrypted.slice(-16)
  return { ciphertext: Buffer.from(encrypted.slice(0, -16)).toString('base64'), iv: Buffer.from(iv).toString('base64'), tag: Buffer.from(tag).toString('base64') }
}

export async function decryptNotificationConfig<T>(value: EncryptedValue): Promise<T> {
  const iv = Buffer.from(value.iv, 'base64')
  const ciphertext = Buffer.concat([Buffer.from(value.ciphertext, 'base64'), Buffer.from(value.tag, 'base64')])
  const key = await crypto.subtle.importKey('raw', getEncryptionKey(), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plain)) as T
}
