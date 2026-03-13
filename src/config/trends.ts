import { DEFAULT_TREND_LIMIT } from '@/modules/trends/catalog'

export type TrendCardSize = 'compact' | 'default' | 'comfortable'

export interface TrendCardClassTokens {
  root: string
  topBadge: string
  sourceBadge: string
  title: string
  fullName: string
  description: string
  metricWrap: string
  metricItem: string
  actionWrap: string
}

export interface TrendUiScale {
  cardSize: TrendCardSize
  headerPadding: string
  logoSize: string
  logoIcon: string
  title: string
  subtitle: string
  userInfo: string
  pagePadding: string
  tabText: string
  inputText: string
  searchButtonHeight: string
  resetButtonHeight: string
  filterBarText: string
  helperText: string
  quickFilterText: string
  noticeText: string
  favPanelTitle: string
  favPanelText: string
  favItemTitle: string
  favItemSub: string
  favItemDesc: string
}

export const TREND_CARD_CLASS_MAP: Record<TrendCardSize, TrendCardClassTokens> = {
  compact: {
    root: 'p-4',
    topBadge: 'px-2.5 py-1 text-xs',
    sourceBadge: 'px-2.5 py-1 text-xs',
    title: 'text-2xl/none',
    fullName: 'text-sm',
    description: 'min-h-12 text-sm/6',
    metricWrap: 'mt-3 text-xs',
    metricItem: 'px-2.5 py-1',
    actionWrap: 'mt-4',
  },
  default: {
    root: 'p-5',
    topBadge: 'px-3 py-1 text-sm',
    sourceBadge: 'px-3 py-1 text-sm',
    title: 'text-3xl/none',
    fullName: 'text-base',
    description: 'min-h-14 text-base/7',
    metricWrap: 'mt-4 text-sm',
    metricItem: 'px-3 py-1.5',
    actionWrap: 'mt-5',
  },
  comfortable: {
    root: 'p-6',
    topBadge: 'px-3 py-1.5 text-sm',
    sourceBadge: 'px-3 py-1.5 text-sm',
    title: 'text-4xl/none',
    fullName: 'text-lg',
    description: 'min-h-16 text-lg/8',
    metricWrap: 'mt-4 text-sm',
    metricItem: 'px-3 py-1.5',
    actionWrap: 'mt-5',
  },
}

export const TREND_UI_SCALE_PRESETS: Record<'compact' | 'default' | 'comfortable', TrendUiScale> = {
  compact: {
    cardSize: 'compact',
    headerPadding: 'py-4',
    logoSize: 'size-12',
    logoIcon: 'size-6',
    title: 'text-2xl',
    subtitle: 'text-xs',
    userInfo: 'text-xs',
    pagePadding: 'py-6',
    tabText: 'text-xs',
    inputText: 'text-sm',
    searchButtonHeight: 'h-10',
    resetButtonHeight: 'h-10 w-10',
    filterBarText: 'text-xs',
    helperText: 'text-xs',
    quickFilterText: 'text-xs',
    noticeText: 'text-xs',
    favPanelTitle: 'text-lg',
    favPanelText: 'text-sm',
    favItemTitle: 'text-base',
    favItemSub: 'text-xs',
    favItemDesc: 'text-xs',
  },
  default: {
    cardSize: 'default',
    headerPadding: 'py-5',
    logoSize: 'size-14',
    logoIcon: 'size-7',
    title: 'text-3xl',
    subtitle: 'text-sm',
    userInfo: 'text-sm',
    pagePadding: 'py-8',
    tabText: 'text-sm',
    inputText: 'text-base',
    searchButtonHeight: 'h-11',
    resetButtonHeight: 'h-11 w-11',
    filterBarText: 'text-sm',
    helperText: 'text-sm',
    quickFilterText: 'text-sm',
    noticeText: 'text-sm',
    favPanelTitle: 'text-xl',
    favPanelText: 'text-base',
    favItemTitle: 'text-lg',
    favItemSub: 'text-sm',
    favItemDesc: 'text-sm',
  },
  comfortable: {
    cardSize: 'comfortable',
    headerPadding: 'py-6',
    logoSize: 'size-16',
    logoIcon: 'size-8',
    title: 'text-4xl',
    subtitle: 'text-base',
    userInfo: 'text-sm',
    pagePadding: 'py-10',
    tabText: 'text-base',
    inputText: 'text-base',
    searchButtonHeight: 'h-11',
    resetButtonHeight: 'h-11 w-11',
    filterBarText: 'text-sm',
    helperText: 'text-sm',
    quickFilterText: 'text-sm',
    noticeText: 'text-sm',
    favPanelTitle: 'text-xl',
    favPanelText: 'text-base',
    favItemTitle: 'text-lg',
    favItemSub: 'text-sm',
    favItemDesc: 'text-sm',
  },
}

export const trendUiConfig = {
  activeScalePreset: 'compact' as keyof typeof TREND_UI_SCALE_PRESETS,
  trendLimit: DEFAULT_TREND_LIMIT,
  quickFilterCollapsedCount: 5,
  noticeDurationMs: 2200,
}
