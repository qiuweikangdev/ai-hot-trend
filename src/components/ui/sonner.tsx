'use client'

import type { ToasterProps } from 'sonner'
import { useSyncExternalStore } from 'react'
import { Toaster as Sonner } from 'sonner'

function getThemeSnapshot(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function Toaster(props: ToasterProps) {
  const theme = useSyncExternalStore<'light' | 'dark'>(
    (onStoreChange) => {
      const root = document.documentElement
      const observer = new MutationObserver(onStoreChange)

      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class'],
      })

      return () => {
        observer.disconnect()
      }
    },
    getThemeSnapshot,
    () => 'light',
  )

  return (
    <Sonner
      theme={theme}
      visibleToasts={3}
      offset={20}
      mobileOffset={14}
      icons={{
        success: null,
      }}
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-slate-200/80 bg-white/92 text-slate-700 shadow-[0_14px_36px_-24px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0b111a]/92 dark:text-slate-100',
          title: 'text-sm font-medium',
          description: 'text-xs text-slate-500 dark:text-slate-400',
          icon: 'text-slate-500 dark:text-slate-300',
          closeButton: 'border-slate-200/90 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          success: 'border-emerald-200/70 dark:border-emerald-300/25',
          error: 'border-rose-200/70 dark:border-rose-300/25',
          warning: 'border-amber-200/70 dark:border-amber-300/25',
          info: 'border-cyan-200/70 dark:border-cyan-300/25',
        },
      }}
      {...props}
    />
  )
}
