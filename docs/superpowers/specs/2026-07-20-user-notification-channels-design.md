# User Notification Channels Design

## Summary

Replace the current global environment-variable Feishu push with authenticated, user-owned notification settings. Version one exposes only Feishu in the product UI, but stores and sends notifications through a channel registry so QQ Mail, Telegram, and other channels can be added without replacing the subscription, dispatch, encryption, or scheduling layers.

The same application supports Vercel and Cloudflare Workers deployments. The active deployment selects exactly one scheduler through environment configuration; schedulers never run in parallel for the same production database.

## Product Decisions

- Only signed-in users can create, edit, test, enable, or delete their own notification settings.
- Version one exposes one Feishu channel per user. Future channel types are not rendered in the UI yet.
- A user configures an Feishu Webhook, optional Feishu signing secret, enabled state, trend sources, period, per-source limit, and one daily China-time delivery slot.
- China time (`Asia/Shanghai`) is the only supported user-facing timezone in version one.
- Custom delivery times use five-minute increments.
- A user receives at most one successful scheduled digest per subscription per China calendar day.
- A visible “Send test message” action verifies the current stored Feishu credentials without changing the scheduled-delivery record.
- The existing global `FEISHU_BOT_*` configuration and `/api/notify/feishu/daily` global push are removed from the product path. User records are the only notification source.

## Deployment And Scheduling

### Shared Dispatcher

All deployments expose one protected server-only dispatch endpoint:

```text
POST /api/internal/notifications/dispatch
Authorization: Bearer <NOTIFICATION_DISPATCH_TOKEN>
```

The endpoint receives no user identifier. It queries the database for enabled subscriptions due in the current China-time slot, claims a delivery record atomically, sends the digest through the registered channel sender, and records the result.

The dispatcher uses these environment variables:

```bash
NOTIFICATION_DISPATCH_TOKEN=<random-long-secret>
NOTIFICATION_SCHEDULER_PROVIDER=vercel|cloudflare
NOTIFICATION_SCHEDULER_RESOLUTION_MINUTES=1440|5
NOTIFICATION_FIXED_DELIVERY_TIME=HH:mm # required when resolution is 1440
NOTIFICATION_ENCRYPTION_KEY_BASE64=<base64-encoded-32-byte-key>
```

`NOTIFICATION_SCHEDULER_PROVIDER` is explicit instead of inferred. This prevents an accidental dual deployment from silently starting two schedulers. The delivery table's unique key is an additional duplicate-send safeguard.

### Vercel Deployment

The Vercel deployment uses `vercel.json` to call the shared dispatch endpoint. Vercel Hobby Cron runs each job only once per day, so the free profile has a single platform-wide delivery time:

```bash
NOTIFICATION_SCHEDULER_PROVIDER=vercel
NOTIFICATION_SCHEDULER_RESOLUTION_MINUTES=1440
NOTIFICATION_FIXED_DELIVERY_TIME=09:00
```

The notification settings API returns scheduler capabilities to the UI. In this profile, the UI shows the platform delivery time as read-only and explains that user-selected daily times require a higher-frequency scheduler. It never saves a time value that the active scheduler cannot honour.

If a Vercel deployment later uses a plan that permits a higher-frequency cron, its configuration changes to a five-minute resolution and the UI enables the time selector without changing stored subscriptions.

### Cloudflare Workers Deployment

The Cloudflare deployment uses OpenNext for the existing Next.js app and a Worker Cron Trigger every five minutes. Its configuration is:

```bash
NOTIFICATION_SCHEDULER_PROVIDER=cloudflare
NOTIFICATION_SCHEDULER_RESOLUTION_MINUTES=5
NOTIFICATION_FIXED_DELIVERY_TIME=
```

The Worker Cron invokes the same shared dispatcher once per five-minute slot. The product UI enables the daily time selector and stores the selected five-minute China-time slot.

The existing MySQL database remains the system of record. Cloudflare deployment configuration must use a database connectivity option compatible with Workers, such as Hyperdrive or an approved edge-compatible Prisma/database adapter. The current Node-only Prisma configuration is not treated as Worker-compatible until verified under the OpenNext preview runtime.

### Scheduler Invariants

- Only one platform scheduler is enabled for a production database at a time.
- A five-minute scheduler only dispatches subscriptions whose configured time falls within the current five-minute slot.
- Dispatch can catch up for a missed scan for at most 15 minutes. Older missed sends are skipped rather than sending stale daily data many hours late.
- The dispatcher limits one run to 100 claimed subscriptions. Subsequent scheduler runs process the remaining due subscriptions.

## Data Model

### NotificationChannel

`NotificationChannel` stores an encrypted, user-owned channel credential and its health state.

```text
id
userId
type                 # "feishu" in v1; string for future channel types
encryptedConfig      # AES-256-GCM ciphertext, never returned to the client
encryptionIv
encryptionTag
configVersion        # starts at 1; enables future config migrations
isEnabled
lastTestedAt
lastTestStatus       # success | failed | null
lastTestMessage      # sanitized, no secret or full webhook
createdAt
updatedAt
```

`@@unique([userId, type])` enforces one Feishu channel per user in version one. A future multi-recipient feature can remove this constraint in a dedicated migration without changing subscription or sender contracts.

### NotificationSubscription

`NotificationSubscription` holds digest preferences separately from channel credentials.

```text
id
channelId
sources              # JSON array of registered TrendSource values
period               # today | week | month
limit                # integer from 1 through 10
scheduledMinute      # 0 through 1435, five-minute China-time slot
isEnabled
createdAt
updatedAt
```

Each Feishu channel has one subscription in version one. Keeping this table separate allows a future channel to have different schedules and content preferences while reusing the same encrypted credential record.

### NotificationDelivery

`NotificationDelivery` is the audit and idempotency record.

```text
id
subscriptionId
deliveryDate         # China calendar date, YYYY-MM-DD
scheduledMinute
status               # processing | sent | failed
startedAt
finishedAt
failureMessage       # sanitized provider error
createdAt
updatedAt
```

`@@unique([subscriptionId, deliveryDate])` prevents duplicate scheduled sends. The dispatcher inserts the `processing` record before sending; a unique-key collision means another invocation already owns or completed that day's delivery.

## Channel Architecture And Security

### Channel Registry

Each channel implementation conforms to one server-only contract:

```ts
interface NotificationChannelProvider<Config> {
  type: string
  validateConfig: (config: unknown) => Config
  getPublicSummary: (config: Config) => { label: string, maskedTarget: string }
  sendTest: (config: Config) => Promise<void>
  sendDigest: (config: Config, message: string) => Promise<void>
}
```

The registry initially contains only the Feishu provider. QQ Mail and Telegram are later added as new provider modules plus their UI form, without altering the dispatch loop or delivery table.

### Feishu Validation

- The Webhook must parse as HTTPS.
- The host must be `open.feishu.cn`.
- The path must start with `/open-apis/bot/v2/hook/`.
- The signing secret is optional and is never returned after save.
- The stored public summary masks the final webhook token.

The strict URL rule prevents the configuration page from being used as a server-side request forgery endpoint.

### Encryption

Channel configuration is encrypted before persistence with Web Crypto AES-256-GCM. The 32-byte key is supplied only through `NOTIFICATION_ENCRYPTION_KEY_BASE64`, allowing the same cryptography code to run in Node.js and Cloudflare Workers. Plaintext Webhooks and signing secrets are accepted only by authenticated write endpoints and are never written to logs, API responses, or client state.

## API And UI

### User API

All routes require the current Better Auth session and scope records by `userId`:

```text
GET    /api/notification-settings
PUT    /api/notification-settings/feishu
POST   /api/notification-settings/feishu/test
DELETE /api/notification-settings/feishu
GET    /api/notification-settings/capabilities
```

The GET response returns only masked target metadata, preferences, scheduler capabilities, and health state. The PUT response accepts complete Feishu credentials but never echoes them back.

### Settings Page

Add an authenticated route at `/settings/notifications`, linked from the signed-in user menu in the dashboard header.

The page contains:

- Feishu Webhook and optional signing-secret inputs.
- A switch for enabling scheduled pushes.
- Source multi-select, period selector, and per-source limit control.
- A daily delivery-time selector shown as editable only when scheduler capabilities support user-level times; otherwise it shows the configured platform time and explanatory copy.
- Save, test-send, and delete configuration actions.
- Last test and latest scheduled-delivery status, with sanitized errors.

Unauthenticated access redirects to the existing login flow instead of rendering credential inputs.

## Failure Handling And Observability

- User configuration validation errors return `400`; absent sessions return `401`.
- Dispatcher authentication failures return `401` without revealing scheduler configuration.
- A failed test updates `lastTestStatus` and a sanitized message but retains the prior saved configuration.
- Scheduled delivery failures create a failed delivery record; the next day's delivery remains eligible.
- Messages and errors never include the full Webhook, signing secret, encryption key, or dispatch token.
- Scheduler logs include subscription and delivery identifiers, never channel credentials.

## Testing

Add Vitest to the repository and cover the following before implementation is considered complete:

- Feishu URL validation accepts only approved Feishu Webhook URLs and rejects malformed/non-Feishu URLs.
- AES-GCM encryption round-trips in the supported runtime abstraction and produces different ciphertext for the same plaintext.
- Subscription preference parsing rejects unsupported sources, invalid periods, invalid limits, and non-five-minute time values.
- The channel registry dispatches Feishu test and digest sends through the provider contract.
- The scheduler due-time calculation handles the China timezone, five-minute slots, the 15-minute catch-up window, and Vercel's fixed-time capability.
- Delivery claiming does not send twice when a record for the same subscription and China calendar date already exists.
- Authenticated API routes do not expose plaintext credentials and reject cross-user access.

## Out Of Scope

- UI cards or forms for QQ Mail, Telegram, or other future channels.
- Multiple Feishu Webhooks per user.
- Weekly, workday-only, or multiple-daily schedules.
- Automatic migration of a MySQL host that is unreachable from Cloudflare Workers.
- Running Vercel and Cloudflare schedulers concurrently against one production database.
