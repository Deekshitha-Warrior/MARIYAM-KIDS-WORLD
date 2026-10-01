-- ====================================================================
-- Migration 0035: close the two gaps left after applying 0034 + 0032
--
-- Context
-- -------
-- Post-migration check reported:
--   OK      generate_barcode_value is a single canonical function
--   PROBLEM create_barcode_and_receive_stock "missing p_branch"
--   OK      adjust_inventory_stock derives v_branch
--   OK      complete_pos_sale_with_inventory has p_branch
--   OK      coupons_branch_code_upper_unique exists
--   PROBLEM coupons_code_upper_unique still exists
--   PROBLEM enforce_inventory_movement_branch_trigger missing
--
-- Gap A -- stale global coupon index (REAL, breaks the POS rule)
--   0029 intends to replace the global uniqueness on coupons with a
--   per-branch one, but the global index is still present alongside it.
--   Because coupons_code_upper_unique is UNIQUE on (UPPER(BTRIM(code)))
--   across the WHOLE table, a code can only ever exist once in total --
--   so the same coupon name cannot be created in POS 1 and POS 2.
--   This directly contradicts the required per-branch behaviour.
--
-- Gap B -- 0032's branch-integrity triggers (REAL)
--   0032 has no transaction wrapper, so if it aborted partway the earlier
--   statements persisted while the later ones (including every CREATE
--   TRIGGER) never ran. The movement trigger is the one that keeps
--   stock history, stock analytics and low-stock alarms scoped to the
--   correct counter, so it must exist.
--
-- Non-issue -- the barcode RPC check
--   The probe searched create_barcode_and_receive_stock for the literal
--   token "p_branch". That function never had such a parameter: like
--   adjust_inventory_stock, it derives the branch from the product row
--   (SELECT name, branch INTO v_prod_name, v_branch FROM public.products).
--   The body is already branch-aware. No change needed.
--
-- Idempotent: safe to re-run.
-- ====================================================================

-- 1. Re-assert per-branch coupon uniqueness -------------------------------
-- DROP INDEX cannot fail on existing duplicate rows, so this is safe
-- regardless of the data currently in the table.
DROP INDEX IF EXISTS public.coupons_code_upper_unique;

CREATE UNIQUE INDEX IF NOT EXISTS coupons_branch_code_upper_unique
  ON public.coupons (branch, UPPER(BTRIM(code)));

-- 2. Re-assert the 0032 branch-integrity triggers -------------------------
-- Same definitions as 0032, verbatim.

CREATE OR REPLACE FUNCTION public.enforce_variant_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_branch TEXT;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT branch INTO v_branch FROM public.products WHERE id = NEW.product_id;
  IF v_branch IS NOT NULL THEN
    NEW.branch := CASE WHEN v_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_variant_branch_trigger ON public.product_variants;
CREATE TRIGGER enforce_variant_branch_trigger
BEFORE INSERT OR UPDATE OF branch, product_id ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.enforce_variant_branch();


CREATE OR REPLACE FUNCTION public.enforce_barcode_registry_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_branch TEXT;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT branch INTO v_branch FROM public.products WHERE id = NEW.product_id;
  IF v_branch IS NOT NULL THEN
    NEW.branch := CASE WHEN v_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_barcode_registry_branch_trigger ON public.barcode_registry;
CREATE TRIGGER enforce_barcode_registry_branch_trigger
BEFORE INSERT OR UPDATE OF branch, product_id ON public.barcode_registry
FOR EACH ROW EXECUTE FUNCTION public.enforce_barcode_registry_branch();


CREATE OR REPLACE FUNCTION public.enforce_inventory_movement_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_branch TEXT;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    SELECT branch INTO v_branch FROM public.product_variants WHERE id = NEW.variant_id;
  END IF;

  IF v_branch IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT branch INTO v_branch FROM public.products WHERE id = NEW.product_id;
  END IF;

  -- Orphan rows (parent already deleted) keep whatever branch they carry.
  IF v_branch IS NOT NULL THEN
    NEW.branch := CASE WHEN v_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_inventory_movement_branch_trigger ON public.inventory_movements;
CREATE TRIGGER enforce_inventory_movement_branch_trigger
BEFORE INSERT OR UPDATE OF branch, product_id, variant_id ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.enforce_inventory_movement_branch();

NOTIFY pgrst, 'reload schema';
