import { Buffer } from 'node:buffer'
import { connect } from 'node:tls'

const QQ_SMTP_HOST = 'smtp.qq.com'
const QQ_SMTP_PORT = 465
const SMTP_TIMEOUT_MS = 15_000
const SMTP_FINAL_RESPONSE_PATTERN = /^\d{3} /
const BASE64_LINE_PATTERN = /.{1,76}/g
const DOT_STUFF_PATTERN = /^\./gm

export interface QqEmailConfig {
  email: string
  recipientEmail: string
  authorizationCode: string
}

interface SmtpResponse {
  code: number
  lines: string[]
}

interface SmtpConnection {
  read: () => Promise<SmtpResponse>
  write: (command: string) => Promise<SmtpResponse>
  writeData: (data: string) => Promise<SmtpResponse>
  close: () => void
}

function isEmail(value: string) {
  if (value.length > 254 || value.includes('..'))
    return false
  const parts = value.split('@')
  if (parts.length !== 2)
    return false
  const [localPart, domain] = parts
  if (!localPart || localPart.length > 64 || !domain)
    return false
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every(label => label.length > 0 && label.length <= 63 && !label.startsWith('-') && !label.endsWith('-'))
}

function getString(input: Record<string, unknown>, key: string) {
  return typeof input[key] === 'string' ? input[key].trim() : ''
}

export function parseQqEmailConfig(value: unknown): QqEmailConfig {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid QQ email configuration')

  const input = value as Record<string, unknown>
  const email = getString(input, 'email')
  const recipientEmail = getString(input, 'recipientEmail')
  const authorizationCode = getString(input, 'authorizationCode')

  if (!isEmail(email) || !isEmail(recipientEmail) || authorizationCode.length < 8 || authorizationCode.length > 256)
    throw new Error('Invalid QQ email configuration')

  return { email, recipientEmail, authorizationCode }
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')
  const visible = localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 2)
  return `${visible}****@${domain}`
}

export function getQqEmailPublicSummary(config: QqEmailConfig) {
  return {
    label: 'QQ邮箱',
    maskedTarget: `${maskEmail(config.email)} → ${maskEmail(config.recipientEmail)}`,
  }
}

function getSmtpError(response: SmtpResponse) {
  const detail = response.lines.at(-1)?.slice(4).trim()
  return detail ? `QQ SMTP rejected the request (${response.code}: ${detail})` : `QQ SMTP rejected the request (${response.code})`
}

function createSmtpConnection(): Promise<SmtpConnection> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: QQ_SMTP_HOST, port: QQ_SMTP_PORT, servername: QQ_SMTP_HOST })
    let buffer = ''
    let responseLines: string[] = []
    const responseQueue: SmtpResponse[] = []
    const responseWaiters: Array<{ resolve: (response: SmtpResponse) => void, reject: (error: Error) => void }> = []
    let connectionError: Error | null = null

    const rejectPending = (error: Error) => {
      connectionError = error
      while (responseWaiters.length > 0)
        responseWaiters.shift()?.reject(error)
    }

    const readResponse = () => {
      if (connectionError)
        return Promise.reject(connectionError)
      const queued = responseQueue.shift()
      if (queued)
        return Promise.resolve(queued)
      return new Promise<SmtpResponse>((responseResolve, responseReject) => {
        responseWaiters.push({ resolve: responseResolve, reject: responseReject })
      })
    }

    const enqueueResponse = (response: SmtpResponse) => {
      const waiter = responseWaiters.shift()
      if (waiter)
        waiter.resolve(response)
      else
        responseQueue.push(response)
    }

    socket.setEncoding('utf8')
    socket.setTimeout(SMTP_TIMEOUT_MS, () => {
      socket.destroy(new Error('QQ SMTP connection timed out'))
    })
    socket.on('data', (chunk: string) => {
      buffer += chunk
      while (true) {
        const lineEnd = buffer.indexOf('\r\n')
        if (lineEnd < 0)
          break
        const line = buffer.slice(0, lineEnd)
        buffer = buffer.slice(lineEnd + 2)
        responseLines.push(line)
        if (SMTP_FINAL_RESPONSE_PATTERN.test(line)) {
          enqueueResponse({ code: Number(line.slice(0, 3)), lines: responseLines })
          responseLines = []
        }
      }
    })
    socket.on('error', (error: Error) => {
      connectionError = error
      if (responseWaiters.length > 0)
        rejectPending(error)
      else
        reject(error)
    })
    socket.once('secureConnect', () => {
      resolve({
        read: readResponse,
        async write(command: string) {
          socket.write(`${command}\r\n`)
          return readResponse()
        },
        async writeData(data: string) {
          socket.write(data)
          return readResponse()
        },
        close() {
          socket.end()
        },
      })
    })
  })
}

function assertResponse(response: SmtpResponse, expectedCodes: number[]) {
  if (!expectedCodes.includes(response.code))
    throw new Error(getSmtpError(response))
}

function encodeBody(text: string) {
  const encoded = Buffer.from(text, 'utf8').toString('base64')
  return encoded.match(BASE64_LINE_PATTERN)?.join('\r\n') || ''
}

function buildMessage(config: QqEmailConfig, subject: string, text: string) {
  const lines = [
    `From: ${config.email}`,
    `To: ${config.recipientEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(text),
  ]
  return `${lines.join('\r\n').replace(DOT_STUFF_PATTERN, '..')}\r\n.\r\n`
}

async function sendSmtpMessage(config: QqEmailConfig, subject: string, text: string) {
  const connection = await createSmtpConnection()
  try {
    assertResponse(await connection.read(), [220])
    assertResponse(await connection.write('EHLO ai-hot-trend'), [250])
    assertResponse(await connection.write('AUTH LOGIN'), [334])
    assertResponse(await connection.write(Buffer.from(config.email).toString('base64')), [334])
    assertResponse(await connection.write(Buffer.from(config.authorizationCode).toString('base64')), [235])
    assertResponse(await connection.write(`MAIL FROM:<${config.email}>`), [250])
    assertResponse(await connection.write(`RCPT TO:<${config.recipientEmail}>`), [250, 251])
    assertResponse(await connection.write('DATA'), [354])
    assertResponse(await connection.writeData(buildMessage(config, subject, text)), [250])
    assertResponse(await connection.write('QUIT'), [221])
  }
  finally {
    connection.close()
  }
}

export async function sendQqEmail(config: QqEmailConfig, text: string, subject = 'AI Hot Trend daily digest') {
  await sendSmtpMessage(config, subject, text)
}
