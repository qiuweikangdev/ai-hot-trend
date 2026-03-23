import type { JuejinFeedItem, JuejinFeedResponse } from '@/modules/trends/sources/juejin/types'

const JUEJIN_FEED_API_URL = 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed'
const JUEJIN_SORT_TYPE_HOT = 200

export async function fetchJuejinHotFeed(cursor: string, limit: number) {
  const response = await fetch(JUEJIN_FEED_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      id_type: 2,
      sort_type: JUEJIN_SORT_TYPE_HOT,
      cursor,
      limit,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`掘金热点抓取失败: ${response.status} ${errorText}`)
  }

  const payload = await response.json() as JuejinFeedResponse

  if (payload.err_no !== 0) {
    throw new Error(`掘金热点抓取失败: ${payload.err_msg || '未知错误'}`)
  }

  return {
    items: (payload.data ?? [])
      .map(entry => entry.item_info)
      .filter((item): item is JuejinFeedItem => Boolean(item?.article_id && item.article_info?.title)),
    nextCursor: String(payload.cursor ?? cursor),
    hasMore: Boolean(payload.has_more),
  }
}

export function filterJuejinItems(items: JuejinFeedItem[], keyword?: string, language?: string) {
  const normalizedKeyword = keyword?.trim().toLowerCase()
  const normalizedLanguage = language?.trim().toLowerCase()

  if (!normalizedKeyword && !normalizedLanguage) {
    return items
  }

  return items.filter((item) => {
    const tags = (item.tags ?? []).map(tag => tag.tag_name ?? '').join(' ').toLowerCase()
    const text = [
      item.article_info.title,
      item.article_info.brief_content ?? '',
      item.author_user_info?.job_title ?? '',
      tags,
    ].join(' ').toLowerCase()

    const keywordMatched = normalizedKeyword ? text.includes(normalizedKeyword) : true
    const languageMatched = normalizedLanguage ? text.includes(normalizedLanguage) : true

    return keywordMatched && languageMatched
  })
}
