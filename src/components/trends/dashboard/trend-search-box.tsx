'use client'

import type { TrendUiScale } from '@/config/trends'
import { RotateCcw, Search } from 'lucide-react'
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
    <div className="flex h-9 items-center rounded-lg border border-input bg-card pl-3 pr-1 transition-colors focus-within:border-foreground/35 focus-within:ring-2 focus-within:ring-ring/15">
      <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <Input
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSearch()
          }
        }}
        placeholder="搜索"
        aria-label="搜索热点"
        className={cn('h-8 min-w-0 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0', uiScale.inputText)}
      />

      {value
        ? (
            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 rounded-md text-muted-foreground" onClick={onReset} aria-label="重置搜索" title="重置搜索">
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
            </Button>
          )
        : null}

      <Button type="button" size="icon" className="size-7 shrink-0 rounded-md" onClick={onSearch} aria-label="执行搜索" title="搜索">
        <Search className="size-3.5" strokeWidth={1.75} />
      </Button>
    </div>
  )
}
