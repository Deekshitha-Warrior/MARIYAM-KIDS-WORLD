-- Split 1 of 3: coupon uniqueness must be per-branch, not global.
-- Two plain statements, no plpgsql. Run this on its own.

DROP INDEX IF EXISTS public.coupons_code_upper_unique;

CREATE UNIQUE INDEX IF NOT EXISTS coupons_branch_code_upper_unique
  ON public.coupons (branch, UPPER(BTRIM(code)));
