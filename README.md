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

## User Feishu Notifications

Each signed-in user can configure one Feishu group robot at /settings/notifications.
The application stores the robot webhook and optional signing secret with AES-256-GCM
encryption. Responses return only a masked webhook target.

### User flow

1. Create a Feishu group bot and copy its webhook.
2. Open Notification settings after signing in.
3. Choose trend sources, period, result limit, enabled state, and delivery time.
4. Save, then use Send test to verify the robot.

A successful scheduled delivery is recorded per subscription and China calendar day, so
a retry or an accidental duplicate scheduler invocation cannot send the same daily digest twice.

### Vercel deployment

Use this profile when Vercel is the active scheduler for the production database:

~~~env
NOTIFICATION_SCHEDULER_PROVIDER=vercel
NOTIFICATION_FIXED_DELIVERY_TIME=09:00
CRON_SECRET=replace-with-a-long-random-token
NOTIFICATION_ENCRYPTION_KEY_BASE64=replace-with-base64-encoded-32-bytes
~~~

vercel.json calls /api/internal/notifications/dispatch/vercel daily at 01:00 UTC
(09:00 Asia/Shanghai). Vercel Hobby permits one Cron invocation per day, so every user
receives the digest at the fixed China time. The settings page shows this as read-only.

### Cloudflare Workers deployment

Use this profile when Cloudflare is the only active scheduler for the production database:

~~~env
NOTIFICATION_SCHEDULER_PROVIDER=cloudflare
NOTIFICATION_DISPATCH_TOKEN=replace-with-a-long-random-token
NOTIFICATION_ENCRYPTION_KEY_BASE64=replace-with-base64-encoded-32-bytes
~~~

Configure APP_BASE_URL in wrangler.jsonc to the deployed application URL, then set the
secret without placing it in the file:

~~~bash
npx wrangler secret put NOTIFICATION_DISPATCH_TOKEN
npx wrangler deploy
~~~

The Worker Cron runs every five minutes and calls
/api/internal/notifications/dispatch/cloudflare. Users can choose any five-minute slot
in Asia/Shanghai.

### Important deployment rule

For a given production database, enable exactly one scheduler: Vercel or Cloudflare.
The dispatcher compares the incoming scheduler identifier with
NOTIFICATION_SCHEDULER_PROVIDER and rejects the other platform. This prevents duplicate
delivery during a migration.

### Required secrets

Generate the encryption key once and retain it for the lifetime of stored settings:

~~~bash
openssl rand -base64 32
~~~

Changing this key makes existing encrypted robot credentials unreadable. Do not expose
NOTIFICATION_ENCRYPTION_KEY_BASE64, NOTIFICATION_DISPATCH_TOKEN, or CRON_SECRET in
browser variables.

Feishu group bots do not require a paid application API plan for standard webhook messages;
hosting, database, and platform quotas remain separate concerns.