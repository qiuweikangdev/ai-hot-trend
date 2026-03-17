export function formatCompactCount(value: number) {
  if (value >= 10000) {
    const displayValue = value / 10000
    const formattedValue = Number.isInteger(displayValue)
      ? displayValue.toFixed(0)
      : displayValue.toFixed(1)

    return `${formattedValue}万`
  }

  return String(value)
}

export function formatTrendDate(value: string) {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
