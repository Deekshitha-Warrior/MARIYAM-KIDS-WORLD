-- Split 2 of 3: variant + barcode_registry branch triggers.
-- Both follow their parent product's branch, so they share one function.

CREATE OR REPLACE FUNCTION public.enforce_branch_from_product()
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
FOR EACH ROW EXECUTE FUNCTION public.enforce_branch_from_product();

DROP TRIGGER IF EXISTS enforce_barcode_registry_branch_trigger ON public.barcode_registry;
CREATE TRIGGER enforce_barcode_registry_branch_trigger
BEFORE INSERT OR UPDATE OF branch, product_id ON public.barcode_registry
FOR EACH ROW EXECUTE FUNCTION public.enforce_branch_from_product();
