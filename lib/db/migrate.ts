import { execSync } from 'node:child_process'
import process from 'node:process'
import 'dotenv/config'

async function runMigrate() {
  if (!process.env.DATABASE_URL) {
    console.warn('[db:migrate] DATABASE_URL not defined, skipping migrations')
    process.exit(0)
  }

  console.warn('[db:migrate] running prisma migrate deploy...')

  const start = Date.now()
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  })

  const end = Date.now()
  console.warn('[db:migrate] completed in', end - start, 'ms')
  process.exit(0)
}

runMigrate().catch((error) => {
  console.error('[db:migrate] migration failed')
  console.error(error)
  process.exit(1)
})
