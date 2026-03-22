import type { ZhihuRawItem } from '@/modules/trends/sources/zhihu/types'

const ZHIHU_API_URL = 'https://api.zhihu.com/topstory/hot-lists/total'

const UA = 'com.zhihu.android/Futureve/6.36.0 Mozilla/5.0 (Linux; Android 9; Pixel 3 XL Build/PQ3A.190801.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36'

export async function fetchZhihuHotItems(limit: number): Promise<ZhihuRawItem[]> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  })

  const response = await fetch(`${ZHIHU_API_URL}?${searchParams.toString()}`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`知乎热点抓取失败: ${response.status} ${errorText}`)
  }

  const payload = await response.json() as { data?: ZhihuRawItem[] }
  return payload.data ?? []
}
