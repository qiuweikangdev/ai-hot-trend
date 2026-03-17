'use client'

import { useEffect, useState } from 'react'

export function useDashboardNotice(durationMs: number) {
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => {
      setNotice('')
    }, durationMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [durationMs, notice])

  return {
    notice,
    setNotice,
  }
}
