import process from 'node:process'
import { dispatchDueNotifications } from '@/modules/notifications/dispatcher'

interface LocalSchedulerState {
  interval: ReturnType<typeof setInterval> | null
  isRunning: boolean
}

type GlobalWithLocalScheduler = typeof globalThis & {
  __aiHotTrendLocalNotificationScheduler?: LocalSchedulerState
}

const globalState = globalThis as GlobalWithLocalScheduler

async function dispatchLocalNotifications(state: LocalSchedulerState) {
  if (state.isRunning)
    return
  state.isRunning = true

  try {
    await dispatchDueNotifications('local')
  }
  catch (error) {
    console.error('[notifications] local dispatch failed', error instanceof Error ? error.message : error)
  }
  finally {
    state.isRunning = false
  }
}

export function register() {
  const configuredProvider = process.env.NOTIFICATION_SCHEDULER_PROVIDER?.trim()
  const isLocalDevelopment = process.env.NODE_ENV === 'development' && (!configuredProvider || configuredProvider === 'local')
  if (!isLocalDevelopment || globalState.__aiHotTrendLocalNotificationScheduler?.interval)
    return

  const state = globalState.__aiHotTrendLocalNotificationScheduler ??= { interval: null, isRunning: false }
  state.interval = setInterval(() => {
    void dispatchLocalNotifications(state)
  }, 60_000)
  void dispatchLocalNotifications(state)
}
