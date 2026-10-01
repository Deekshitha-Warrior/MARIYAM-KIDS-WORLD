-- ====================================================================
-- Migration 0032: POS branch isolation integrity (backend guarantee)
--
-- App-level queries are already branch-filtered, but nothing in the
-- database stopped a client from writing a child row (variant, stock
-- movement, barcode) whose `branch` disagreed with its parent product.
-- Such a row would silently show up in the WRONG POS counter's catalog,
-- stock analytics / stock ledger reports or barcode lookups.
--
-- This migration:
--   1. Repairs any existing child row that disagrees with its parent.
--   2. Installs triggers that keep every child row's branch locked to the
--      branch of the product (or variant's product) it belongs to.
--
-- Idempotent: safe to re-run.
-- ====================================================================

-- 1. Repair disagreement between child rows and their parent product --------

-- Variants must live in the same branch as their parent product.
UPDATE public.product_variants v
SET branch = p.branch,
    updated_at = NOW()
FROM public.products p
WHERE v.product_id = p.id
  AND v.branch <> p.branch;

-- Barcode registry rows must live in the same branch as their product.
UPDATE public.barcode_registry b
SET branch = p.branch,
    updated_at = NOW()
FROM public.products p
WHERE b.product_id = p.id
  AND b.branch <> p.branch;

-- Stock movements that reference a variant must follow that variant's branch.
UPDATE public.inventory_movements m
SET branch = p.branch
FROM public.product_variants v
JOIN public.products p ON p.id = v.product_id
WHERE m.variant_id = v.id
  AND m.branch <> p.branch;

-- Product-level movements (variant_id IS NULL) follow the product's branch.
UPDATE public.inventory_movements m
SET branch = p.branch
FROM public.products p
WHERE m.product_id = p.id
  AND m.variant_id IS NULL
  AND m.branch <> p.branch;

-- 2. Guard: a variant always belongs to its parent product's branch ---------

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

-- 3. Guard: barcode registry rows follow their product's branch -------------

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

-- 4. Guard: stock movement ledger rows follow their product / variant -------
-- This is what keeps per-branch stock analytics, stock history and
-- low-stock alarms from ever counting another counter's stock.

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
