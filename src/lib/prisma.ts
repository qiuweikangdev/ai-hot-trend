import process from 'node:process'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as {
  prisma?: PrismaClient
}

const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  throw new Error('缺少 DATABASE_URL 环境变量，请在 .env 中配置 MySQL 连接串后重启服务')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
