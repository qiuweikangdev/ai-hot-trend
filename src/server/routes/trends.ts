import { Hono } from 'hono'
import { parseTrendRequestQuery } from '@/modules/trends/query'
import { queryTrendItems } from '@/modules/trends/service'

const trendsRoute = new Hono()

trendsRoute.get('/', async (c) => {
  try {
    const query = parseTrendRequestQuery({
      source: c.req.query('source') ?? null,
      period: c.req.query('period') ?? null,
      limit: c.req.query('limit') ?? null,
      language: c.req.query('language') ?? null,
      keyword: c.req.query('keyword') ?? null,
      offset: c.req.query('offset') ?? null,
    })

    const data = await queryTrendItems(query)

    return c.json({
      success: true,
      data,
    })
  }
  catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '热点查询失败',
      },
      400,
    )
  }
})

export default trendsRoute
