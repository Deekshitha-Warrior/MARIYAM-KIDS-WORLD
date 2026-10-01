-- Make inventory movement ledger rows disappear together with the product or
-- variant they belong to. Product / variant ids are unique and each row belongs
-- to exactly one POS branch, so POS 1 and POS 2 ledgers stay fully separate.

-- 1. Clean up orphaned ledger rows left behind by earlier deletions
--    (the old ON DELETE SET NULL foreign keys blanked the links but kept rows).
DELETE FROM public.inventory_movements
WHERE product_id IS NULL
  AND variant_id IS NULL;

-- 2. Delete movements automatically before a variant is removed.
CREATE OR REPLACE FUNCTION public.delete_movements_for_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.inventory_movements WHERE variant_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS delete_movements_for_variant_trigger ON public.product_variants;
CREATE TRIGGER delete_movements_for_variant_trigger
BEFORE DELETE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.delete_movements_for_variant();

-- 3. Delete movements automatically before a product is removed.
CREATE OR REPLACE FUNCTION public.delete_movements_for_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.inventory_movements WHERE product_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS delete_movements_for_product_trigger ON public.products;
CREATE TRIGGER delete_movements_for_product_trigger
BEFORE DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.delete_movements_for_product();

NOTIFY pgrst, 'reload schema';
