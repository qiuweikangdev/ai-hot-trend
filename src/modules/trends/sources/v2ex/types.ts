export interface V2exNode {
  id: number
  name: string
  title: string
  url?: string
  topics?: number
  stars?: number
  avatar_large?: string
}

export interface V2exMember {
  id: number
  username: string
  url?: string
  tagline?: string
  avatar_large?: string
}

export interface V2exTopic {
  id: number
  title: string
  url: string
  created: number
  last_modified: number
  replies: number
  content?: string
  node: V2exNode
  member: V2exMember
}
