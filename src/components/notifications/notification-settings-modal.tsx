'use client'

import type { TrendPeriod, TrendSource } from '@/modules/trends/types'
import { BellRing, Check, Loader2, Save, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TREND_PERIOD_VALUES, TREND_SOURCE_VALUES } from '@/modules/trends/types'

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
      setMessage('设置已保存，机器人密钥已加密保护。')
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
      setMessage('测试消息已发送，请在飞书群中确认。')
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : '测试消息发送失败。')
    }
    finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/65" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="notification-settings-title" className="max-h-[min(760px,calc(100vh-2rem))] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-[#0b1018]" onClick={event => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#0b1018]/95">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-200"><BellRing className="size-5" /></div>
            <div>
              <h2 id="notification-settings-title" className="font-semibold text-slate-900 dark:text-white">飞书推送</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">每日热点，准时送达</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onClose} aria-label="关闭推送设置"><X className="size-4" /></Button>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          {isLoading
            ? (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-white/5">
                  <Loader2 className="size-4 animate-spin" />
                  正在加载设置...
                </div>
              )
            : (
                <>
                  <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">机器人连接</h3>
                        <p className="mt-1 text-xs text-slate-500">Webhook 与签名密钥仅加密存储，不会回显。</p>
                      </div>
                      {hasSavedChannel && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200">
                          <Check className="size-3" />
                          已连接
                        </span>
                      )}
                    </div>
                    {data?.channel && (
                      <p className="mb-3 text-xs text-slate-500">
                        当前机器人：
                        {data.channel.summary.maskedTarget}
                      </p>
                    )}
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="feishu-webhook">飞书 Webhook</Label>
                        <Input id="feishu-webhook" className="mt-2 bg-white dark:bg-[#101722]" value={webhookUrl} onChange={event => setWebhookUrl(event.target.value)} placeholder={hasSavedChannel ? '如需更新，请填写新的 Webhook 地址' : 'https://open.feishu.cn/open-apis/bot/v2/hook/...'} />
                      </div>
                      <div>
                        <Label htmlFor="feishu-secret">
                          签名密钥
                          <span className="font-normal text-slate-400">可选</span>
                        </Label>
                        <Input id="feishu-secret" className="mt-2 bg-white dark:bg-[#101722]" type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={hasSavedChannel ? '留空则保留当前密钥' : '机器人开启签名校验时填写'} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">推送内容</h3>
                      <p className="mt-1 text-xs text-slate-500">选择你每天最关注的热点来源。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">{TREND_SOURCE_VALUES.map(source => <button key={source} type="button" aria-pressed={sources.includes(source)} className={sources.includes(source) ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm dark:bg-cyan-300 dark:text-slate-950' : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 dark:border-white/15 dark:bg-transparent dark:text-slate-300'} onClick={() => toggleSource(source)}>{source}</button>)}</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="notification-period">热点周期</Label>
                        <select id="notification-period" className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-[#101722]" value={period} onChange={event => setPeriod(event.target.value as TrendPeriod)}>{TREND_PERIOD_VALUES.map(value => <option key={value} value={value}>{value === 'today' ? '今日' : value === 'week' ? '本周' : '本月'}</option>)}</select>
                      </div>
                      <div>
                        <Label htmlFor="notification-limit">每个来源</Label>
                        <select id="notification-limit" className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-[#101722]" value={limit} onChange={event => setLimit(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map(value => (
                            <option key={value} value={value}>
                              {value}
                              {' '}
                              条
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-300/15 dark:bg-cyan-300/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">推送时间</h3>
                        <p className="mt-1 text-xs text-slate-500">时区统一为中国标准时间（Asia/Shanghai）。</p>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <input type="checkbox" className="size-4 accent-cyan-600" checked={isEnabled} onChange={event => setIsEnabled(event.target.checked)} />
                        启用
                      </label>
                    </div>
                    {fixedMinute === undefined
                      ? <select className="mt-3 h-9 w-full rounded-md border border-cyan-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 dark:border-cyan-300/20 dark:bg-[#101722]" value={scheduledMinute} onChange={event => setScheduledMinute(Number(event.target.value))}>{timeOptions.map(value => <option key={value} value={value}>{formatTime(value)}</option>)}</select>
                      : (
                          <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                            当前部署使用 Vercel 每日任务，将在
                            <strong>{formatTime(fixedMinute)}</strong>
                            {' '}
                            推送。部署到 Cloudflare Workers 后可自定义五分钟时段。
                          </p>
                        )}
                  </section>
                </>
              )}
        </div>

        <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#0b1018]/95">
          <p aria-live="polite" className="min-w-0 text-xs text-slate-500">{message}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={sendTest} disabled={isLoading || isTesting || isSaving}>
              {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              测试
            </Button>
            <Button type="button" size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={saveSettings} disabled={isLoading || isTesting || isSaving}>
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              保存
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
