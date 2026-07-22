-- ============================================================================
-- Lead.assignedTo → AdminUser FK migration (pending audit item, 2026-07-16)
--
-- Today Lead."assignedTo" stores the AdminUser DISPLAY NAME. The sales-role
-- ownership scoping added on 2026-07-16 matches on that name, so renaming an
-- admin user silently orphans their leads. This script converts the column to
-- store AdminUser.id with a real foreign key.
--
-- ⚠ DEPLOY ORDER — DO NOT run this against the live database while the
--   current (name-based) application code is running. The running code
--   displays assignedTo raw and filters by name; converting values to ids
--   breaks assignment display/filtering until the id-based code ships.
--   Correct sequence:
--     1. Update app code to read/write AdminUser.id in assignedTo everywhere
--        (leads list/detail/kanban/export/import UI + reports team grouping +
--        admin-auth leadScopeWhere to match session.userId instead of name).
--     2. Put the site briefly in maintenance / low-traffic window.
--     3. Run this script (single transaction).
--     4. Deploy the new build.
--
-- Run in the Supabase SQL editor (project jgfvydodkjtdabinvztf) or via psql.
-- ============================================================================

BEGIN;

-- 1. Preview what will happen (run standalone first if unsure):
--    Names that match exactly one active-or-inactive AdminUser get converted;
--    anything else (typos, deleted users, legacy free-text) becomes NULL.
-- SELECT l."assignedTo" AS stored_name, u.id AS matched_user, COUNT(*)
-- FROM "Lead" l LEFT JOIN "AdminUser" u ON u.name = l."assignedTo"
-- WHERE l."assignedTo" IS NOT NULL
-- GROUP BY 1, 2 ORDER BY 4 DESC;

-- 2. Keep a backup of the raw name values for rollback / reconciliation.
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedToNameBackup" TEXT;
UPDATE "Lead" SET "assignedToNameBackup" = "assignedTo"
WHERE "assignedTo" IS NOT NULL AND "assignedToNameBackup" IS NULL;

-- 3. Convert name → id (ambiguous/unknown names become NULL = unassigned).
UPDATE "Lead" l
SET "assignedTo" = (
  SELECT u.id FROM "AdminUser" u WHERE u.name = l."assignedTo"
)
WHERE l."assignedTo" IS NOT NULL;

-- 4. Add the FK. ON DELETE SET NULL so removing a user unassigns their leads
--    instead of blocking the delete.
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_assignedTo_fkey"
  FOREIGN KEY ("assignedTo") REFERENCES "AdminUser"(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

-- After verifying in production, matching Prisma schema change:
--   model Lead {
--     assignedTo   String?
--     assignedUser AdminUser? @relation(fields: [assignedTo], references: [id], onDelete: SetNull)
--   }
--   model AdminUser {
--     assignedLeads Lead[]
--   }
-- then `npx prisma db pull` / regenerate client.
--
-- Rollback (before dropping the backup column):
--   ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_assignedTo_fkey";
--   UPDATE "Lead" SET "assignedTo" = "assignedToNameBackup";
-- Cleanup once stable:
--   ALTER TABLE "Lead" DROP COLUMN "assignedToNameBackup";
