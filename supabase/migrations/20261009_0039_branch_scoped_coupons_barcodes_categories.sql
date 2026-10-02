-- ===================================================================
-- Migration 0039: Finish POS 1 / POS 2 isolation for coupons,
--                 barcodes and categories
-- ===================================================================
--
-- 1. COUPON USAGE WAS CHARGED TO BOTH COUNTERS
--    0029 lets each POS own a coupon with the same code, and patched the
--    checkout RPCs to bump usage only on the selling counter's coupon
--    (`... AND branch = v_branch`). 0034 then re-created
--    complete_pos_sale_with_inventory from an older body that lacks that
--    clause, so a POS 1 sale with code DIWALI10 also counts against (and
--    can exhaust the usage limit of) POS 2's DIWALI10.
--    Fix: re-apply the branch clause to every installed checkout routine
--    that has a v_branch, whatever body is live, then assert it stuck.
--
-- 2. BARCODES WERE UNIQUE ACROSS BOTH COUNTERS
--    barcode_registry.barcode_value is UNIQUE on its own, so:
--      - the same manufacturer barcode cannot be registered in both POS;
--      - the product editor's upsert (ON CONFLICT barcode_value) re-points
--        the OTHER counter's registry row at this counter's product.
--    Fix: uniqueness becomes (branch, barcode_value). The app's upsert is
--    switched to that key in the same change.
--
-- 3. CATEGORY NAMES WERE UNIQUE ACROSS BOTH COUNTERS
--    categories.name_en is UNIQUE on its own (from 0001), so once one POS
--    has a category, the other POS cannot create one with the same name --
--    including the automatic 'Unregistered' category used for ad-hoc
--    items, which made unregistered billing fail on the second counter.
--    Fix: uniqueness becomes (branch, lower(trim(name_en))), matching the
--    per-branch rule already used for coupons and expense categories.
--
-- Deploy order: apply this migration BEFORE deploying the app build that
-- upserts barcodes on (branch, barcode_value).
--
-- SAFE / IDEMPOTENT: every step is guarded and re-running is a no-op.
-- ===================================================================

BEGIN;

-- 1. Coupon usage stays on the selling counter's coupon ------------------

DO $$
DECLARE
  r RECORD;
  v_def TEXT;
  v_new TEXT;
  c_unscoped CONSTANT TEXT :=
    'WHERE UPPER\(BTRIM\(code\)\) = UPPER\(BTRIM\(p_coupon_code\)\)(?! AND branch = v_branch)';
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosrc ILIKE '%UPDATE public.coupons%'
      AND p.prosrc ILIKE '%v_branch%'
  LOOP
    v_def := pg_get_functiondef(r.oid);
    v_new := regexp_replace(v_def, c_unscoped, '\& AND branch = v_branch', 'g');
    IF v_new <> v_def THEN
      EXECUTE v_new;
    END IF;
  END LOOP;

  -- Fail loudly rather than leave a counter-crossing checkout installed.
  FOR r IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosrc ILIKE '%UPDATE public.coupons%'
      AND p.prosrc ILIKE '%v_branch%'
      AND p.prosrc ~ c_unscoped
  LOOP
    RAISE EXCEPTION 'Coupon usage in %() is still shared between POS 1 and POS 2', r.proname;
  END LOOP;

  IF to_regprocedure('public.complete_pos_sale_with_inventory(text,text,text,jsonb,numeric,text,text,text,numeric,numeric,numeric,text,numeric,text,numeric,text,jsonb,numeric,boolean,text,text,timestamptz,text)') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_proc
       WHERE oid = 'public.complete_pos_sale_with_inventory(text,text,text,jsonb,numeric,text,text,text,numeric,numeric,numeric,text,numeric,text,numeric,text,jsonb,numeric,boolean,text,text,timestamptz,text)'::regprocedure
         AND prosrc ILIKE '%p_coupon_code)) AND branch = v_branch%'
     ) THEN
    RAISE EXCEPTION 'complete_pos_sale_with_inventory() does not scope coupon usage to its POS branch';
  END IF;
END $$;

-- 2 & 3. Per-branch uniqueness for barcodes and category names ------------
-- New per-branch indexes are created first, so uniqueness is never absent.

CREATE UNIQUE INDEX IF NOT EXISTS barcode_registry_branch_value_unique
  ON public.barcode_registry (branch, barcode_value);

CREATE UNIQUE INDEX IF NOT EXISTS categories_branch_name_unique
  ON public.categories (branch, LOWER(BTRIM(name_en)));

-- Drop the old single-column unique constraint / index on
-- barcode_registry(barcode_value) and categories(name_en), whatever it is
-- named on this database.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT i.indexrelid::regclass AS index_name,
           i.indrelid::regclass  AS table_name,
           c.conname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
    LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid AND c.contype = 'u'
    WHERE i.indisunique
      AND NOT i.indisprimary
      AND i.indnatts = 1
      AND i.indexprs IS NULL
      AND (
        (i.indrelid = 'public.barcode_registry'::regclass AND a.attname = 'barcode_value')
        OR (i.indrelid = 'public.categories'::regclass AND a.attname = 'name_en')
      )
  LOOP
    IF r.conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.table_name, r.conname);
    ELSE
      EXECUTE format('DROP INDEX %s', r.index_name);
    END IF;
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
