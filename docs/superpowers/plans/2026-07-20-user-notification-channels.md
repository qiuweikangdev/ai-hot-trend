# User Notification Channels Implementation Plan

> **For Codex:** Implement this plan task-by-task using test-driven development. Run each new test first and observe its failure before adding the corresponding production code.

**Goal:** Let each signed-in user configure one Feishu robot, select one daily China-time delivery slot, and receive their selected trend sources through the scheduler native to the active deployment target (Vercel Cron or Cloudflare Workers Cron).

**Architecture:** Persist user-owned encrypted channel credentials and one subscription in MySQL. A shared authenticated dispatcher finds due subscriptions, atomically claims one China-day delivery record per subscription, builds the existing trend digest, and delegates to a channel-provider registry. Vercel Cron invokes that dispatcher on the Hobby-compatible daily schedule, while Cloudflare invokes the same dispatcher from a five-minute Worker Cron; a capability endpoint makes the UI enforce the active platform's timing limits.

**Tech Stack:** Next.js App Router, Hono, Better Auth, Prisma/MySQL, Web Crypto AES-256-GCM, React 19, Tailwind, Vitest, Vercel Cron, OpenNext/Cloudflare Workers.

## Task 1: Add a focused test runner and notification test scaffolding

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/modules/notifications/__tests__/test-helpers.ts`

1. Add `vitest` as a development dependency and scripts `test` and `test:watch`.
2. Configure aliases so notification tests can import `@/` modules.
3. Add a trivial first test and run `pnpm test --run` to prove the runner exits successfully.
4. Keep Node test environment because the new modules are server-only.

## Task 2: Define notification domain types, parsing, and China-time due logic

**Files:**
- Create: `src/modules/notifications/types.ts`
- Create: `src/modules/notifications/subscription.ts`
- Create: `src/modules/notifications/due.ts`
- Create: `src/modules/notifications/__tests__/subscription.test.ts`
- Create: `src/modules/notifications/__tests__/due.test.ts`

1. Write failing tests covering source deduplication, allowed periods, a `1..10` item limit, and a five-minute scheduled minute range.
2. Implement a single parser that normalizes all request-boundary subscription input and returns explicit errors for invalid input.
3. Write failing due-time tests for `Asia/Shanghai`: exact five-minute slot, no duplicate slot inside the same China day, fifteen-minute catch-up window, and fixed-time Vercel behavior.
4. Implement `getChinaDateKey`, `getChinaMinuteOfDay`, and `isSubscriptionDue` using `Intl.DateTimeFormat`, never the host machine timezone.
5. Run only these tests with `pnpm test --run src/modules/notifications`.

## Task 3: Add encrypted per-user notification persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/modules/notifications/crypto.ts`
- Create: `src/modules/notifications/repository.ts`
- Create: `src/modules/notifications/__tests__/crypto.test.ts`
- Create: `src/modules/notifications/__tests__/repository.test.ts`

1. Add `NotificationChannel`, `NotificationSubscription`, and `NotificationDelivery` models with the unique constraints defined in the approved specification.
2. Use a string channel type for forward compatibility; persist JSON source arrays and delivery status values compatible with MySQL.
3. Create failing AES-GCM tests: encrypt/decrypt round trip, random IV produces different ciphertext, tampering fails, and an invalid key configuration fails closed.
4. Implement Web Crypto AES-256-GCM with `NOTIFICATION_ENCRYPTION_KEY_BASE64`; never serialize plain credentials into repository records or public DTOs.
5. Add repository methods for a user-scoped channel/subscription lookup, atomic create-or-update, clearing a channel, query of enabled candidates, and unique delivery claiming. Repository tests should mock Prisma and prove duplicate claims are not dispatched twice.
6. Generate and apply the Prisma migration, then run `pnpm prisma:generate`.

## Task 4: Build a provider registry and Feishu implementation

**Files:**
- Create: `src/modules/notifications/providers/types.ts`
- Create: `src/modules/notifications/providers/registry.ts`
- Create: `src/modules/notifications/providers/feishu.ts`
- Create: `src/modules/notifications/__tests__/providers/feishu.test.ts`
- Create: `src/modules/notifications/__tests__/providers/registry.test.ts`

1. Write failing Feishu validation tests that accept only `https://open.feishu.cn/open-apis/bot/v2/hook/...` and reject other hosts, non-HTTPS URLs, and malformed paths.
2. Implement a generic `NotificationChannelProvider` registry with `validateConfig`, `getPublicSummary`, `sendTest`, and `sendDigest` methods.
3. Port the existing Feishu signing and card sending logic behind the provider, including safe network failure messages and a masked URL summary.
4. Write a registry test that verifies unknown types fail cleanly and Feishu resolves.
5. Remove usage of the old global `FEISHU_BOT_*` configuration after the new provider tests pass.

## Task 5: Implement authenticated settings APIs

**Files:**
- Create: `src/modules/notifications/service.ts`
- Create: `src/server/routes/notification-settings.ts`
- Modify: `src/server/app.ts`
- Create: `src/server/routes/__tests__/notification-settings.test.ts`
- Modify: `.env.example`

1. Write route tests for unauthenticated rejection, per-user isolation, no plaintext secret in every response, invalid Feishu configuration, save/read/test/delete, and platform capability response.
2. Implement the settings service: authenticate with the existing Better Auth Hono pattern, validate input, encrypt before storage, and only return masked provider summaries.
3. Expose `GET /api/notification-settings`, `GET /api/notification-settings/capabilities`, `PUT /api/notification-settings/feishu`, `POST /api/notification-settings/feishu/test`, and `DELETE /api/notification-settings/feishu`.
4. Add `NOTIFICATION_ENCRYPTION_KEY_BASE64`, `NOTIFICATION_SCHEDULER_PROVIDER`, `NOTIFICATION_SCHEDULER_RESOLUTION_MINUTES`, `NOTIFICATION_FIXED_DELIVERY_TIME`, and `NOTIFICATION_DISPATCH_TOKEN` to `.env.example` without values.
5. Run the route and module tests.

## Task 6: Implement shared dispatcher and delivery idempotency

**Files:**
- Create: `src/modules/notifications/dispatcher.ts`
- Create: `src/server/routes/internal-notifications.ts`
- Create: `src/modules/notifications/__tests__/dispatcher.test.ts`
- Create: `src/server/routes/__tests__/internal-notifications.test.ts`
- Modify: `src/server/app.ts`

1. Write failing tests for missing/incorrect bearer token, wrong scheduler provider, no due subscriptions, duplicate delivery records, failure marking, and continuation after one recipient fails.
2. Build one digest per claimed subscription using the existing trend source provider/service path and each subscription's selected source/period/limit options.
3. Create delivery records before external sends using the unique `(subscriptionId, deliveryDate)` key. Mark results `sent` or `failed` with non-sensitive failure messages.
4. Expose only `POST /api/internal/notifications/dispatch`, protected by constant-time Bearer token comparison and provider selection.
5. Enforce a 100-subscription dispatch batch and a fifteen-minute late window for five-minute schedules.
6. Run dispatcher tests and targeted lint.

## Task 7: Build the Feishu settings page

**Files:**
- Create: `src/app/settings/notifications/page.tsx`
- Create: `src/components/notifications/notification-settings-page.tsx`
- Create: `src/components/notifications/feishu-settings-form.tsx`
- Modify: `src/components/trends/dashboard/trend-dashboard-header.tsx`
- Create: `src/components/notifications/__tests__/feishu-settings-form.test.tsx`

1. Write component tests for Vercel Hobby fixed-time rendering, custom 5-minute selector, save payload normalization, and test-button status feedback.
2. Create the signed-in settings route and redirect anonymous users using the existing auth conventions.
3. Add a single “通知设置” entry to the signed-in profile menu.
4. Implement only the Feishu UI: webhook URL, optional signing secret, enabled state, source multi-select, period, item limit, daily China-time selector, save/test/delete, masked target, and last test/delivery status.
5. Fetch capabilities first. When fixed time is returned, show it read-only and explain it is imposed by the deployment scheduler; do not submit unsupported custom times.
6. Keep provider-specific UI isolated so future QQ email/Telegram forms can be registered without restructuring the page.
7. Run component tests and lint all touched TS/TSX files.

## Task 8: Add Vercel and Cloudflare scheduler adapters

**Files:**
- Modify: `vercel.json`
- Create: `scripts/dispatch-notifications.mjs`
- Create: `scripts/cloudflare-scheduled-dispatch.mjs`
- Create: `wrangler.jsonc`
- Create: `src/worker.ts`
- Modify: `package.json`
- Modify: `README.md`

1. Write a small adapter test or script-level unit test that proves both adapters send the same authenticated dispatcher request and set the provider header/body explicitly.
2. Set Vercel's native cron to one daily run (`0 1 * * *` UTC), configure the Vercel profile as `vercel` + `1440` + fixed China time, and document that this is the only supported free/Hobby cadence.
3. Add a Cloudflare Worker scheduled handler with `crons: ["*/5 * * * *"]`; it invokes the same dispatcher with `cloudflare` + `5`.
4. Add OpenNext/Workers deployment dependencies and configuration only after verifying the app's server entry and database driver path are Worker-compatible. If the current Prisma/MySQL stack cannot run in a Worker without Hyperdrive/adapter changes, leave a clear deploy-time guard and documentation rather than falsely advertising a working migration.
5. Document the strict one-scheduler-per-production-database rule and separate environment variable values for each platform.

## Task 9: Remove the legacy global delivery path and update docs

**Files:**
- Delete: `src/server/notify/env.ts`
- Delete: `src/server/notify/feishu.ts`
- Delete: `src/server/routes/notify.ts`
- Modify: `src/server/app.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/*feishu*.md` (find existing root documentation and consolidate)

1. Delete the global environment-driven route after the per-user dispatcher is covered by tests.
2. Update user/admin deployment docs with the end-to-end flow, Vercel and Cloudflare exact configuration, Vercel Hobby timing limitation, required encryption key generation, and no plaintext-secret guarantees.
3. Add self-hosted/systemd guidance only as an explicit third adapter option and keep it disabled by default.
4. Ensure the docs state Feishu group bots are free subject to Feishu platform limits, while hosting/database costs remain separate.

## Task 10: Validate and prepare the change

**Files:**
- All changed files

1. Run `pnpm test --run`.
2. Run `pnpm lint` and resolve feature-related failures; record unrelated pre-existing failures precisely if they persist.
3. Run `pnpm prisma:generate`.
4. Run `pnpm build`; if Windows Prisma engine generation fails again, capture that it is the existing EPERM rename issue and validate the TypeScript paths through lint/test output.
5. Inspect `git diff --check`, `git status --short`, and the final diff to confirm no `.env` secret or unrelated file is included.
