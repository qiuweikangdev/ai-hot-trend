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
    <div className="rounded-[22px] border border-slate-200/85 bg-white p-1 shadow-[0_10px_22px_-20px_rgba(15,23,42,0.14)]">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex flex-1 items-center gap-2.5 rounded-[16px] bg-slate-50/80 px-3.5 ring-1 ring-slate-200/85 transition focus-within:ring-blue-200/90">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button type="button" className={cn('w-11 rounded-[14px] bg-blue-600 px-0 text-white shadow-[0_12px_22px_-14px_rgba(37,99,235,0.72)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_14px_24px_-14px_rgba(37,99,235,0.85)] focus-visible:ring-blue-200 sm:min-w-20 sm:px-4', uiScale.searchButtonHeight)} onClick={onSearch}>
            <Search className="size-4" />
            <span className="hidden sm:inline">搜索</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('rounded-[16px] border-slate-200/85 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-blue-200', uiScale.resetButtonHeight)}
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
