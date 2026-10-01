-- Split 3 of 3: stock-movement branch trigger.
-- A movement follows its variant's branch, else its product's.
-- This is the one that scopes stock history, analytics and low-stock alarms.

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
