const CHINA_TIME_ZONE = 'Asia/Shanghai'

const chinaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CHINA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const chinaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: CHINA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export interface DueCheckInput {
  now: Date
  scheduledMinute: number
  resolutionMinutes: 5 | 1440
  fixedDeliveryMinute?: number
}

export function getChinaDateKey(date: Date): string {
  const parts = chinaDateFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function getChinaMinuteOfDay(date: Date): number {
  const parts = chinaTimeFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))

  return Number(values.hour) * 60 + Number(values.minute)
}

export function isSubscriptionDue({ now, scheduledMinute, resolutionMinutes, fixedDeliveryMinute }: DueCheckInput): boolean {
  const currentMinute = getChinaMinuteOfDay(now)

  if (resolutionMinutes === 1440) {
    return fixedDeliveryMinute !== undefined
      && scheduledMinute === fixedDeliveryMinute
      // Vercel Hobby may invoke a daily Cron at any minute within the configured UTC hour.
      && Math.floor(currentMinute / 60) === Math.floor(fixedDeliveryMinute / 60)
  }

  if (currentMinute % resolutionMinutes !== 0) {
    return false
  }

  const elapsedMinutes = currentMinute - scheduledMinute
  return elapsedMinutes >= 0 && elapsedMinutes <= 15
}
