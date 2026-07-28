'use client'

import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { Check, Loader2, Save, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TREND_SOURCE_OPTIONS } from '@/modules/trends/catalog'
import { isTrendSource, TREND_PERIOD_VALUES } from '@/modules/trends/types'

interface SettingsData {
  capabilities: { provider: 'vercel' | 'cloudflare' | 'local', fixedDeliveryMinute?: number }
  channel: null | {
    isEnabled: boolean
    summary: { maskedTarget: string }
    subscription: { sources: TrendSource[], period: TrendPeriod, limit: number, scheduledMinute: number, isEnabled: boolean }
    lastTestMessage: string | null
  }
}

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const CHANNEL_OPTIONS = [
  { value: 'feishu', label: '飞书', enabled: true },
  { value: 'email', label: '邮箱', enabled: false },
] as const

const NOTIFICATION_SOURCE_OPTIONS = TREND_SOURCE_OPTIONS.flatMap(option => (
  option.enabled && isTrendSource(option.value)
    ? [{ value: option.value, label: option.label }]
    : []
))

const SELECT_CLASS_NAME = 'mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30'
const FIELD_LABEL_CLASS_NAME = 'text-xs font-medium'

function formatTime(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [data, setData] = useState<SettingsData | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [sources, setSources] = useState<TrendSource[]>(['ai', 'github'])
  const [period, setPeriod] = useState<TrendPeriod>('today')
  const [limit, setLimit] = useState(5)
  const [scheduledMinute, setScheduledMinute] = useState(540)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState('')
  const timeOptions = useMemo(() => Array.from({ length: 288 }, (_, index) => index * 5), [])

  useEffect(() => {
    if (!isOpen)
      return

    let isCancelled = false
    setIsLoading(true)
    setMessage('')

    void fetch('/api/notification-settings')
      .then(async (response) => {
        if (!response.ok)
          throw new Error('无法读取推送设置')
        return response.json() as Promise<{ data: SettingsData }>
      })
      .then((result) => {
        if (isCancelled)
          return
        setData(result.data)
        const subscription = result.data.channel?.subscription
        if (!subscription)
          return
        setSources(subscription.sources)
        setPeriod(subscription.period)
        setLimit(subscription.limit)
        setScheduledMinute(subscription.scheduledMinute)
        setIsEnabled(subscription.isEnabled)
      })
      .catch((error: unknown) => {
        if (!isCancelled)
          setMessage(error instanceof Error ? error.message : '无法读取推送设置')
      })
      .finally(() => {
        if (!isCancelled)
          setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [isOpen])

  if (!isOpen)
    return null

  const fixedMinute = data?.capabilities.fixedDeliveryMinute
  const deliveryMinute = fixedMinute ?? scheduledMinute
  const hasSavedChannel = Boolean(data?.channel)

  function toggleSource(source: TrendSource) {
    setSources(current => current.includes(source)
      ? current.length > 1 ? current.filter(item => item !== source) : current
      : [...current, source])
  }

  async function saveSettings() {
    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/notification-settings/feishu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          secret,
          isEnabled,
          subscription: { sources, period, limit, scheduledMinute: deliveryMinute },
        }),
      })
      if (!response.ok)
        throw new Error('保存失败，请检查 Webhook 地址和内容选择。')
      setSecret('')
      setMessage('设置已保存')
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败，请稍后重试。')
    }
    finally {
      setIsSaving(false)
    }
  }

  async function sendTest() {
    setIsTesting(true)
    setMessage('')

    try {
      const response = await fetch('/api/notification-settings/feishu/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, secret }),
      })
      if (!response.ok)
        throw new Error('测试消息发送失败，请检查机器人 Webhook。')
      setMessage('测试消息已发送')
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : '测试消息发送失败。')
    }
    finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="notification-settings-title" className="flex max-h-[min(680px,calc(100vh-1.5rem))] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-border bg-card" onClick={event => event.stopPropagation()}>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 sm:px-5">
          <h2 id="notification-settings-title" className="text-sm font-semibold tracking-[-0.01em] text-foreground">推送设置</h2>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground" onClick={onClose} aria-label="关闭推送设置">
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </header>

        <div className="shrink-0 border-b border-border px-4 sm:px-5">
          <div className="flex h-9 items-end gap-5" role="tablist" aria-label="推送渠道">
            {CHANNEL_OPTIONS.map(channel => (
              <button
                key={channel.value}
                type="button"
                role="tab"
                aria-selected={channel.value === 'feishu'}
                disabled={!channel.enabled}
                className={cn(
                  'flex h-9 items-center border-b-2 border-transparent text-xs font-medium text-muted-foreground transition-colors',
                  channel.enabled ? 'hover:text-foreground' : 'cursor-not-allowed opacity-35',
                  channel.value === 'feishu' && 'border-foreground text-foreground',
                )}
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>

        <div className="minimal-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
          {isLoading
            ? (
                <div className="space-y-3 py-5" aria-label="正在加载设置">
                  <div className="h-8 animate-pulse rounded-md bg-muted" />
                  <div className="h-8 animate-pulse rounded-md bg-muted" />
                  <div className="h-20 animate-pulse rounded-md bg-muted" />
                </div>
              )
            : (
                <div>
                  <section className="border-b border-border py-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xs font-semibold text-foreground">连接</h3>
                      {hasSavedChannel
                        ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Check className="size-3" strokeWidth={1.75} />
                              {data?.channel?.summary.maskedTarget}
                            </span>
                          )
                        : null}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                      <div>
                        <Label htmlFor="feishu-webhook" className={FIELD_LABEL_CLASS_NAME}>Webhook</Label>
                        <Input id="feishu-webhook" className="mt-1.5 h-8 bg-background text-xs" value={webhookUrl} onChange={event => setWebhookUrl(event.target.value)} placeholder={hasSavedChannel ? '填写新地址以更新' : 'https://open.feishu.cn/open-apis/bot/v2/hook/...'} />
                      </div>
                      <div>
                        <Label htmlFor="feishu-secret" className={FIELD_LABEL_CLASS_NAME}>
                          签名密钥
                          <span className="font-normal text-muted-foreground">可选</span>
                        </Label>
                        <Input id="feishu-secret" className="mt-1.5 h-8 bg-background text-xs" type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={hasSavedChannel ? '留空保留' : '选填'} />
                      </div>
                    </div>
                  </section>

                  <section className="border-b border-border py-4">
                    <h3 className="text-xs font-semibold text-foreground">来源</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {NOTIFICATION_SOURCE_OPTIONS.map(source => (
                        <button
                          key={source.value}
                          type="button"
                          aria-pressed={sources.includes(source.value)}
                          className={cn(
                            'h-7 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            sources.includes(source.value)
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                          onClick={() => toggleSource(source.value)}
                        >
                          {source.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xs font-semibold text-foreground">规则</h3>
                      <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-foreground">
                        <input type="checkbox" className="size-3.5 accent-foreground" checked={isEnabled} onChange={event => setIsEnabled(event.target.checked)} />
                        启用
                      </label>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="notification-period" className={FIELD_LABEL_CLASS_NAME}>周期</Label>
                        <select id="notification-period" className={SELECT_CLASS_NAME} value={period} onChange={event => setPeriod(event.target.value as TrendPeriod)}>
                          {TREND_PERIOD_VALUES.map(value => <option key={value} value={value}>{value === 'today' ? '今日' : value === 'week' ? '本周' : '本月'}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="notification-limit" className={FIELD_LABEL_CLASS_NAME}>每个来源</Label>
                        <select id="notification-limit" className={SELECT_CLASS_NAME} value={limit} onChange={event => setLimit(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map(value => (
                            <option key={value} value={value}>
                              {value}
                              {' '}
                              条
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="notification-time" className={FIELD_LABEL_CLASS_NAME}>时间</Label>
                        {fixedMinute === undefined
                          ? <select id="notification-time" className={SELECT_CLASS_NAME} value={scheduledMinute} onChange={event => setScheduledMinute(Number(event.target.value))}>{timeOptions.map(value => <option key={value} value={value}>{formatTime(value)}</option>)}</select>
                          : <div id="notification-time" className="mt-1.5 flex h-8 items-center rounded-md border border-input bg-muted/50 px-2.5 text-xs text-foreground">{formatTime(fixedMinute)}</div>}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Asia/Shanghai</p>
                  </section>
                </div>
              )}
        </div>

        <footer className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5 sm:px-5">
          <p aria-live="polite" className="min-w-0 truncate text-xs text-muted-foreground">{message}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={sendTest} disabled={isLoading || isTesting || isSaving}>
              {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" strokeWidth={1.75} />}
              测试
            </Button>
            <Button type="button" size="sm" onClick={saveSettings} disabled={isLoading || isTesting || isSaving}>
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" strokeWidth={1.75} />}
              保存
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
