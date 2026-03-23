export interface JuejinArticleInfo {
  article_id: string
  title: string
  brief_content?: string
  ctime?: string
  mtime?: string
  hot_index?: number
  view_count?: number
  digg_count?: number
  comment_count?: number
  link_url?: string
}

export interface JuejinAuthorInfo {
  user_name?: string
  job_title?: string
  avatar_large?: string
}

export interface JuejinTag {
  tag_name?: string
}

export interface JuejinFeedItem {
  article_id: string
  article_info: JuejinArticleInfo
  author_user_info?: JuejinAuthorInfo
  tags?: JuejinTag[]
}

export interface JuejinFeedEntry {
  item_type?: number
  item_info?: JuejinFeedItem
}

export interface JuejinFeedResponse {
  err_no: number
  err_msg: string
  data?: JuejinFeedEntry[]
  cursor?: string | number
  has_more?: boolean
}
