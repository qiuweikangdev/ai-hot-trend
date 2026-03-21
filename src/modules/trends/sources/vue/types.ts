export interface BestOfJsTrendValues {
  daily: number
  weekly: number
  monthly: number
}

export interface BestOfJsProject {
  slug: string
  name: string
  full_name: string
  owner_id?: number
  description?: string | null
  stars: number
  tags?: string[]
  trends: BestOfJsTrendValues
  pushed_at?: string
  created_at?: string
  url?: string
}

export type BestOfJsSortPeriod = keyof BestOfJsTrendValues
