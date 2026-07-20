This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Feishu Daily Trend Push

This project now supports daily Feishu bot push via:

- API endpoint: `GET/POST /api/notify/feishu/daily`
- Cron schedule: configured in `vercel.json`

### 1) Environment variables

Add the following to `.env`:

```bash
FEISHU_BOT_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
FEISHU_BOT_SECRET=
FEISHU_PUSH_CRON_TOKEN=replace-with-a-long-random-token
FEISHU_DAILY_SOURCES=ai,github,npm,weibo,zhihu
FEISHU_DAILY_PERIOD=today
FEISHU_DAILY_LIMIT=5
FEISHU_DAILY_TIMEZONE=Asia/Shanghai
```

Notes:

- `FEISHU_BOT_SECRET` is optional. Fill it only if the Feishu bot enables signature verification.
- In production, route auth requires `FEISHU_PUSH_CRON_TOKEN` or `CRON_SECRET`.

### 2) Trigger manually

```bash
curl -X POST "http://localhost:3000/api/notify/feishu/daily" \
  -H "Authorization: Bearer replace-with-a-long-random-token"
```

### 3) Daily cron

`vercel.json` contains:

- `path`: `/api/notify/feishu/daily`
- `schedule`: `0 1 * * *` (UTC), which is 09:00 in `Asia/Shanghai`.
