'use client'

import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { Check, ChevronDown, Loader2, Save, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TREND_SOURCE_OPTIONS } from '@/modules/trends/catalog'
import { isTrendSource } from '@/modules/trends/types'

type ChannelType = 'feishu' | 'email'

interface ChannelData {
  isEnabled: boolean
  summary: { label: string, maskedTarget: string, target?: string }
  email?: string
  recipientEmail?: string
  subscription: { sources: TrendSource[], period: TrendPeriod, limit: number, scheduledMinute: number, isEnabled: boolean } | null
  lastTestMessage: string | null
}

interface SettingsData {
  capabilities: { provider: 'vercel' | 'cloudflare' | 'local', fixedDeliveryMinute?: number }
  channels: Record<ChannelType, ChannelData | null>
}

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const CHANNEL_OPTIONS = [
  { value: 'feishu', label: '飞书', enabled: true },
  { value: 'email', label: 'QQ邮箱', enabled: true },
] as const

const NOTIFICATION_SOURCE_OPTIONS = TREND_SOURCE_OPTIONS.flatMap(option => (
  option.enabled && isTrendSource(option.value)
    ? [{ value: option.value, label: option.label }]
    : []
))

const SELECT_CLASS_NAME = 'mt-1 h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30'
const FIELD_LABEL_CLASS_NAME = 'text-xs font-medium'
const INPUT_CLASS_NAME = 'mt-1 h-8 bg-background !text-xs'
const TIME_OPTIONS = Array.from({ length: 288 }, (_, index) => index * 5)
const PERIOD_OPTIONS = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
] satisfies SelectOption[]
const LIMIT_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const value = index + 1
  return { value, label: `${value} 条` }
}) satisfies SelectOption[]
const TIME_SELECT_OPTIONS = TIME_OPTIONS.map(value => ({ value, label: formatTime(value) }))

function formatTime(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

interface SelectOption {
  value: string | number
  label: string
}

interface SettingsSelectProps {
  id: string
  options: SelectOption[]
  value: string | number
  onChange: (value: string | number) => void
  scrollable?: boolean
}

function SettingsSelect({ id, options, value, onChange, scrollable = false }: SettingsSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    if (isOpen)
      selectedItemRef.current?.scrollIntoView({ block: 'center' })
  }, [isOpen, value])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cn(SELECT_CLASS_NAME, 'flex items-center justify-between gap-2 text-left')}
        >
          <span>{selectedOption?.label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          'minimal-scrollbar max-h-[calc(100vh-2rem)] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto p-1',
          scrollable ? 'h-56' : 'max-h-56',
        )}
      >
        {options.map(option => (
          <DropdownMenuItem
            key={String(option.value)}
            ref={option.value === value ? selectedItemRef : undefined}
            className="h-7 justify-between px-2.5 text-xs"
            onSelect={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.value === value ? <Check className="size-3.5" strokeWidth={2} /> : <span className="size-3.5" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [data, setData] = useState<SettingsData | null>(null)
  const [activeChannel, setActiveChannel] = useState<ChannelType>('feishu')
  const activeChannelRef = useRef<ChannelType>('feishu')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [sources, setSources] = useState<TrendSource[]>(['ai', 'github'])
  const [period, setPeriod] = useState<TrendPeriod>('today')
  const [limit, setLimit] = useState(5)
  const [scheduledMinute, setScheduledMinute] = useState(540)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [message, setMessage] = useState('')
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
        const channelData = result.data.channels[activeChannelRef.current]
        const subscription = channelData?.subscription
        setSources(subscription?.sources ?? ['ai', 'github'])
        setPeriod(subscription?.period ?? 'today')
        setLimit(subscription?.limit ?? 5)
        setScheduledMinute(subscription?.scheduledMinute ?? 540)
        setIsEnabled(subscription?.isEnabled ?? true)
        if (activeChannelRef.current === 'email') {
          setEmail(channelData?.email ?? '')
          setRecipientEmail(channelData?.recipientEmail ?? '')
        }
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
  const activeChannelData = data?.channels[activeChannel] ?? null
  const hasSavedChannel = Boolean(activeChannelData)

  function selectChannel(channel: ChannelType) {
    activeChannelRef.current = channel
    setActiveChannel(channel)
    const channelData = data?.channels[channel]
    const subscription = channelData?.subscription
    setSources(subscription?.sources ?? ['ai', 'github'])
    setPeriod(subscription?.period ?? 'today')
    setLimit(subscription?.limit ?? 5)
    setScheduledMinute(subscription?.scheduledMinute ?? 540)
    setIsEnabled(subscription?.isEnabled ?? true)
    if (channel === 'email') {
      setEmail(channelData?.email ?? '')
      setRecipientEmail(channelData?.recipientEmail ?? '')
    }
  }

  function toggleSource(source: TrendSource) {
    setSources(current => current.includes(source)
      ? current.length > 1 ? current.filter(item => item !== source) : current
      : [...current, source])
  }

  async function saveSettings() {
    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch(`/api/notification-settings/${activeChannel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeChannel === 'feishu'
          ? { webhookUrl, secret, isEnabled, subscription: { sources, period, limit, scheduledMinute: deliveryMinute } }
          : { email, recipientEmail, authorizationCode, isEnabled, subscription: { sources, period, limit, scheduledMinute: deliveryMinute } }),
      })
      if (!response.ok)
        throw new Error(activeChannel === 'feishu' ? '保存失败，请检查 Webhook 地址和内容选择。' : '保存失败，请检查邮箱地址、收件邮箱和授权码。')
      const result = await response.json() as { data: { summary: ChannelData['summary'], email?: string, recipientEmail?: string } }
      setData(current => current
        ? {
            ...current,
            channels: {
              ...current.channels,
              [activeChannel]: {
                isEnabled,
                summary: result.data.summary,
                subscription: { sources, period, limit, scheduledMinute: deliveryMinute, isEnabled },
                lastTestMessage: current.channels[activeChannel]?.lastTestMessage ?? null,
                ...(activeChannel === 'email'
                  ? { email: result.data.email ?? email.trim(), recipientEmail: result.data.recipientEmail ?? recipientEmail.trim() }
                  : {}),
              },
            },
          }
        : current)
      setSecret('')
      setAuthorizationCode('')
      setMessage('设置已保存')
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败，请稍后重试。')
    }
    finally {
      setIsSaving(false)
    }
  }

  async function sendNotification() {
    setIsPushing(true)
    setMessage('')

    try {
      const response = await fetch(`/api/notification-settings/${activeChannel}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeChannel === 'feishu'
          ? { webhookUrl, secret, subscription: { sources, period, limit, scheduledMinute: deliveryMinute } }
          : { email, recipientEmail, authorizationCode, subscription: { sources, period, limit, scheduledMinute: deliveryMinute } }),
      })
      if (!response.ok)
        throw new Error(await getResponseErrorMessage(response, activeChannel === 'feishu' ? '推送失败，请检查飞书 Webhook、内容来源和网络连接。' : '推送失败，请检查邮箱地址、收件邮箱、授权码、内容来源和网络连接。'))
      setMessage('热点已推送')
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : '推送失败，请稍后重试。')
    }
    finally {
      setIsPushing(false)
    }
  }

  async function getResponseErrorMessage(response: Response, fallback: string) {
    const result = await response.json().catch(() => null) as { message?: unknown } | null
    return typeof result?.message === 'string' && result.message ? result.message : fallback
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="notification-settings-title" className="flex max-h-[min(640px,calc(100vh-1.5rem))] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-border bg-card" onClick={event => event.stopPropagation()}>
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4 sm:px-5">
          <h2 id="notification-settings-title" className="text-sm font-semibold tracking-[-0.01em] text-foreground">推送设置</h2>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground" onClick={onClose} aria-label="关闭推送设置">
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </header>

        <div className="shrink-0 border-b border-border px-4 sm:px-5">
          <div className="flex h-8 items-end gap-5" role="tablist" aria-label="推送渠道">
            {CHANNEL_OPTIONS.map(channel => (
              <button
                key={channel.value}
                type="button"
                role="tab"
                aria-selected={channel.value === activeChannel}
                disabled={!channel.enabled}
                className={cn(
                  'flex h-8 items-center border-b-2 border-transparent text-xs font-medium text-muted-foreground transition-colors',
                  channel.enabled ? 'hover:text-foreground' : 'cursor-not-allowed opacity-35',
                  channel.value === activeChannel && 'border-foreground text-foreground dark:border-ring',
                )}
                onClick={() => selectChannel(channel.value)}
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
                  <section className="border-b border-border py-3">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xs font-semibold text-foreground">连接</h3>
                      {hasSavedChannel
                        ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Check className="size-3" strokeWidth={1.75} />
                              {activeChannelData?.summary.target ?? activeChannelData?.summary.maskedTarget}
                            </span>
                          )
                        : null}
                    </div>
                    {activeChannel === 'feishu'
                      ? (
                          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                            <div>
                              <Label htmlFor="feishu-webhook" className={FIELD_LABEL_CLASS_NAME}>Webhook</Label>
                              <Input id="feishu-webhook" className={INPUT_CLASS_NAME} value={webhookUrl} onChange={event => setWebhookUrl(event.target.value)} placeholder={hasSavedChannel ? '填写新地址以更新' : 'https://open.feishu.cn/open-apis/bot/v2/hook/...'} />
                            </div>
                            <div>
                              <Label htmlFor="feishu-secret" className={FIELD_LABEL_CLASS_NAME}>
                                签名密钥
                                <span className="font-normal text-muted-foreground">可选</span>
                              </Label>
                              <Input id="feishu-secret" className={INPUT_CLASS_NAME} type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={hasSavedChannel ? '已保存，留空保留' : '选填'} />
                            </div>
                          </div>
                        )
                      : (
                          <div className="mt-2.5 space-y-2.5">
                            <div className="grid gap-2.5 sm:grid-cols-2">
                              <div>
                                <Label htmlFor="qq-email" className={FIELD_LABEL_CLASS_NAME}>QQ邮箱地址</Label>
                                <Input id="qq-email" className={INPUT_CLASS_NAME} type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={hasSavedChannel ? '填写新地址以更新' : '例如 123456@qq.com'} autoComplete="email" />
                              </div>
                              <div>
                                <Label htmlFor="qq-recipient-email" className={FIELD_LABEL_CLASS_NAME}>收件邮箱</Label>
                                <Input id="qq-recipient-email" className={INPUT_CLASS_NAME} type="email" value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} placeholder={hasSavedChannel ? '填写新地址以更新' : '接收热点日报的邮箱'} autoComplete="email" />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="qq-authorization-code" className={FIELD_LABEL_CLASS_NAME}>QQ邮箱授权码</Label>
                              <Input id="qq-authorization-code" className={INPUT_CLASS_NAME} type="password" value={authorizationCode} onChange={event => setAuthorizationCode(event.target.value)} placeholder={hasSavedChannel ? '已保存，留空保留' : '不是 QQ 登录密码'} autoComplete="new-password" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">请在 QQ 邮箱设置中开启 SMTP，并使用生成的授权码。邮件通过 smtp.qq.com 安全发送。</p>
                          </div>
                        )}
                  </section>

                  <section className="border-b border-border py-3" aria-labelledby="notification-sources-title">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 id="notification-sources-title" className="text-xs font-semibold text-foreground">来源</h3>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        已选
                        {' '}
                        {sources.length}
                        /
                        {NOTIFICATION_SOURCE_OPTIONS.length}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1" role="group" aria-labelledby="notification-sources-title" aria-describedby="notification-sources-hint">
                      {NOTIFICATION_SOURCE_OPTIONS.map((source) => {
                        const isSelected = sources.includes(source.value)

                        return (
                          <button
                            key={source.value}
                            type="button"
                            aria-pressed={isSelected}
                            className={cn(
                              'inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
                              isSelected
                                ? 'border-foreground bg-foreground text-background shadow-xs hover:bg-foreground/90 dark:border-ring/70 dark:bg-accent dark:text-foreground dark:hover:bg-accent/90'
                                : 'border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() => toggleSource(source.value)}
                          >
                            {source.label}
                          </button>
                        )
                      })}
                    </div>
                    <p id="notification-sources-hint" className="sr-only">来源为多选项，至少选择一个来源。</p>
                  </section>

                  <section className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xs font-semibold text-foreground">规则</h3>
                      <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-foreground">
                        <input type="checkbox" className="size-3.5 accent-primary" checked={isEnabled} onChange={event => setIsEnabled(event.target.checked)} />
                        启用
                      </label>
                    </div>
                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="notification-period" className={FIELD_LABEL_CLASS_NAME}>周期</Label>
                        <SettingsSelect id="notification-period" options={PERIOD_OPTIONS} value={period} onChange={value => setPeriod(value as TrendPeriod)} />
                      </div>
                      <div>
                        <Label htmlFor="notification-limit" className={FIELD_LABEL_CLASS_NAME}>每个来源</Label>
                        <SettingsSelect id="notification-limit" options={LIMIT_OPTIONS} value={limit} onChange={value => setLimit(Number(value))} />
                      </div>
                      <div>
                        <Label htmlFor="notification-time" className={FIELD_LABEL_CLASS_NAME}>时间</Label>
                        {fixedMinute === undefined
                          ? <SettingsSelect id="notification-time" options={TIME_SELECT_OPTIONS} value={scheduledMinute} onChange={value => setScheduledMinute(Number(value))} scrollable />
                          : <div id="notification-time" className="mt-1 flex h-8 items-center rounded-md border border-input bg-muted/50 px-2.5 text-xs text-foreground">{formatTime(fixedMinute)}</div>}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Asia/Shanghai</p>
                  </section>
                </div>
              )}
        </div>

        <footer className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-2 sm:px-5">
          <p aria-live="polite" className="min-w-0 truncate text-xs text-muted-foreground">{message}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={sendNotification} disabled={isLoading || isPushing || isSaving}>
              {isPushing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" strokeWidth={1.75} />}
              推送
            </Button>
            <Button type="button" size="sm" onClick={saveSettings} disabled={isLoading || isPushing || isSaving}>
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" strokeWidth={1.75} />}
              保存
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
