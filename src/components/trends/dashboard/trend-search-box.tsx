'use client'

import type { TrendUiScale } from '@/config/trends'
import { RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TrendSearchBoxProps {
  uiScale: TrendUiScale
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
}

export function TrendSearchBox({
  uiScale,
  value,
  onChange,
  onSearch,
  onReset,
}: TrendSearchBoxProps) {
  return (
    <div className="rounded-[24px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(250,253,255,0.8)_100%)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-22px_rgba(100,116,139,0.22)] ring-1 ring-slate-200/55">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-3 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(252,254,255,0.9)_100%)] px-4 ring-1 ring-slate-200/75">
          <Search className="size-4 text-slate-500/70" />
          <Input
            value={value}
            onChange={event => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearch()
              }
            }}
            placeholder="筛选语言，例如 vue / react"
            className={cn('border-0 bg-transparent px-0 shadow-none focus-visible:ring-0', uiScale.searchButtonHeight, uiScale.inputText)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" className={cn('w-12 rounded-[16px] bg-blue-600 px-0 text-white shadow-[0_12px_24px_-18px_rgba(37,99,235,0.8)] hover:bg-blue-500 sm:min-w-24 sm:px-5', uiScale.searchButtonHeight)} onClick={onSearch}>
            <Search className="size-4" />
            <span className="hidden sm:inline">搜索</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('rounded-[16px] border-slate-200/85 bg-white/88 text-slate-600 hover:border-slate-300 hover:bg-slate-50', uiScale.resetButtonHeight)}
            onClick={onReset}
            aria-label="重置筛选"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
