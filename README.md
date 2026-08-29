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

## User Notifications

Each signed-in user can configure one Feishu group robot or one QQ email channel at
/settings/notifications. The application stores channel credentials with AES-256-GCM
encryption. Responses return only masked channel targets.

### User flow

1. Create a Feishu group bot or prepare a QQ mailbox with SMTP enabled.
2. Open Notification settings after signing in and choose a channel.
3. For QQ Mail, enter the mailbox address, recipient address, and the QQ SMTP
   authorization code (not the login password).
4. Choose trend sources, period, result limit, enabled state, and delivery time.
5. Save, then use Send test to verify the channel.

QQ Mail uses the secure `smtp.qq.com:465` SMTP endpoint. The authorization code is
created in QQ Mail settings under the account's POP3/IMAP/SMTP service options. It is
encrypted with the rest of the channel configuration and is never returned to the UI.

A successful scheduled delivery is recorded per subscription and China calendar day, so
a retry or an accidental duplicate scheduler invocation cannot send the same daily digest twice.

### Local development

Local development uses the local profile automatically when NOTIFICATION_SCHEDULER_PROVIDER is
unset. When running `pnpm dev`, the Next.js server starts an in-process scheduler that checks
for due notifications every minute. Keep the development server running for automatic delivery;
this local scheduler is not enabled by production builds.

~~~env
NOTIFICATION_ENCRYPTION_KEY_BASE64=replace-with-base64-encoded-32-bytes
NOTIFICATION_DISPATCH_TOKEN=local-test-token
~~~

Use the Send test button after entering a channel configuration to verify delivery
immediately. To exercise the scheduled-dispatch path manually, choose an upcoming
five-minute slot and call:

~~~powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/internal/notifications/dispatch/local" -Headers @{ Authorization = "Bearer local-test-token" }
~~~

The local profile is only for development. Do not use it for a deployed environment.
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

When connecting this repository with Cloudflare Workers Builds, configure the build settings
as follows:

- Build command: leave empty; this repository's Wrangler entry is the scheduler Worker, not the Next.js application build.
- Deploy command: `npx wrangler deploy --config wrangler.jsonc`
- Version command: `npx wrangler versions upload --config wrangler.jsonc`
- Root directory: `/`

Set `APP_BASE_URL` to the public URL of the deployed Next.js application, not the Worker URL
and not `localhost`. Set `NOTIFICATION_DISPATCH_TOKEN` as a Worker secret. The Next.js
application itself must use `NOTIFICATION_SCHEDULER_PROVIDER=cloudflare`, the same dispatch
token, and the same `NOTIFICATION_ENCRYPTION_KEY_BASE64`.

The current Wrangler file deploys the five-minute scheduler Worker only. It does not deploy
the Next.js application or move its Node.js/MySQL runtime into Cloudflare Workers.
Opening the Worker `workers.dev` URL only shows its scheduler health response; use the
application URL from `APP_BASE_URL` to open the product UI.

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
