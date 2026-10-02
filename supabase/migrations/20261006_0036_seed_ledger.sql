-- ====================================================================
-- Migration 0036: Seed ledger so catalog seeds stop resurrecting deletes
-- ====================================================================
-- Problem
-- -------
-- The catalog seed migrations (0002, 0022, 0024) guarded their inserts
-- with `WHERE NOT EXISTS (SELECT 1 FROM products WHERE <same name>)`.
-- That guard is name-based, not run-based: once an operator DELETES a
-- seeded product, the row is gone, the NOT EXISTS check passes again,
-- and the next re-run of those files silently RE-CREATED the deleted
-- product at its placeholder price/stock. Deleting a catalog item was
-- therefore not durable.
--
-- Fix
-- ---
-- Introduce public.seed_ledger, a tiny run-once marker table. Each
-- catalog seed now checks the ledger and returns early when its key is
-- already recorded, so a re-run is a no-op no matter what the operator
-- has since deleted. The per-row NOT EXISTS guards are kept as a
-- belt-and-braces duplicate check for genuinely fresh databases.
--
-- This migration also BACKFILLS the ledger so that re-running the old
-- seed files against an already-seeded database cannot resurrect the
-- test catalog that was just cleared.
-- ====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.seed_ledger (
  seed_key      TEXT PRIMARY KEY,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.seed_ledger IS
  'Run-once markers for catalog seed migrations. Prevents re-running a seed from recreating products an operator has deleted.';

-- Backfill: mark the three catalog seeds as already applied so replaying
-- 0002 / 0022 / 0024 on this database can no longer recreate seeded rows.
INSERT INTO public.seed_ledger (seed_key) VALUES
  ('20260716_0002_purple_boutique_catalog'),
  ('20260925_0022_seed_branch_starter_catalog'),
  ('20260927_0024_pos2_fireworks_catalog')
ON CONFLICT (seed_key) DO NOTHING;

COMMIT;

NOTIFY pgrst, 'reload schema';