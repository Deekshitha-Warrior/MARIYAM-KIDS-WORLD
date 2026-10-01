-- Permanently remove an inventory item together with its barcode and movement
-- rows. Sales keep their historical line-item snapshots (product_id becomes
-- NULL via the existing FK), so deleting a catalog item never rewrites invoices.
CREATE OR REPLACE FUNCTION public.delete_inventory_item(
  p_product_id bigint,
  p_variant_id uuid DEFAULT NULL,
  p_branch text DEFAULT 'pos1'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch text := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE id = p_variant_id AND product_id = p_product_id AND branch = v_branch
    ) THEN
      RAISE EXCEPTION 'Variant does not belong to the selected product and POS branch';
    END IF;

    DELETE FROM public.inventory_movements
    WHERE variant_id = p_variant_id AND branch = v_branch;

    DELETE FROM public.barcode_registry
    WHERE variant_id = p_variant_id AND product_id = p_product_id AND branch = v_branch;

    DELETE FROM public.product_variants
    WHERE id = p_variant_id AND product_id = p_product_id AND branch = v_branch;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = p_product_id AND branch = v_branch
  ) THEN
    RAISE EXCEPTION 'Product does not belong to the selected POS branch';
  END IF;

  DELETE FROM public.inventory_movements
  WHERE branch = v_branch
    AND (product_id = p_product_id OR variant_id IN (
      SELECT id FROM public.product_variants
      WHERE product_id = p_product_id AND branch = v_branch
    ));

  DELETE FROM public.barcode_registry
  WHERE product_id = p_product_id AND branch = v_branch;

  DELETE FROM public.product_variants
  WHERE product_id = p_product_id AND branch = v_branch;

  DELETE FROM public.products
  WHERE id = p_product_id AND branch = v_branch;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_inventory_item(bigint, uuid, text)
  TO anon, authenticated;
