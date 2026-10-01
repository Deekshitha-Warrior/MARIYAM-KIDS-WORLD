-- Keep every operational record and its taxonomy independent per POS branch.
-- Legacy shared rows belong to POS 1, matching the original branch-split rule.
BEGIN;

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'pos1';
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'pos1';
ALTER TABLE public.expense_categories DROP CONSTRAINT IF EXISTS uq_expense_category_name;

DO $$ BEGIN
  ALTER TABLE public.coupons ADD CONSTRAINT coupons_branch_check CHECK (branch IN ('pos1', 'pos2'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.expense_categories ADD CONSTRAINT expense_categories_branch_check CHECK (branch IN ('pos1', 'pos2'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP INDEX IF EXISTS public.coupons_code_upper_unique;
CREATE UNIQUE INDEX IF NOT EXISTS coupons_branch_code_upper_unique
  ON public.coupons (branch, UPPER(BTRIM(code)));
CREATE INDEX IF NOT EXISTS coupons_branch_active_idx ON public.coupons(branch, is_active, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS expense_categories_branch_name_unique
  ON public.expense_categories(branch, LOWER(BTRIM(name)));
CREATE INDEX IF NOT EXISTS expense_categories_branch_active_idx ON public.expense_categories(branch, is_active);

-- Seed a separate POS 2 expense taxonomy while leaving POS 1's existing
-- names and IDs intact.
INSERT INTO public.expense_categories (name, is_active, branch)
SELECT seed.name, TRUE, 'pos2'
FROM (VALUES ('Maintenance'), ('Marketing'), ('Other'), ('Rent'), ('Salaries'), ('Supplies')) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories c
  WHERE c.branch = 'pos2' AND LOWER(BTRIM(c.name)) = LOWER(BTRIM(seed.name))
);

-- Existing checkout RPCs were written before coupons had a branch. Patch
-- each installed checkout routine so usage is charged only to its POS coupon.
DO $$
DECLARE
  r RECORD;
  v_definition TEXT;
  v_updated TEXT;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND pg_get_functiondef(p.oid) ILIKE '%UPDATE public.coupons%'
      AND pg_get_functiondef(p.oid) ILIKE '%p_coupon_code%'
      AND pg_get_functiondef(p.oid) ILIKE '%v_branch%'
  LOOP
    v_definition := pg_get_functiondef(r.oid);
    v_updated := replace(
      v_definition,
      'WHERE UPPER(BTRIM(code)) = UPPER(BTRIM(p_coupon_code))',
      'WHERE UPPER(BTRIM(code)) = UPPER(BTRIM(p_coupon_code)) AND branch = v_branch'
    );
    IF v_updated <> v_definition THEN EXECUTE v_updated; END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
