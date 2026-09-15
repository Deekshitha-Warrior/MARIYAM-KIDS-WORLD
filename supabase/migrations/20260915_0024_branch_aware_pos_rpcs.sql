-- Migration: 20260915_0024_branch_aware_pos_rpcs.sql
-- Description: Updates transactional RPCs to enforce branch isolation and security validation

BEGIN;

-- 1. Branch-Aware complete_pos_sale_with_inventory
CREATE OR REPLACE FUNCTION public.complete_pos_sale_with_inventory(
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_items JSONB,
  p_shipping NUMERIC DEFAULT 0,
  p_status TEXT DEFAULT 'completed',
  p_order_mode TEXT DEFAULT 'offline',
  p_order_type TEXT DEFAULT 'pos_sale',
  p_delivery_charge NUMERIC DEFAULT 0,
  p_discount_amount NUMERIC DEFAULT 0,
  p_manual_discount_amount NUMERIC DEFAULT 0,
  p_manual_discount_type TEXT DEFAULT 'flat',
  p_manual_discount_value NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_coupon_percentage NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'cash',
  p_split_details JSONB DEFAULT '{}'::JSONB,
  p_total_gst NUMERIC DEFAULT 0,
  p_gst_enabled BOOLEAN DEFAULT FALSE,
  p_remarks TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_billing_date TIMESTAMPTZ DEFAULT NULL,
  p_branch_id UUID DEFAULT 'b0000000-0000-0000-0000-000000000001'::UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_branch_id UUID := COALESCE(p_branch_id, 'b0000000-0000-0000-0000-000000000001'::UUID);
  v_invoice_no TEXT;
  v_order_id UUID;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product_id BIGINT;
  v_variant_id UUID;
  v_quantity NUMERIC;
  v_unit_price NUMERIC;
  v_line_total NUMERIC;
  v_product_name TEXT;
  v_name_ta TEXT;
  v_unit TEXT;
  v_unit_type TEXT;
  v_base_quantity NUMERIC;
  v_is_manual BOOLEAN;
  v_discount NUMERIC;
  v_gst_amount NUMERIC;
  v_gst_rate NUMERIC;
  v_image_url TEXT;
  v_variant_name TEXT;
  v_source TEXT;
  v_note TEXT;
  v_category TEXT;
  v_current_stock NUMERIC;
  v_created_at TIMESTAMPTZ := COALESCE(p_billing_date, NOW());
BEGIN
  -- 0. Authorization check: verify current authenticated user has access to this branch
  IF v_user_id IS NOT NULL AND NOT private.user_can_access_branch(v_branch_id) THEN
    RAISE EXCEPTION 'Branch access denied for user % to branch %', v_user_id, v_branch_id;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- 1. Atomic Pre-Validation of Available Stock strictly within this branch
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'product_id', '')::BIGINT;
    v_variant_id := NULLIF(v_item ->> 'variant_id', '')::UUID;
    v_quantity := COALESCE((v_item ->> 'quantity')::NUMERIC, 0);
    v_is_manual := COALESCE((v_item ->> 'is_manual')::BOOLEAN, FALSE);
    v_product_name := COALESCE(v_item ->> 'product_name', v_item ->> 'name', 'Product');

    IF NOT v_is_manual AND v_quantity > 0 THEN
      IF v_variant_id IS NOT NULL THEN
        SELECT stock INTO v_current_stock 
        FROM public.product_variants 
        WHERE id = v_variant_id AND branch_id = v_branch_id 
        FOR UPDATE;

        IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %) in branch %', 
            v_product_name, COALESCE(v_current_stock, 0), v_quantity, v_branch_id;
        END IF;
      ELSIF v_product_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_current_stock 
        FROM public.products 
        WHERE id = v_product_id AND branch_id = v_branch_id 
        FOR UPDATE;

        IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %) in branch %', 
            v_product_name, COALESCE(v_current_stock, 0), v_quantity, v_branch_id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 2. Calculate Totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_line_total := COALESCE((v_item ->> 'line_total')::NUMERIC, 0);
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := v_subtotal + COALESCE(p_shipping, 0) + COALESCE(p_delivery_charge, 0) 
             - COALESCE(p_discount_amount, 0) - COALESCE(p_manual_discount_amount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- 3. Invoice Number Generation (Branch Specific if available)
  BEGIN
    SELECT public.generate_branch_invoice_number(v_branch_id) INTO v_invoice_no;
  EXCEPTION WHEN OTHERS THEN
    v_invoice_no := public.generate_invoice_number();
  END;

  -- 4. Create Order with branch_id
  INSERT INTO public.orders (
    invoice_number,
    user_id,
    customer_name,
    phone,
    shipping_address,
    subtotal,
    shipping_charge,
    discount_amount,
    total,
    status,
    payment_method,
    order_mode,
    order_type,
    delivery_charge,
    manual_discount_amount,
    manual_discount_type,
    manual_discount_value,
    coupon_code,
    coupon_percentage,
    split_details,
    total_gst,
    gst_enabled,
    remarks,
    reference_number,
    branch_id,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_no,
    v_user_id,
    COALESCE(p_customer_name, 'Walk-in Customer'),
    p_phone,
    p_address,
    v_subtotal,
    COALESCE(p_shipping, 0),
    COALESCE(p_discount_amount, 0),
    v_total,
    COALESCE(p_status, 'completed'),
    COALESCE(p_payment_method, 'cash'),
    COALESCE(p_order_mode, 'offline'),
    COALESCE(p_order_type, 'pos_sale'),
    COALESCE(p_delivery_charge, 0),
    COALESCE(p_manual_discount_amount, 0),
    COALESCE(p_manual_discount_type, 'flat'),
    COALESCE(p_manual_discount_value, 0),
    p_coupon_code,
    COALESCE(p_coupon_percentage, 0),
    COALESCE(p_split_details, '{}'::JSONB),
    COALESCE(p_total_gst, 0),
    COALESCE(p_gst_enabled, FALSE),
    p_remarks,
    p_reference_number,
    v_branch_id,
    v_created_at,
    v_created_at
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Order Items and Apply Inventory Movements
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'product_id', '')::BIGINT;
    v_variant_id := NULLIF(v_item ->> 'variant_id', '')::UUID;
    v_quantity := COALESCE((v_item ->> 'quantity')::NUMERIC, 0);
    v_unit_price := COALESCE((v_item ->> 'unit_price')::NUMERIC, 0);
    v_line_total := COALESCE((v_item ->> 'line_total')::NUMERIC, 0);
    v_product_name := COALESCE(v_item ->> 'product_name', v_item ->> 'name', 'Product');
    v_name_ta := v_item ->> 'name_ta';
    v_unit := v_item ->> 'unit';
    v_unit_type := v_item ->> 'unit_type';
    v_base_quantity := COALESCE((v_item ->> 'base_quantity')::NUMERIC, 1);
    v_is_manual := COALESCE((v_item ->> 'is_manual')::BOOLEAN, FALSE);
    v_discount := COALESCE((v_item ->> 'discount')::NUMERIC, 0);
    v_gst_amount := COALESCE((v_item ->> 'gst_amount')::NUMERIC, 0);
    v_gst_rate := COALESCE((v_item ->> 'gst_rate')::NUMERIC, 0);
    v_image_url := v_item ->> 'image_url';
    v_variant_name := v_item ->> 'variant_name';
    v_source := v_item ->> 'source';
    v_note := v_item ->> 'note';
    v_category := v_item ->> 'category';

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      name_ta,
      unit,
      unit_type,
      base_quantity,
      unit_price,
      quantity,
      line_total,
      is_manual,
      discount,
      gst_amount,
      gst_rate,
      image_url,
      variant_name,
      source,
      note,
      category,
      branch_id,
      created_at
    ) VALUES (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_product_name,
      v_name_ta,
      v_unit,
      v_unit_type,
      v_base_quantity,
      v_unit_price,
      v_quantity,
      v_line_total,
      v_is_manual,
      v_discount,
      v_gst_amount,
      v_gst_rate,
      v_image_url,
      v_variant_name,
      v_source,
      v_note,
      v_category,
      v_branch_id,
      v_created_at
    );

    -- Stock Deduction & Movement Logging
    IF NOT v_is_manual AND v_quantity > 0 THEN
      IF v_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock - v_quantity, updated_at = NOW()
        WHERE id = v_variant_id AND branch_id = v_branch_id;

        INSERT INTO public.inventory_movements (
          variant_id, product_id, movement_type, quantity,
          reference_type, reference_id, notes, branch_id, created_at
        ) VALUES (
          v_variant_id, v_product_id, 'sale', -v_quantity,
          'order', v_order_id::TEXT, 'POS Sale ' || v_invoice_no, v_branch_id, v_created_at
        );
      ELSIF v_product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity, updated_at = NOW()
        WHERE id = v_product_id AND branch_id = v_branch_id;

        INSERT INTO public.inventory_movements (
          product_id, movement_type, quantity,
          reference_type, reference_id, notes, branch_id, created_at
        ) VALUES (
          v_product_id, 'sale', -v_quantity,
          'order', v_order_id::TEXT, 'POS Sale ' || v_invoice_no, v_branch_id, v_created_at
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_number', v_invoice_no,
    'subtotal', v_subtotal,
    'total', v_total,
    'branch_id', v_branch_id,
    'created_at', v_created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_pos_sale_with_inventory TO authenticated, anon;

COMMIT;
