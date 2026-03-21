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
    <div className="rounded-full border border-slate-200/90 bg-[#eef2f7] p-1 dark:border-white/10 dark:bg-[#0a0d12]">
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 items-center gap-2.5 rounded-full px-4 transition">
          <Search className="size-4 text-slate-400 dark:text-slate-500" />
          <Input
            value={value}
            onChange={event => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearch()
              }
            }}
            placeholder="搜索全网趋势..."
            className={cn('h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500', uiScale.inputText)}
          />
        </div>

        <div className="flex items-center gap-1.5 pr-1">
          <Button type="button" className={cn('w-10 rounded-full bg-blue-500 px-0 text-white shadow-none hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:w-11', uiScale.searchButtonHeight)} onClick={onSearch}>
            <Search className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('rounded-full border-slate-200/85 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-white/15 dark:bg-[#111722] dark:text-slate-300 dark:hover:border-white/25 dark:hover:bg-[#161d2a] dark:hover:text-white', uiScale.resetButtonHeight)}
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
