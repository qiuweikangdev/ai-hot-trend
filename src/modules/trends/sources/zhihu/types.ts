export interface ZhihuRawItem {
  type: string
  style_type: string | number
  id: string
  card_id: string
  target: ZhihuHotItem
}

export interface ZhihuHotItem {
  id: number
  title: string
  url: string
  type: 'question' | 'article'
  created: number | string
  answer_count: number
  follower_count: number
  author: {
    id: string
    name: string
    headline?: string
    avatar_url: string
  }
  bound_topic_ids: number[]
  comment_count: number
  excerpt?: string
}
