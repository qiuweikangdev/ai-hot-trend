'use client'

import type { CSSProperties } from 'react'
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
        style: {
          '--normal-bg': 'var(--card)',
          '--normal-border': 'var(--border)',
          '--normal-border-hover': 'var(--ring)',
          '--normal-bg-hover': 'var(--secondary)',
          '--normal-text': 'var(--foreground)',
        } as CSSProperties,
        classNames: {
          toast: 'rounded-lg border border-slate-200/80 bg-white/92 px-4 py-3 text-slate-700 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.55)] dark:border-border dark:bg-card dark:text-foreground',
          title: 'text-sm font-medium leading-5',
          description: 'text-xs text-slate-500 dark:text-muted-foreground',
          icon: 'text-slate-500 dark:text-muted-foreground',
          closeButton: 'border-slate-200/90 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-secondary dark:hover:text-foreground',
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
