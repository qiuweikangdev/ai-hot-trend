import type { TrendPeriod, TrendSource } from '@/modules/trends/types'

export type PlannedTrendSource = 'hot' | 'weibo' | 'zhihu' | 'juejin' | 'v2ex'

export type TrendSourceOptionValue = TrendSource | PlannedTrendSource

export interface TrendSourceOption {
  value: TrendSourceOptionValue
  label: string
  enabled: boolean
  description: string
}

export interface TrendPeriodOption {
  value: TrendPeriod
  label: string
}

export const DEFAULT_TREND_SOURCE: TrendSource = 'github'
export const DEFAULT_TREND_PERIOD: TrendPeriod = 'week'
export const DEFAULT_TREND_LIMIT = 18
export const MAX_TREND_LIMIT = 30
export const DEFAULT_TREND_SOURCE_LABEL = '趋势源'

// Keep all source metadata in one place so tabs, badges, and future providers
// stay aligned when we add new sources.
export const TREND_SOURCE_OPTIONS: TrendSourceOption[] = [
  { value: 'hot', label: '热点聚合', enabled: false, description: '聚合多站点热度排行' },
  { value: 'github', label: 'GitHub', enabled: true, description: '代码仓库热点趋势' },
  { value: 'npm', label: 'npm', enabled: true, description: '包生态下载与讨论热度' },
  { value: 'vue', label: 'Vue 生态', enabled: true, description: 'Best of JS 的 Vue 生态增星趋势' },
  { value: 'react', label: 'React 生态', enabled: true, description: 'Best of JS 的 React 生态增星趋势' },
  { value: 'node', label: 'Node 生态', enabled: true, description: 'Best of JS 的 Node 生态增星趋势' },
  { value: 'weibo', label: '微博', enabled: false, description: '中文社区实时热榜' },
  { value: 'zhihu', label: '知乎', enabled: false, description: '问答社区讨论趋势' },
  { value: 'juejin', label: '掘金', enabled: false, description: '开发者内容热点' },
  { value: 'v2ex', label: 'V2EX', enabled: false, description: '技术社区节点热帖' },
]

export const TREND_PERIOD_OPTIONS: TrendPeriodOption[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

export const PRESET_TREND_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Vue',
  'React',
]

const sourceMetaMap = new Map<string, TrendSourceOption>(
  TREND_SOURCE_OPTIONS.map(option => [option.value, option]),
)

const periodMetaMap = new Map<TrendPeriod, TrendPeriodOption>(
  TREND_PERIOD_OPTIONS.map(option => [option.value, option]),
)

export function getTrendSourceMeta(source: TrendSource | string) {
  return sourceMetaMap.get(source) ?? {
    value: source,
    label: DEFAULT_TREND_SOURCE_LABEL,
    enabled: false,
    description: '未配置站点描述',
  }
}

export function getTrendPeriodLabel(period: TrendPeriod) {
  return periodMetaMap.get(period)?.label ?? '趋势周期'
}
