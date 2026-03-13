# AGENTS.md
Repository guidance for agentic coding assistants working in `ai-hot-trend`.

## Project Snapshot
- Stack: Next.js App Router + React 19 + TypeScript + Hono API + Prisma + MySQL.
- Package manager: `pnpm` (lockfile + Husky hooks use pnpm).
- Lint/format: ESLint flat config via `@antfu/eslint-config` (`formatters: true`).
- Auth: Better Auth with Prisma adapter and GitHub/Google providers.
- Styling: Tailwind CSS v4 + shadcn-style UI primitives.
- Path alias: `@/*` -> `src/*`.

## Cursor / Copilot Rule Files
- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.
- This `AGENTS.md` is the primary guidance file.

## Build / Lint / Test Commands

### Core commands
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Start production server: `pnpm start`
- Lint whole repository: `pnpm lint`
- Lint with autofix: `pnpm lint:fix`

### Prisma and DB commands
- Generate client: `pnpm prisma:generate`
- Apply dev migration: `pnpm prisma:migrate`
- Open Prisma Studio: `pnpm prisma:studio`

### Commit / hook commands
- Run staged checks manually: `pnpm lint-staged`
- Use commit helper: `pnpm commit`

### Test status in this repo
- There is no dedicated test framework configured right now.
- `package.json` has no `test` script.
- No Jest/Vitest/Playwright config or test files were found.

### Running a single test
- Not available yet because no test runner is configured.
- Closest single-target validation is linting one file:
  - `pnpm eslint src/path/to/file.ts`
- For broader verification, run:
  - `pnpm lint`
  - `pnpm build`

## Coding Style and Conventions
Conventions below are inferred from current code and config; follow them unless user asks otherwise.

### Codebase map
- App routes/UI entry: `src/app/*`
- API entry for Hono: `src/app/api/[[...route]]/route.ts`
- HTTP routes: `src/server/routes/*`
- Auth setup: `src/server/auth/*`
- Domain modules: `src/modules/trends/*`, `src/modules/favorites/*`
- Shared utilities: `src/lib/*`
- Reusable UI primitives: `src/components/ui/*`

### Language and modules
- Use TypeScript (`.ts`, `.tsx`) for app and server code.
- Use ESM imports/exports; avoid CommonJS.
- Prefer named exports for reusable units.
- Keep default exports mostly for route/component entry files.

### Imports
- Prefer `import type` for type-only imports.
- Keep imports grouped in this order:
  1. Node built-ins (`node:*`)
  2. External packages
  3. Internal alias imports (`@/...`)
  4. Relative imports
- Prefer `@/` alias over deep relative paths.

### Formatting
- ESLint is source of truth for lint + formatting.
- Prettier is disabled in workspace settings.
- Use single quotes.
- Omit semicolons.
- Keep trailing commas in multiline literals/calls.
- Prefer readability over dense inline logic.
- After non-trivial edits, run `pnpm lint:fix`.

### React / Next.js
- Use function components with explicit props interfaces.
- Keep component names in PascalCase.
- Keep hook names prefixed with `use`.
- Keep filenames kebab-case (for example `trend-dashboard-header.tsx`).
- Use `'use client'` only where required.
- Keep App Router `page.tsx` / `layout.tsx` light and move logic to modules/components.

### Types and validation
- Prefer explicit interfaces/types for request/response payloads.
- Model domain enums with `as const` arrays + derived union types.
- Validate and normalize untrusted input at route boundaries.
- Use `unknown` at boundaries and narrow with runtime checks.
- Avoid `any` unless unavoidable.

### Naming
- Variables/functions: `camelCase`.
- Types/interfaces/classes/components: `PascalCase`.
- True constants: `UPPER_SNAKE_CASE`.
- Use descriptive names (`parseTrendRequestQuery`, `getEnabledProviderMap`).

### Error handling and API shape
- Throw `Error` with clear messages from parsing/service logic.
- In route handlers, return structured failures:
  - `{ success: false, message: string }`
- Use clear HTTP status codes (`400`, `401`, `404`, `500`, `502`, etc.).
- In client fetch wrappers:
  - check `response.ok`
  - parse typed JSON
  - throw meaningful errors for UI state handling
- Preserve auth-aware behavior (for example handling `401` as unauthenticated).

### Server/data architecture
- Keep `src/server/routes/*` thin: parse -> call service -> map response.
- Keep business logic in `src/modules/**/service.ts`.
- Keep persistence in repository classes (`Prisma...Repository`).
- Reuse singleton Prisma client from `src/lib/prisma.ts`.
- Use existing cache patterns (for example `MemoryCache`) for expensive fetches.

### UI and styling
- Reuse primitives in `src/components/ui/*`.
- Use `cn()` helper for className composition.
- Keep current visual language (soft gradients, subtle borders, slate/amber/cyan accents).
- Keep responsive behavior mobile-first.

### Comments
- Keep comments sparse and high-signal.
- Comment non-obvious intent/invariants only.
- Avoid comments that restate obvious code.

## Validation Checklist
Before finishing changes, run what is relevant:
1. `pnpm lint`
2. `pnpm build` (for runtime/type/route-impacting changes)
3. `pnpm prisma:generate` (if Prisma schema changed)

If a command cannot run (missing env/db/etc.), mention that explicitly.

## Commit and Safety Expectations
- Pre-commit hook runs `pnpm lint-staged`.
- Commit-msg hook runs commitlint conventional rules.
- Conventional commit types configured: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Prefer minimal diffs; do not rename/move files unless needed.
- Do not commit `.env` secrets or generated build artifacts (for example `.next/`).
- Preserve existing Chinese/English user-facing copy style where touched.
