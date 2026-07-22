# Audit Fixes — 2026-07-16

Full audit (security / correctness / performance / DB / config). Most findings are
**already fixed in code**. This file tracks what still needs a human to run, because
it touches the production database, the host, or the build.

## 1. Run against the production DB (Supabase SQL editor)

These are DDL — apply them in the Supabase dashboard SQL editor (or via a trusted admin).

- **`scripts/rls-fix.sql`** — enables RLS on 9 tables currently exposed to the public
  anon key via PostgREST (`ProjectSpec/Stage/Amenity/Distance/Landmark/Faq/Image`,
  `PaymentPlan`, `UiString`). The app owns the tables and bypasses RLS, so this only
  closes the external REST hole. **Do this first — it's the one ERROR-level advisory.**
- **`scripts/db-indexes.sql`** — adds the missing indexes (all FK columns + `Lead`
  filter/sort columns). Mirrors the `@@index` lines now in `prisma/schema.prisma`, so a
  future `prisma db push` won't drop them. Safe (`CREATE INDEX IF NOT EXISTS`).

## 2. Set up on the cPanel host

- **`scripts/backup.sh`** — nightly `pg_dump` + uploads tarball with retention. Supabase
  free tier has **no automated backups** and uploaded media lives only on the host disk,
  so right now a single incident = total loss. Add to cron:
  ```
  0 2 * * *  /home/<user>/matrica-src/scripts/backup.sh >> /home/<user>/backup.log 2>&1
  ```
  Also pull the backups off-box periodically (they currently stay on the same host).
- **Verify no stale deploy cron.** `DEPLOY.md` references an old `*/5 * * * *`
  `host-deploy.sh --auto` cron that does `git reset --hard` + `next build` every 5 min —
  which the host can't run and which could clobber the artifact deploy. Check
  `crontab -l` on the host and remove it if present. Rotate the `~/deploy.log` /
  Passenger `stderr.log` (unrotated, growing).

## 3. Follow-ups that need a decision / verification (NOT auto-applied)

- **`Lead.assignedTo` → real FK.** It currently stores the agent's *display name*
  (mutable, not unique). Rename or delete an agent and every assigned lead is orphaned;
  reports split one agent into two. Proper fix = add `assigneeId` relation
  (`onDelete: SetNull`) + backfill `UPDATE "Lead" l SET "assigneeId"=u.id FROM
  "AdminUser" u WHERE u.name=l."assignedTo"` + update the leads dropdown/reports to use
  the id. Left out because it's a live-data migration + multi-file code change that
  should be done deliberately, not in a batch.
- **Baseline Prisma migrations.** There is no `_prisma_migrations` table — schema is
  managed by `db push`/MCP, so any hand-applied SQL is invisible drift and a future
  `migrate dev` would demand a destructive reset. Baseline once:
  ```
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/0_init/migration.sql
  npx prisma migrate resolve --applied 0_init   # against DIRECT_URL
  ```
  Then use `migrate deploy` going forward. Run against `DIRECT_URL`, not the dev server
  (dev server locks prisma).
- **Re-enable build type/lint checking.** `next.config.ts` still has
  `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` = `true`. Root cause is
  non-handler exports in route files (`src/app/api/site-settings/route.ts` exports
  `getSiteSettings`/`getRawSettings`, imported by `src/app/layout.tsx` and others). To
  fix: move those helpers into `src/lib/`, re-import in the route + consumers, then flip
  both flags to `false` and confirm `next build` is green **before** deploying. Not
  auto-flipped because an unverified flip would silently break the local-build deploy.
- **Image `<img>` → `next/image`/srcset.** Uploads are now downscaled+recompressed at
  upload time (biggest win, done). Swapping the raw `<img>` tags in Gallery/Projects/etc.
  to responsive `srcset` is a further gain but touches ~10 components — do it per-page
  with visual checks.

## Already fixed in code (no action needed)
Auth bypass on test-email/test-whatsapp; draft-project public leak; WhatsApp silent
mock-send; security headers + `poweredByHeader:false` + restricted image `remotePatterns`;
rate-limit XFF spoofing + map sweep; cache-bump-before-commit window; `/api/projects`(+slug)
and ui-strings/content-sections/social-links/payment-plans/chat-knowledge caching;
`/api/uploads` streaming + Range + 304; expired-session sweep on login; upload-time image
resize; 10 mass-assignment routes whitelisted; leads pagination/sort validation;
testimonial status default; duplicate-lead 409; reports date/timezone bugs; SMTP transporter
cache invalidation; menu header/footer fallback; bulk-WhatsApp per-lead variables; leads
page selection-clear + real search debounce; schema `@@index` coverage.
