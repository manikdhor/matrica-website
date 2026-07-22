-- Enable Row Level Security on the 9 public tables currently exposed to
-- PostgREST with NO RLS (Supabase advisor: rls_disabled_in_public, ERROR level).
--
-- The app connects as the table owner (DATABASE_URL / DIRECT_URL), and the
-- table owner BYPASSES RLS, so enabling RLS with no policy does NOT affect the
-- application — it only closes the anon/authenticated PostgREST REST surface
-- (the public anon key can otherwise read these tables directly, bypassing the
-- app entirely). This matches the existing "RLS on, no policy = deny external"
-- posture already applied to the other ~30 tables.
--
-- Apply in the Supabase SQL editor (or via MCP apply_migration). Safe to re-run.

ALTER TABLE public."ProjectSpec"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectStage"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectAmenity"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectDistance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectLandmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectFaq"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectImage"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentPlan"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UiString"        ENABLE ROW LEVEL SECURITY;

-- Verify afterwards: every public table should now show relrowsecurity = true.
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
--   ORDER BY relrowsecurity, relname;
