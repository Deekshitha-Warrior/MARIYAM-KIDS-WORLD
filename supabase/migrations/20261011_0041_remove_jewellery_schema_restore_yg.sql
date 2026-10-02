-- ===================================================================
-- Migration 0041: Undo the two Jewellery POS scripts, restore YG
-- ===================================================================
--
-- WHAT HAPPENED
-- Two scripts from the separate Jewellery POS project were run on the YG
-- Enterprises database:
--   A. "Jewellery POS extension"            (jewellery/supabase/migrations/jewellery_pos.sql)
--   B. "Jewellery POS - Complete Deployment" (jewellery/supabase/production_schema.sql)
--
-- They added jewellery tables, columns, categories, sequences and
-- functions; put an extra stock-deducting trigger on orders (which would
-- have double-deducted every YG sale); replaced YG's checkout,
-- advance-order, barcode, stock, expense, invoice-lookup and helper
-- functions with non-POS-aware versions; and re-added three uniqueness
-- rules that make POS 1 and POS 2 clash on coupon codes, barcodes and
-- category names.
--
-- WHAT THIS DOES -- every object is named explicitly, taken from those two
-- scripts; nothing else in the database is touched:
--   1. Deletes the 21 categories the scripts seeded into POS 1.
--   2. Drops the extra trigger they put on orders.
--   3. Drops the 3 cross-POS uniqueness rules they re-added, 2 other
--      indexes, and their 4 file-storage access rules (if present).
--   4. Drops the columns they added to YG tables (all hold only defaults).
--   5. Drops the tables, view, functions and sequences they created
--      (tables verified empty).
--   6. Restores YG's functions and triggers they replaced, verbatim from
--      YG's latest migrations (with 0039's per-POS coupon fix).
--   7. Verifies the result; any failure rolls the whole migration back.
--
-- Not touched: access policies and row-level security on YG tables (the
-- scripts re-created them with exactly YG's definitions), storage buckets,
-- and two columns the YG app itself relies on (orders.invoice_pdf_url,
-- advance_orders.reference_number), which script B may also have added.
-- ===================================================================

BEGIN;

-- 1. Categories seeded by the scripts (none has products) -----------------

DELETE FROM public.categories c
WHERE c.branch = 'pos1'
  AND (
    c.name_en IN (
      'Gold Jewellery', 'Silver Jewellery', 'Platinum Jewellery', 'Diamond Jewellery',
      'Rings', 'Necklaces', 'Chains', 'Bangles', 'Bracelets', 'Earrings', 'Pendants',
      'Nose Pins', 'Anklets', 'Mangalsutra', 'Wedding Jewellery', 'Kids Jewellery',
      'Coins', 'Other', 'German Silver Products', 'Photo Frames'
    )
    -- Script B's seed; YG creates its own per-POS 'Unregistered' with a Tamil name.
    OR (c.name_en = 'Unregistered' AND c.name_ta = 'Unregistered')
  )
  AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.category_id = c.id);

-- 2. Extra stock trigger on orders (script B) ------------------------------

DROP TRIGGER IF EXISTS orders_stock_trigger ON public.orders;

-- 3. Indexes and storage rules added by script B
-- Cross-POS uniqueness rules re-added by script B ------------------------

DROP INDEX IF EXISTS public.coupons_code_upper_unique;
DROP INDEX IF EXISTS public.categories_name_en_key;
DROP INDEX IF EXISTS public.barcode_registry_barcode_value_key;

-- Other indexes only script B created
DROP INDEX IF EXISTS public.idx_inv_movements_reference;
DROP INDEX IF EXISTS public.idx_product_variants_expiry;

-- File-storage access rules script B added (YG's own storage rules and
-- the buckets themselves are left as they are)
DROP POLICY IF EXISTS pos_files_read ON storage.objects;
DROP POLICY IF EXISTS pos_files_insert ON storage.objects;
DROP POLICY IF EXISTS pos_files_update ON storage.objects;
DROP POLICY IF EXISTS pos_files_delete ON storage.objects;

-- 4. Columns added to YG tables ---------------------------------------------

ALTER TABLE public.products
  DROP COLUMN IF EXISTS has_special_offer,
  DROP COLUMN IF EXISTS special_offer_note,
  DROP COLUMN IF EXISTS special_offer_cost,
  DROP COLUMN IF EXISTS expiry_date,
  DROP COLUMN IF EXISTS mfg_date,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS metal_type,
  DROP COLUMN IF EXISTS purity,
  DROP COLUMN IF EXISTS gross_weight,
  DROP COLUMN IF EXISTS stone_weight,
  DROP COLUMN IF EXISTS net_weight,
  DROP COLUMN IF EXISTS making_charge,
  DROP COLUMN IF EXISTS making_charge_type,
  DROP COLUMN IF EXISTS wastage,
  DROP COLUMN IF EXISTS wastage_type,
  DROP COLUMN IF EXISTS stone_charge,
  DROP COLUMN IF EXISTS other_charge,
  DROP COLUMN IF EXISTS huid,
  DROP COLUMN IF EXISTS design_number,
  DROP COLUMN IF EXISTS subcategory,
  DROP COLUMN IF EXISTS other_weight,
  DROP COLUMN IF EXISTS hallmark_status,
  DROP COLUMN IF EXISTS stone_details;

ALTER TABLE public.product_variants
  DROP COLUMN IF EXISTS expiry_date,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS mfg_date,
  DROP COLUMN IF EXISTS quantity_unit_id,
  DROP COLUMN IF EXISTS damage_stock;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS is_credit,
  DROP COLUMN IF EXISTS credit_due_date,
  DROP COLUMN IF EXISTS credit_status,
  DROP COLUMN IF EXISTS credit_paid_at,
  DROP COLUMN IF EXISTS scheme_id,
  DROP COLUMN IF EXISTS scheme_number,
  DROP COLUMN IF EXISTS scheme_amount_used,
  DROP COLUMN IF EXISTS scheme_discount,
  DROP COLUMN IF EXISTS scheme_balance_after,
  DROP COLUMN IF EXISTS customer_gstin,
  DROP COLUMN IF EXISTS exchange_amount,
  DROP COLUMN IF EXISTS advance_amount_used,
  DROP COLUMN IF EXISTS amount_paid;

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS special_offer_note,
  DROP COLUMN IF EXISTS special_offer_cost;

ALTER TABLE public.store_settings
  DROP COLUMN IF EXISTS instagram_handle,
  DROP COLUMN IF EXISTS low_stock_threshold,
  DROP COLUMN IF EXISTS admin_id,
  DROP COLUMN IF EXISTS admin_password,
  DROP COLUMN IF EXISTS staff_id,
  DROP COLUMN IF EXISTS staff_password,
  DROP COLUMN IF EXISTS expiry_alert_days,
  DROP COLUMN IF EXISTS accent_color,
  DROP COLUMN IF EXISTS shop_contact_number,
  DROP COLUMN IF EXISTS customer_event_messages,
  DROP COLUMN IF EXISTS scheme_rules,
  DROP COLUMN IF EXISTS gstin,
  DROP COLUMN IF EXISTS state_name,
  DROP COLUMN IF EXISTS state_code,
  DROP COLUMN IF EXISTS pos_permissions;

-- 5. Functions, tables, view and sequences created by the scripts -----------
-- No CASCADE: if anything outside the scripts depended on these, the
-- migration stops instead of silently removing it.


-- Script A functions
DROP FUNCTION IF EXISTS public.scheme_paid_status(DATE);
DROP FUNCTION IF EXISTS public.jewellery_upsert_customer(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_jewellery_scheme(TEXT, TEXT, TEXT, NUMERIC, INTEGER, INTEGER, DATE, DATE, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_jewellery_scheme(TEXT, TEXT, TEXT, NUMERIC, INTEGER, INTEGER, DATE, DATE, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.record_scheme_installment(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.redeem_jewellery_scheme(UUID, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.link_scheme_redemption(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reverse_scheme_redemption(UUID);
DROP FUNCTION IF EXISTS public.cancel_jewellery_scheme(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.transfer_jewellery_scheme(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.refresh_scheme_maturity();
DROP FUNCTION IF EXISTS public.reserve_customer_advance(UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.link_advance_usage(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reverse_advance_usage(UUID);
DROP FUNCTION IF EXISTS public.cancel_customer_advance(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_sales_return(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_sales_return(UUID, TEXT);

-- Script B functions that YG never had
DROP FUNCTION IF EXISTS public.orders_stock_trigger();
DROP FUNCTION IF EXISTS public.apply_order_sale_stock(public.orders);
DROP FUNCTION IF EXISTS public.reverse_order_sale_stock(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.order_counts_as_sold(TEXT);
DROP FUNCTION IF EXISTS public.mark_credit_order_paid(UUID);
DROP FUNCTION IF EXISTS public.next_invoice_no();
DROP FUNCTION IF EXISTS public.create_order_without_stock(TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, NUMERIC);

-- Script B's versions of YG functions (their signatures differ from YG's,
-- so they must go before YG's are re-created, or calls become ambiguous)
DROP FUNCTION IF EXISTS public.complete_pos_sale_with_inventory(TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, JSONB, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.create_order_with_stock(TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, JSONB, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.create_advance_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.complete_advance_order_v2(UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.update_advance_order_status(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_advance_order_event(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.adjust_inventory_stock(INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_barcode_and_receive_stock(INTEGER, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.generate_barcode_value(TEXT);
DROP FUNCTION IF EXISTS public.get_expense_summary_metrics(DATE);
DROP FUNCTION IF EXISTS public.get_public_invoice_by_number(TEXT);

-- Tables and view (after the functions that return their row types)
DROP VIEW IF EXISTS public.current_metal_rates;
DROP TABLE IF EXISTS public.scheme_redemptions;
DROP TABLE IF EXISTS public.scheme_installments;
DROP TABLE IF EXISTS public.advance_usages;
DROP TABLE IF EXISTS public.sales_returns;
DROP TABLE IF EXISTS public.customer_advances;
DROP TABLE IF EXISTS public.jewellery_schemes;
DROP TABLE IF EXISTS public.old_gold_exchanges;
DROP TABLE IF EXISTS public.quotations;
DROP TABLE IF EXISTS public.repairs;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.metal_rates;
DROP TABLE IF EXISTS public.damage_stock;
DROP TABLE IF EXISTS public.product_price_history;
DROP TABLE IF EXISTS public.unit_conversions;
DROP TABLE IF EXISTS public.unit_types;
DROP TABLE IF EXISTS public.barcode_custom_sizes;
DROP TABLE IF EXISTS public.customers;

-- Trigger functions of those tables (their triggers went with the tables)
DROP FUNCTION IF EXISTS public.metal_rates_append_only();
DROP FUNCTION IF EXISTS public.scheme_installments_protect_paid();
DROP FUNCTION IF EXISTS public.audit_logs_append_only();
DROP FUNCTION IF EXISTS public.audit_metal_rate_insert();

-- Sequences created by the scripts (YG's own sequences are kept)
DROP SEQUENCE IF EXISTS public.invoice_no_seq;
DROP SEQUENCE IF EXISTS public.scheme_number_seq;
DROP SEQUENCE IF EXISTS public.scheme_receipt_seq;
DROP SEQUENCE IF EXISTS public.advance_receipt_seq;
DROP SEQUENCE IF EXISTS public.old_gold_seq;
DROP SEQUENCE IF EXISTS public.return_number_seq;
DROP SEQUENCE IF EXISTS public.quotation_number_seq;
DROP SEQUENCE IF EXISTS public.repair_number_seq;

-- 6. Restore YG's own functions, verbatim from YG's latest migrations --------

-- is_admin  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- touch_updated_at  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- handle_new_user  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := CASE WHEN COALESCE(NEW.raw_user_meta_data ->> 'role', '') = 'admin' THEN 'admin' ELSE 'customer' END;
BEGIN
  INSERT INTO public.profiles (id, customer_code, name, mobile, email, role)
  VALUES (
    NEW.id,
    'CUST-' || LPAD(nextval('public.customer_code_seq')::TEXT, 5, '0'),
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Customer'),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile', ''),
    NEW.email,
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    mobile = EXCLUDED.mobile,
    email = EXCLUDED.email,
    updated_at = NOW();

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::JSONB) || jsonb_build_object('role', v_role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- sync_product_category_name  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.sync_product_category_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT name_en INTO NEW.category FROM public.categories WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$;

-- sync_category_name_to_products  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.sync_category_name_to_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.name_en IS DISTINCT FROM OLD.name_en THEN
    UPDATE public.products SET category = NEW.name_en, updated_at = NOW() WHERE category_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ensure_one_default_variant  (from 20260716_0001_purple_boutique_schema.sql)
CREATE OR REPLACE FUNCTION public.ensure_one_default_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.product_variants
    SET is_default = FALSE, updated_at = NOW()
    WHERE product_id = NEW.product_id AND id <> NEW.id AND is_default;
  END IF;
  RETURN NEW;
END;
$$;

-- generate_barcode_value  (from 20261005_0034_repair_branch_aware_inventory_rpcs.sql)
CREATE OR REPLACE FUNCTION public.generate_barcode_value(p_entity_type TEXT, p_branch TEXT DEFAULT 'pos1')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_branch = 'pos2' THEN
    IF p_entity_type = 'variant' THEN
      RETURN 'P2V' || LPAD(nextval('public.barcode_variant_seq_pos2')::TEXT, 8, '0');
    ELSE
      RETURN 'P2P' || LPAD(nextval('public.barcode_product_seq_pos2')::TEXT, 8, '0');
    END IF;
  ELSE
    -- POS 1: unchanged from before the branch split.
    IF p_entity_type = 'variant' THEN
      RETURN 'PBV' || LPAD(nextval('public.barcode_variant_seq')::TEXT, 8, '0');
    ELSE
      RETURN 'PBP' || LPAD(nextval('public.barcode_product_seq')::TEXT, 8, '0');
    END IF;
  END IF;
END;
$$;

-- create_order_with_stock  (from 20260924_0020_split_pos_branches.sql + 0039 per-POS coupon usage)
CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_items JSONB,
  p_shipping NUMERIC DEFAULT 0,
  p_status TEXT DEFAULT 'pending',
  p_order_mode TEXT DEFAULT 'offline',
  p_order_type TEXT DEFAULT 'pos_sale',
  p_delivery_charge NUMERIC DEFAULT 0,
  p_discount_amount NUMERIC DEFAULT 0,
  p_manual_discount_amount NUMERIC DEFAULT 0,
  p_manual_discount_type TEXT DEFAULT 'flat',
  p_manual_discount_value NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_coupon_percentage NUMERIC DEFAULT 0,
  p_total_gst NUMERIC DEFAULT 0,
  p_gst_enabled BOOLEAN DEFAULT FALSE,
  p_payment_method TEXT DEFAULT 'cash',
  p_split_details JSONB DEFAULT '{}'::JSONB,
  p_branch TEXT DEFAULT 'pos1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_no TEXT;
  v_order_id UUID;
  v_subtotal NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2);
  v_item JSONB;
  v_quantity NUMERIC(12,3);
  v_price NUMERIC(12,2);
  v_line_total NUMERIC(12,2);
  v_source TEXT;
  v_attempt INTEGER;
  v_uses_typed_item_ids BOOLEAN;
  v_branch TEXT := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one order item is required';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_quantity := GREATEST(COALESCE(NULLIF(v_item ->> 'quantity', '')::NUMERIC, 0), 0);
    v_price := GREATEST(COALESCE(NULLIF(v_item ->> 'base_price', '')::NUMERIC, 0), 0);
    v_line_total := GREATEST(
      COALESCE(NULLIF(v_item ->> 'line_total', '')::NUMERIC, v_quantity * v_price),
      0
    );

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := GREATEST(
    ROUND(
      v_subtotal + GREATEST(COALESCE(p_shipping, 0), 0)
        + GREATEST(COALESCE(p_delivery_charge, 0), 0)
        + GREATEST(COALESCE(p_total_gst, 0), 0)
        - GREATEST(COALESCE(p_discount_amount, 0), 0)
        - GREATEST(COALESCE(p_manual_discount_amount, 0), 0),
      2
    ),
    0
  );

  SELECT data_type = 'bigint'
  INTO v_uses_typed_item_ids
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_id';

  FOR v_attempt IN 1..5 LOOP
    v_invoice_no := public.get_next_invoice_no(v_branch);
    v_order_id := gen_random_uuid();

    BEGIN
      INSERT INTO public.orders (
        id, invoice_no, user_id, customer_name, phone, address, items, subtotal, shipping, total,
        status, order_mode, order_type, delivery_charge, discount_amount, manual_discount_amount,
        manual_discount_type, manual_discount_value, coupon_code, coupon_percentage, total_gst,
        gst_amount, gst_enabled, payment_method, payment_mode, split_details, branch, created_at, updated_at
      ) VALUES (
        v_order_id, v_invoice_no, auth.uid(),
        COALESCE(NULLIF(BTRIM(p_customer_name), ''), 'Walk-in Customer'),
        COALESCE(BTRIM(p_phone), ''), COALESCE(NULLIF(BTRIM(p_address), ''), 'POS Counter'),
        p_items, v_subtotal, GREATEST(COALESCE(p_shipping, 0), 0), v_total,
        COALESCE(NULLIF(BTRIM(p_status), ''), 'pending'),
        COALESCE(NULLIF(BTRIM(p_order_mode), ''), 'offline'),
        COALESCE(NULLIF(BTRIM(p_order_type), ''), 'pos_sale'),
        GREATEST(COALESCE(p_delivery_charge, 0), 0),
        GREATEST(COALESCE(p_discount_amount, 0), 0),
        GREATEST(COALESCE(p_manual_discount_amount, 0), 0),
        COALESCE(NULLIF(BTRIM(p_manual_discount_type), ''), 'flat'),
        GREATEST(COALESCE(p_manual_discount_value, 0), 0),
        NULLIF(BTRIM(COALESCE(p_coupon_code, '')), ''),
        GREATEST(COALESCE(p_coupon_percentage, 0), 0),
        GREATEST(COALESCE(p_total_gst, 0), 0), GREATEST(COALESCE(p_total_gst, 0), 0),
        COALESCE(p_gst_enabled, FALSE),
        COALESCE(NULLIF(BTRIM(p_payment_method), ''), 'cash'),
        COALESCE(NULLIF(BTRIM(p_payment_method), ''), 'cash'),
        COALESCE(p_split_details, '{}'::JSONB), v_branch, NOW(), NOW()
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt = 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_quantity := GREATEST(COALESCE(NULLIF(v_item ->> 'quantity', '')::NUMERIC, 0), 0);
    v_price := GREATEST(COALESCE(NULLIF(v_item ->> 'base_price', '')::NUMERIC, 0), 0);
    v_line_total := GREATEST(
      COALESCE(NULLIF(v_item ->> 'line_total', '')::NUMERIC, v_quantity * v_price),
      0
    );
    v_source := COALESCE(NULLIF(v_item ->> 'source', ''), 'catalogue');

    IF v_uses_typed_item_ids THEN
      INSERT INTO public.order_items (
        order_id, product_id, variant_id, product_name, tamil_name, variant_name,
        quantity, unit, unit_price, line_total, is_manual, source, note
      ) VALUES (
        v_order_id, NULLIF(COALESCE(v_item ->> 'product_id', v_item ->> 'id'), '')::BIGINT,
        NULLIF(v_item ->> 'variant_id', '')::UUID, COALESCE(NULLIF(v_item ->> 'name', ''), 'Product'),
        NULLIF(v_item ->> 'tamil_name', ''), NULLIF(v_item ->> 'variant_name', ''),
        v_quantity, COALESCE(NULLIF(v_item ->> 'unit', ''), 'piece'), v_price, v_line_total,
        v_source = 'manual', v_source, NULLIF(v_item ->> 'note', '')
      );
    ELSE
      INSERT INTO public.order_items (
        order_id, product_id, variant_id, product_name, tamil_name, variant_name,
        quantity, unit, unit_price, line_total, is_manual, source, note
      ) VALUES (
        v_order_id, NULLIF(COALESCE(v_item ->> 'product_id', v_item ->> 'id'), ''),
        NULLIF(v_item ->> 'variant_id', ''), COALESCE(NULLIF(v_item ->> 'name', ''), 'Product'),
        NULLIF(v_item ->> 'tamil_name', ''), NULLIF(v_item ->> 'variant_name', ''),
        v_quantity, COALESCE(NULLIF(v_item ->> 'unit', ''), 'piece'), v_price, v_line_total,
        v_source = 'manual', v_source, NULLIF(v_item ->> 'note', '')
      );
    END IF;

    IF COALESCE(v_item ->> 'product_id', v_item ->> 'id', '') ~ '^[0-9]+$' THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(stock_quantity - v_quantity, 0),
          stock = GREATEST(FLOOR(stock_quantity - v_quantity), 0)::INTEGER,
          updated_at = NOW()
      WHERE id::TEXT = COALESCE(v_item ->> 'product_id', v_item ->> 'id')
        AND branch = v_branch;
    END IF;

    IF NULLIF(v_item ->> 'variant_id', '') IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = GREATEST(stock - v_quantity, 0), updated_at = NOW()
      WHERE id::TEXT = v_item ->> 'variant_id'
        AND branch = v_branch;
    END IF;
  END LOOP;

  IF NULLIF(BTRIM(COALESCE(p_coupon_code, '')), '') IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE UPPER(BTRIM(code)) = UPPER(BTRIM(p_coupon_code)) AND branch = v_branch
      AND is_active
      AND (usage_limit IS NULL OR usage_count < usage_limit);
  END IF;

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'invoiceNo', v_invoice_no,
    'createdAt', NOW()
  );
END;
$$;

-- complete_pos_sale_with_inventory  (from 20261005_0034_repair_branch_aware_inventory_rpcs.sql + 0039 per-POS coupon usage)
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
  p_branch TEXT DEFAULT 'pos1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
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
  v_barcode_id UUID;
  v_created_at TIMESTAMPTZ := COALESCE(p_billing_date, NOW());
  v_branch TEXT := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- 1. Atomic Pre-Validation of Available Stock for All Items (branch-scoped)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'product_id', '')::BIGINT;
    v_variant_id := NULLIF(v_item ->> 'variant_id', '')::UUID;
    v_quantity := COALESCE((v_item ->> 'quantity')::NUMERIC, 0);
    v_is_manual := COALESCE((v_item ->> 'is_manual')::BOOLEAN, FALSE);
    v_product_name := COALESCE(v_item ->> 'product_name', v_item ->> 'name', 'Product');

    IF NOT v_is_manual AND v_quantity > 0 THEN
      IF v_variant_id IS NOT NULL THEN
        SELECT stock INTO v_current_stock FROM public.product_variants WHERE id = v_variant_id AND branch = v_branch FOR UPDATE;
        IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %)', v_product_name, COALESCE(v_current_stock, 0), v_quantity;
        END IF;
      ELSIF v_product_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_current_stock FROM public.products WHERE id = v_product_id AND branch = v_branch FOR UPDATE;
        IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %)', v_product_name, COALESCE(v_current_stock, 0), v_quantity;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 2. Calculate Subtotal & Generate Invoice Number (from this branch's sequence)
  v_invoice_no := public.get_next_invoice_no(v_branch);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item ->> 'quantity')::NUMERIC, 0);
    v_unit_price := COALESCE(
      (v_item ->> 'unit_price')::NUMERIC,
      (v_item ->> 'base_price')::NUMERIC,
      (v_item ->> 'price')::NUMERIC,
      0
    );
    v_line_total := COALESCE((v_item ->> 'line_total')::NUMERIC, ROUND(v_quantity * v_unit_price, 2));
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := GREATEST(0, ROUND(v_subtotal + COALESCE(p_shipping, 0) + COALESCE(p_delivery_charge, 0) - COALESCE(p_discount_amount, 0), 2));

  -- 3. Insert Order Record
  INSERT INTO public.orders (
    invoice_no, user_id, customer_name, phone, address, items,
    subtotal, shipping, total, status, order_mode, order_type,
    delivery_charge, discount_amount, manual_discount_amount,
    manual_discount_type, manual_discount_value, coupon_code,
    coupon_percentage, total_gst, gst_amount, gst_enabled,
    payment_method, payment_mode, split_details, remarks,
    reference_number, billing_date, branch, created_at, updated_at
  )
  VALUES (
    v_invoice_no, v_user_id, COALESCE(NULLIF(BTRIM(p_customer_name), ''), 'Customer'),
    COALESCE(p_phone, ''), COALESCE(p_address, ''), p_items,
    v_subtotal, COALESCE(p_shipping, 0), v_total, COALESCE(p_status, 'completed'),
    COALESCE(p_order_mode, 'offline'), COALESCE(p_order_type, 'pos_sale'),
    COALESCE(p_delivery_charge, 0), COALESCE(p_discount_amount, 0),
    COALESCE(p_manual_discount_amount, 0), COALESCE(p_manual_discount_type, 'flat'),
    COALESCE(p_manual_discount_value, 0), p_coupon_code,
    COALESCE(p_coupon_percentage, 0), COALESCE(p_total_gst, 0),
    COALESCE(p_total_gst, 0), COALESCE(p_gst_enabled, FALSE),
    COALESCE(p_payment_method, 'cash'), COALESCE(p_payment_method, 'cash'),
    COALESCE(p_split_details, '{}'::JSONB), COALESCE(p_remarks, ''),
    COALESCE(p_reference_number, ''), p_billing_date, v_branch, v_created_at, NOW()
  )
  RETURNING id INTO v_order_id;

  -- 4. Insert Order Items, Deduct Stock (branch-scoped) & Record SALE Movements
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'product_id', '')::BIGINT;
    v_variant_id := NULLIF(v_item ->> 'variant_id', '')::UUID;
    v_quantity := COALESCE((v_item ->> 'quantity')::NUMERIC, 0);
    v_unit_price := COALESCE((v_item ->> 'unit_price')::NUMERIC, (v_item ->> 'base_price')::NUMERIC, 0);
    v_line_total := COALESCE((v_item ->> 'line_total')::NUMERIC, ROUND(v_quantity * v_unit_price, 2));
    v_product_name := COALESCE(v_item ->> 'product_name', v_item ->> 'name', 'Product');
    v_name_ta := COALESCE(v_item ->> 'product_tamil_name', v_item ->> 'tamil_name', '');
    v_unit := COALESCE(v_item ->> 'unit', 'piece');
    v_unit_type := COALESCE(v_item ->> 'unit_type', 'unit');
    v_base_quantity := COALESCE((v_item ->> 'base_quantity')::NUMERIC, 1);
    v_is_manual := COALESCE((v_item ->> 'is_manual')::BOOLEAN, FALSE);
    v_discount := COALESCE((v_item ->> 'discount')::NUMERIC, 0);
    v_gst_amount := COALESCE((v_item ->> 'gst_amount')::NUMERIC, 0);
    v_gst_rate := COALESCE((v_item ->> 'gst_rate')::NUMERIC, 0);
    v_image_url := v_item ->> 'image_url';
    v_variant_name := v_item ->> 'variant_name';
    v_source := COALESCE(v_item ->> 'source', 'catalogue');
    v_note := v_item ->> 'note';
    v_category := v_item ->> 'category';

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_name, name,
      product_tamil_name, tamil_name, quantity, unit, unit_type,
      base_quantity, base_price, unit_price, line_total, image_url,
      is_manual, discount, gst_amount, gst_rate, variant_name,
      source, note, category, created_at
    )
    VALUES (
      v_order_id, v_product_id, v_variant_id, v_product_name, v_product_name,
      v_name_ta, v_name_ta, v_quantity, v_unit, v_unit_type,
      v_base_quantity, v_unit_price, v_unit_price, v_line_total, v_image_url,
      v_is_manual, v_discount, v_gst_amount, v_gst_rate, v_variant_name,
      v_source, v_note, v_category, v_created_at
    );

    -- Deduct Stock and Insert SALE Movement (branch-scoped)
    IF NOT v_is_manual AND v_quantity > 0 THEN
      IF v_variant_id IS NOT NULL THEN
        SELECT stock INTO v_current_stock FROM public.product_variants WHERE id = v_variant_id AND branch = v_branch;
        SELECT id INTO v_barcode_id FROM public.barcode_registry WHERE variant_id = v_variant_id AND is_active = TRUE LIMIT 1;

        UPDATE public.product_variants
        SET stock = GREATEST(0, stock - v_quantity), updated_at = NOW()
        WHERE id = v_variant_id AND branch = v_branch;

        -- Parent aggregate update
        UPDATE public.products
        SET stock_quantity = (SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = v_product_id AND is_active = TRUE),
            stock = FLOOR((SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = v_product_id AND is_active = TRUE))::INTEGER,
            updated_at = NOW()
        WHERE id = v_product_id AND branch = v_branch;

        INSERT INTO public.inventory_movements (
          product_id, variant_id, barcode_id, movement_type,
          quantity_delta, quantity_before, quantity_after,
          reference_type, reference_id, note, branch
        )
        VALUES (
          v_product_id, v_variant_id, v_barcode_id, 'SALE',
          -v_quantity, v_current_stock, GREATEST(0, v_current_stock - v_quantity),
          'order', v_invoice_no, 'POS Sale checkout', v_branch
        );

      ELSIF v_product_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_current_stock FROM public.products WHERE id = v_product_id AND branch = v_branch;
        SELECT id INTO v_barcode_id FROM public.barcode_registry WHERE product_id = v_product_id AND variant_id IS NULL AND is_active = TRUE LIMIT 1;

        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - v_quantity),
            stock = GREATEST(0, stock - FLOOR(v_quantity)::INTEGER),
            updated_at = NOW()
        WHERE id = v_product_id AND branch = v_branch;

        INSERT INTO public.inventory_movements (
          product_id, variant_id, barcode_id, movement_type,
          quantity_delta, quantity_before, quantity_after,
          reference_type, reference_id, note, branch
        )
        VALUES (
          v_product_id, NULL, v_barcode_id, 'SALE',
          -v_quantity, v_current_stock, GREATEST(0, v_current_stock - v_quantity),
          'order', v_invoice_no, 'POS Sale checkout', v_branch
        );
      END IF;
    END IF;
  END LOOP;

  -- 5. Increment Coupon Usage Count (coupons remain shared across branches)
  IF p_coupon_code IS NOT NULL AND BTRIM(p_coupon_code) <> '' THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE UPPER(BTRIM(code)) = UPPER(BTRIM(p_coupon_code)) AND branch = v_branch;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_no', v_invoice_no,
    'total', v_total
  );
END;
$$;

-- get_public_invoice_by_number  (from 20260918_0019_robust_public_invoice_lookup.sql)
CREATE OR REPLACE FUNCTION public.get_public_invoice_by_number(p_invoice_no TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.orders 
  WHERE invoice_no = NULLIF(BTRIM(p_invoice_no), '')
     OR LOWER(invoice_no) = LOWER(NULLIF(BTRIM(p_invoice_no), ''))
     OR invoice_no = REGEXP_REPLACE(BTRIM(p_invoice_no), '^(INV|PB)[-_ ]*', '', 'i')
     OR (
       REGEXP_REPLACE(BTRIM(p_invoice_no), '\D', '', 'g') <> ''
       AND invoice_no = LPAD(REGEXP_REPLACE(BTRIM(p_invoice_no), '\D', '', 'g'), 8, '0')
     )
     OR (
       REGEXP_REPLACE(BTRIM(p_invoice_no), '\D', '', 'g') <> ''
       AND invoice_no = REGEXP_REPLACE(REGEXP_REPLACE(BTRIM(p_invoice_no), '\D', '', 'g'), '^0+', '')
     )
     OR (
       p_invoice_no ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       AND id = p_invoice_no::UUID
     )
  LIMIT 1;
$$;

-- adjust_inventory_stock  (from 20261005_0034_repair_branch_aware_inventory_rpcs.sql)
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_product_id BIGINT,
  p_variant_id UUID DEFAULT NULL,
  p_new_quantity NUMERIC DEFAULT 0,
  p_reason TEXT DEFAULT 'RESTOCK',
  p_note TEXT DEFAULT '',
  p_created_by_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qty_before NUMERIC := 0;
  v_delta NUMERIC := 0;
  v_barcode_id UUID;
  v_branch TEXT;
BEGIN
  IF p_new_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;

  -- Verify variant if supplied
  IF p_variant_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = p_variant_id AND product_id = p_product_id) THEN
      RAISE EXCEPTION 'Variant does not belong to specified Product';
    END IF;

    SELECT stock, branch INTO v_qty_before, v_branch FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;
    SELECT id INTO v_barcode_id FROM public.barcode_registry WHERE variant_id = p_variant_id AND is_active = TRUE LIMIT 1;

    v_delta := p_new_quantity - v_qty_before;

    UPDATE public.product_variants
    SET stock = p_new_quantity, updated_at = NOW()
    WHERE id = p_variant_id;

    -- Refresh parent aggregate
    UPDATE public.products
    SET stock_quantity = (SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = p_product_id AND is_active = TRUE),
        stock = FLOOR((SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = p_product_id AND is_active = TRUE))::INTEGER,
        updated_at = NOW()
    WHERE id = p_product_id;
  ELSE
    SELECT stock_quantity, branch INTO v_qty_before, v_branch FROM public.products WHERE id = p_product_id FOR UPDATE;
    SELECT id INTO v_barcode_id FROM public.barcode_registry WHERE product_id = p_product_id AND variant_id IS NULL AND is_active = TRUE LIMIT 1;

    v_delta := p_new_quantity - v_qty_before;

    UPDATE public.products
    SET stock_quantity = p_new_quantity,
        stock = FLOOR(p_new_quantity)::INTEGER,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- Record Movement
  INSERT INTO public.inventory_movements (
    product_id, variant_id, barcode_id, movement_type,
    quantity_delta, quantity_before, quantity_after,
    reference_type, note, created_by_name, branch
  )
  VALUES (
    p_product_id, p_variant_id, v_barcode_id, p_reason,
    v_delta, v_qty_before, p_new_quantity,
    'adjustment', COALESCE(p_note, ''), COALESCE(p_created_by_name, ''), v_branch
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'quantity_before', v_qty_before,
    'quantity_after', p_new_quantity,
    'delta', v_delta,
    'reason', p_reason
  );
END;
$$;

-- create_advance_order  (from 20260924_0020_split_pos_branches.sql)
CREATE OR REPLACE FUNCTION public.create_advance_order(
  p_customer_name text, p_phone text, p_address text, p_product_name text,
  p_category text, p_description text, p_total_amount numeric, p_deposit_amount numeric,
  p_expected_delivery_date date, p_remarks text, p_payment_method text, p_created_by_name text,
  p_products jsonb DEFAULT '[]'::jsonb,
  p_branch text DEFAULT 'pos1'
)
RETURNS public.advance_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_order public.advance_orders; v_now timestamptz := now(); v_deposit_id text; v_branch text := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
BEGIN
  IF trim(coalesce(p_customer_name,'')) = '' THEN RAISE EXCEPTION 'Customer name is required'; END IF;
  IF trim(coalesce(p_phone,'')) = '' THEN RAISE EXCEPTION 'Phone number is required'; END IF;
  IF trim(coalesce(p_product_name,'')) = '' THEN RAISE EXCEPTION 'Product name is required'; END IF;
  IF coalesce(p_total_amount,0) <= 0 THEN RAISE EXCEPTION 'Total amount must be greater than zero'; END IF;
  IF coalesce(p_deposit_amount,0) <= 0 OR p_deposit_amount >= p_total_amount THEN RAISE EXCEPTION 'Deposit must be greater than zero and less than the total amount'; END IF;
  IF lower(coalesce(p_payment_method,'')) NOT IN ('cash','upi','card') THEN RAISE EXCEPTION 'Select a valid deposit payment method'; END IF;
  v_deposit_id := 'DEP-' || to_char(v_now at time zone 'Asia/Kolkata','YYYYMMDD') || '-' || lpad(nextval('public.deposit_number_seq')::text,4,'0');
  INSERT INTO public.advance_orders(deposit_id,customer_name,phone,address,product_name,products,category,description,total_amount,deposit_amount,expected_delivery_date,remarks,created_by,created_by_name,created_at,updated_at,branch)
  VALUES(v_deposit_id,trim(p_customer_name),trim(p_phone),trim(coalesce(p_address,'')),trim(p_product_name),CASE WHEN jsonb_typeof(coalesce(p_products,'[]'::jsonb))='array' THEN coalesce(p_products,'[]'::jsonb) ELSE '[]'::jsonb END,trim(coalesce(p_category,'')),trim(coalesce(p_description,'')),round(p_total_amount,2),round(p_deposit_amount,2),p_expected_delivery_date,trim(coalesce(p_remarks,'')),auth.uid(),trim(coalesce(p_created_by_name,'')),v_now,v_now,v_branch)
  RETURNING * INTO v_order;
  INSERT INTO public.advance_order_payments(advance_order_id,payment_type,amount,payment_method,remarks,received_by,received_at)
  VALUES(v_order.id,'deposit',v_order.deposit_amount,lower(p_payment_method),coalesce(p_remarks,''),auth.uid(),v_now);
  INSERT INTO public.advance_order_timeline(advance_order_id,event_type,label,created_by,created_at) VALUES
    (v_order.id,'created','Created',auth.uid(),v_now),
    (v_order.id,'deposit_received','Deposit Received',auth.uid(),v_now);
  RETURN v_order;
END;
$$;

-- complete_advance_order_v2  (from 20261010_0040_advance_order_completion_deducts_stock.sql)
CREATE OR REPLACE FUNCTION public.complete_advance_order_v2(
  p_order_id uuid,
  p_payment_method text,
  p_final_amount numeric,
  p_coupon_code text DEFAULT NULL,
  p_coupon_percentage numeric DEFAULT 0,
  p_manual_discount numeric DEFAULT 0,
  p_remarks text DEFAULT ''
)
RETURNS TABLE(order_id uuid, invoice_no text, completed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance        public.advance_orders;
  v_order_id       uuid := gen_random_uuid();
  v_invoice        text;
  v_now            timestamptz := now();
  v_items          jsonb;
  v_bill_items     jsonb;
  v_item           jsonb;
  v_total_discount numeric := 0;
  v_branch         text;
  v_raw_product    text;
  v_raw_variant    text;
  v_product_id     bigint;
  v_variant_id     uuid;
  v_quantity       numeric;
  v_name           text;
  v_stock          numeric;
  v_barcode_id     uuid;
  v_tracked        boolean;
BEGIN
  IF lower(coalesce(p_payment_method, '')) NOT IN ('cash', 'upi', 'card') THEN
    RAISE EXCEPTION 'Select a valid payment method';
  END IF;

  SELECT * INTO v_advance FROM public.advance_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advance order not found';
  END IF;

  -- The advance order's own branch is the single source of truth.
  v_branch := CASE WHEN v_advance.branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;

  IF v_advance.status = 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled order cannot be completed';
  END IF;

  IF v_advance.completed_order_id IS NOT NULL OR v_advance.invoice_number IS NOT NULL THEN
    IF v_advance.status != 'completed' THEN
      UPDATE public.advance_orders
      SET status = 'completed',
          updated_at = v_now
      WHERE id = p_order_id;
    END IF;

    RETURN QUERY SELECT
      coalesce(v_advance.completed_order_id, gen_random_uuid()),
      coalesce(v_advance.invoice_number, 'INV00000000'),
      coalesce(v_advance.completed_at, v_now);
    RETURN;
  END IF;

  v_total_discount := p_manual_discount + (v_advance.remaining_balance - p_manual_discount - p_final_amount);
  IF v_total_discount < 0 THEN
    v_total_discount := 0;
  END IF;

  v_items := CASE
    WHEN jsonb_typeof(v_advance.products) = 'array' AND jsonb_array_length(v_advance.products) > 0
      THEN v_advance.products
    ELSE jsonb_build_array(
      jsonb_build_object(
        'name',        v_advance.product_name,
        'category',    v_advance.category,
        'description', v_advance.description,
        'quantity',    1,
        'base_price',  v_advance.total_amount,
        'line_total',  v_advance.total_amount,
        'unit',        'piece',
        'unit_type',   'unit',
        'source',      'advance_order'
      )
    )
  END;
  v_bill_items := v_items;

  -- 1. Resolve each item against THIS counter's catalog, lock its stock
  --    row and make sure there is enough. Resolved ids are written back
  --    into v_items so the later steps never look outside the branch.
  FOR i IN 0 .. jsonb_array_length(v_items) - 1 LOOP
    v_item := v_items -> i;
    v_raw_product := btrim(coalesce(v_item ->> 'product_id', ''));
    v_raw_variant := btrim(coalesce(v_item ->> 'variant_id', ''));
    v_product_id := CASE WHEN v_raw_product ~ '^[0-9]+$' THEN v_raw_product::bigint END;
    v_variant_id := CASE
      WHEN v_raw_variant ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN v_raw_variant::uuid
    END;
    v_quantity := greatest(coalesce(nullif(v_item ->> 'quantity', '')::numeric, 1), 0);
    v_name := coalesce(nullif(btrim(v_item ->> 'name'), ''), 'Product');
    v_tracked := FALSE;
    v_stock := NULL;

    IF v_variant_id IS NOT NULL THEN
      SELECT pv.stock, pv.product_id INTO v_stock, v_product_id
      FROM public.product_variants pv
      WHERE pv.id = v_variant_id AND pv.branch = v_branch
      FOR UPDATE;
      IF NOT FOUND THEN
        v_variant_id := NULL;
        v_product_id := NULL;
      END IF;
    END IF;

    IF v_product_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = v_product_id AND p.branch = v_branch
    ) THEN
      v_product_id := NULL;
      v_variant_id := NULL;
    END IF;

    IF v_product_id IS NOT NULL
       AND NOT coalesce((v_item ->> 'is_manual')::boolean, FALSE)
       AND NOT EXISTS (
         SELECT 1 FROM public.products p
         WHERE p.id = v_product_id AND lower(btrim(coalesce(p.category, ''))) = 'unregistered'
       )
       AND v_quantity > 0 THEN
      v_tracked := TRUE;
      IF v_variant_id IS NULL THEN
        SELECT p.stock_quantity INTO v_stock
        FROM public.products p
        WHERE p.id = v_product_id AND p.branch = v_branch
        FOR UPDATE;
      END IF;

      IF coalesce(v_stock, 0) < v_quantity THEN
        RAISE EXCEPTION 'Not enough stock to complete this order: % (in stock: %, needed: %). Restock it in Inventory, then complete the order.',
          v_name, coalesce(v_stock, 0), v_quantity;
      END IF;
    END IF;

    v_items := jsonb_set(
      v_items, ARRAY[i::text],
      v_item || jsonb_build_object(
        '_product_id', v_product_id,
        '_variant_id', v_variant_id,
        '_tracked',    v_tracked
      )
    );
  END LOOP;

  -- 2. Bill, numbered from this counter's sequence.
  v_invoice := public.get_next_invoice_no(v_branch);

  INSERT INTO public.orders (
    id, invoice_no, customer_name, phone, address, user_id,
    items, subtotal, total, status, order_mode, order_type,
    shipping, delivery_charge, discount_amount, manual_discount_amount,
    coupon_code, coupon_percentage, manual_discount_type, manual_discount_value,
    payment_mode, payment_method, branch, created_at, updated_at
  ) VALUES (
    v_order_id, v_invoice,
    v_advance.customer_name, v_advance.phone, v_advance.address, auth.uid(),
    v_bill_items,
    v_advance.total_amount, greatest(0, v_advance.total_amount - v_total_discount),
    'completed', 'offline', 'advance_order',
    0, 0, v_total_discount, p_manual_discount,
    p_coupon_code, p_coupon_percentage, 'flat', p_manual_discount,
    lower(p_payment_method), lower(p_payment_method), v_branch,
    v_now, v_now
  );

  -- 3. Bill lines, stock deduction and stock ledger (all branch-scoped).
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    v_product_id := nullif(v_item ->> '_product_id', '')::bigint;
    v_variant_id := nullif(v_item ->> '_variant_id', '')::uuid;
    v_quantity := greatest(coalesce(nullif(v_item ->> 'quantity', '')::numeric, 1), 0);

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, variant_name, category,
      product_name, name, quantity, unit, unit_type,
      base_price, line_total, is_manual
    ) VALUES (
      v_order_id, v_product_id, v_variant_id, nullif(v_item ->> 'variant_name', ''),
      nullif(v_item ->> 'category', ''),
      coalesce(nullif(trim(v_item->>'name'), ''), 'Product'),
      coalesce(nullif(trim(v_item->>'name'), ''), 'Product'),
      v_quantity,
      coalesce(nullif(v_item->>'unit', ''), 'piece'),
      coalesce(nullif(v_item->>'unit_type', ''), 'unit'),
      greatest(coalesce((v_item->>'base_price')::numeric, 0), 0),
      greatest(coalesce((v_item->>'line_total')::numeric, 0), 0),
      false
    );

    CONTINUE WHEN NOT coalesce((v_item ->> '_tracked')::boolean, FALSE);

    IF v_variant_id IS NOT NULL THEN
      SELECT stock INTO v_stock FROM public.product_variants WHERE id = v_variant_id AND branch = v_branch;
      SELECT id INTO v_barcode_id FROM public.barcode_registry
      WHERE variant_id = v_variant_id AND branch = v_branch AND is_active = TRUE LIMIT 1;

      UPDATE public.product_variants
      SET stock = greatest(0, stock - v_quantity), updated_at = v_now
      WHERE id = v_variant_id AND branch = v_branch;

      UPDATE public.products
      SET stock_quantity = (SELECT coalesce(sum(stock), 0) FROM public.product_variants WHERE product_id = v_product_id AND branch = v_branch AND is_active = TRUE),
          stock = floor((SELECT coalesce(sum(stock), 0) FROM public.product_variants WHERE product_id = v_product_id AND branch = v_branch AND is_active = TRUE))::integer,
          updated_at = v_now
      WHERE id = v_product_id AND branch = v_branch;
    ELSE
      SELECT stock_quantity INTO v_stock FROM public.products WHERE id = v_product_id AND branch = v_branch;
      SELECT id INTO v_barcode_id FROM public.barcode_registry
      WHERE product_id = v_product_id AND variant_id IS NULL AND branch = v_branch AND is_active = TRUE LIMIT 1;

      UPDATE public.products
      SET stock_quantity = greatest(0, stock_quantity - v_quantity),
          stock = greatest(0, floor(stock_quantity - v_quantity))::integer,
          updated_at = v_now
      WHERE id = v_product_id AND branch = v_branch;
    END IF;

    INSERT INTO public.inventory_movements (
      product_id, variant_id, barcode_id, movement_type,
      quantity_delta, quantity_before, quantity_after,
      reference_type, reference_id, note, branch
    ) VALUES (
      v_product_id, v_variant_id, v_barcode_id, 'SALE',
      -v_quantity, v_stock, greatest(0, v_stock - v_quantity),
      'order', v_invoice, 'Advance order completed (' || v_advance.deposit_id || ')', v_branch
    );
  END LOOP;

  INSERT INTO public.advance_order_payments (
    advance_order_id, payment_type, amount, payment_method, remarks, received_by, received_at
  ) VALUES (
    p_order_id, 'remaining', p_final_amount,
    lower(p_payment_method), coalesce(p_remarks, ''), auth.uid(), v_now
  );

  UPDATE public.advance_orders SET
    status               = 'completed',
    completed_at         = v_now,
    completed_order_id   = v_order_id,
    invoice_number       = v_invoice,
    final_payment_method = lower(p_payment_method),
    remarks              = CASE WHEN trim(coalesce(p_remarks, '')) = '' THEN remarks ELSE p_remarks END,
    updated_at           = v_now
  WHERE id = p_order_id;

  INSERT INTO public.advance_order_timeline (
    advance_order_id, event_type, label, remarks, created_by, created_at
  ) VALUES
    (p_order_id, 'remaining_payment_received', 'Remaining Payment Received', coalesce(p_remarks, ''), auth.uid(), v_now),
    (p_order_id, 'invoice_generated',          'Invoice Generated',          v_invoice,               auth.uid(), v_now);

  RETURN QUERY SELECT v_order_id, v_invoice, v_now;
END;
$$;

-- update_advance_order_status  (from 20260918_0018_advance_order_self_heal.sql)
CREATE OR REPLACE FUNCTION public.update_advance_order_status(
  p_order_id uuid,
  p_status   text,
  p_remarks  text DEFAULT ''
)
RETURNS SETOF public.advance_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.advance_orders;
BEGIN
  SELECT * INTO v_order FROM public.advance_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advance order % not found', p_order_id;
  END IF;

  IF (v_order.invoice_number IS NOT NULL OR v_order.completed_order_id IS NOT NULL) AND p_status != 'completed' THEN
    RAISE EXCEPTION 'Cannot change status of an order that already has an invoice generated';
  END IF;

  UPDATE public.advance_orders SET
    status     = p_status,
    remarks    = CASE WHEN trim(coalesce(p_remarks,'')) = '' THEN remarks ELSE p_remarks END,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.advance_order_timeline (advance_order_id, event_type, label, remarks, created_by, created_at)
  VALUES (
    p_order_id,
    p_status,
    CASE p_status
      WHEN 'pending_deposit'       THEN 'Status: Pending Deposit'
      WHEN 'waiting_final_payment' THEN 'Status: Waiting for Final Payment'
      WHEN 'ready_for_delivery'    THEN 'Status: Ready to Collect'
      WHEN 'completed'             THEN 'Order Completed'
      WHEN 'cancelled'             THEN 'Order Cancelled'
      ELSE p_status
    END,
    coalesce(p_remarks, ''),
    auth.uid(),
    now()
  );

  RETURN QUERY SELECT * FROM public.advance_orders WHERE id = p_order_id;
END;
$$;

-- add_advance_order_event  (from 20260728_0010_final_audit_fixes.sql)
CREATE OR REPLACE FUNCTION public.add_advance_order_event(
  p_order_id   uuid,
  p_event_type text,
  p_label      text,
  p_remarks    text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.advance_order_timeline (advance_order_id, event_type, label, remarks, created_by, created_at)
  VALUES (p_order_id, p_event_type, p_label, coalesce(p_remarks,''), auth.uid(), now());
END;
$$;

-- create_barcode_and_receive_stock  (from 20261005_0034_repair_branch_aware_inventory_rpcs.sql)
CREATE OR REPLACE FUNCTION public.create_barcode_and_receive_stock(
  p_product_id BIGINT,
  p_variant_id UUID DEFAULT NULL,
  p_quantity_received NUMERIC DEFAULT 0,
  p_unit_cost NUMERIC DEFAULT NULL,
  p_created_by_name TEXT DEFAULT '',
  p_custom_barcode TEXT DEFAULT NULL,
  p_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type TEXT;
  v_barcode_id UUID;
  v_barcode_value TEXT;
  v_is_new_barcode BOOLEAN := FALSE;
  v_movement_type TEXT;
  v_qty_before NUMERIC := 0;
  v_qty_after NUMERIC := 0;
  v_prod_name TEXT;
  v_var_name TEXT := '';
  v_branch TEXT;
BEGIN
  IF p_quantity_received < 0 THEN
    RAISE EXCEPTION 'Quantity received cannot be negative';
  END IF;

  -- 1. Check Parent Product Exists (and capture its branch)
  SELECT name, branch INTO v_prod_name, v_branch FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', p_product_id;
  END IF;

  -- 2. Verify Variant Belongs to Product if Variant is Provided
  IF p_variant_id IS NOT NULL THEN
    v_entity_type := 'variant';
    SELECT variant_name, stock INTO v_var_name, v_qty_before
    FROM public.product_variants
    WHERE id = p_variant_id AND product_id = p_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % does not belong to Product %', p_variant_id, p_product_id;
    END IF;
  ELSE
    v_entity_type := 'product';
    SELECT stock_quantity INTO v_qty_before
    FROM public.products
    WHERE id = p_product_id;
  END IF;

  -- 3. Check for Existing Active Barcode in barcode_registry (SKU Identity)
  IF v_entity_type = 'variant' THEN
    SELECT id, barcode_value INTO v_barcode_id, v_barcode_value
    FROM public.barcode_registry
    WHERE variant_id = p_variant_id AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT id, barcode_value INTO v_barcode_id, v_barcode_value
    FROM public.barcode_registry
    WHERE product_id = p_product_id AND variant_id IS NULL AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- 4. Reuse Existing or Create New Barcode
  IF v_barcode_id IS NOT NULL THEN
    v_is_new_barcode := FALSE;
    v_movement_type := CASE WHEN v_qty_before = 0 THEN 'INITIAL_BARCODE_STOCK' ELSE 'RESTOCK' END;
  ELSE
    v_is_new_barcode := TRUE;
    v_movement_type := 'INITIAL_BARCODE_STOCK';
    v_barcode_value := COALESCE(NULLIF(UPPER(BTRIM(p_custom_barcode)), ''), public.generate_barcode_value(v_entity_type, v_branch));

    INSERT INTO public.barcode_registry (
      barcode_value, entity_type, product_id, variant_id, is_active, created_by_name, branch
    )
    VALUES (
      v_barcode_value, v_entity_type, p_product_id, p_variant_id, TRUE, COALESCE(p_created_by_name, ''), v_branch
    )
    RETURNING id INTO v_barcode_id;
  END IF;

  -- 5. Synchronize compatibility column on target table
  IF v_entity_type = 'variant' THEN
    UPDATE public.product_variants
    SET barcode = v_barcode_value, updated_at = NOW()
    WHERE id = p_variant_id;
  ELSE
    UPDATE public.products
    SET barcode = v_barcode_value, updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- 6. Apply Stock Increment & Parent Aggregate Sync
  v_qty_after := v_qty_before + p_quantity_received;

  IF p_quantity_received > 0 THEN
    IF v_entity_type = 'variant' THEN
      UPDATE public.product_variants
      SET stock = v_qty_after, updated_at = NOW()
      WHERE id = p_variant_id;

      -- Refresh parent aggregate stock cache
      UPDATE public.products
      SET stock_quantity = (
            SELECT COALESCE(SUM(stock), 0)
            FROM public.product_variants
            WHERE product_id = p_product_id AND is_active = TRUE
          ),
          stock = FLOOR((
            SELECT COALESCE(SUM(stock), 0)
            FROM public.product_variants
            WHERE product_id = p_product_id AND is_active = TRUE
          ))::INTEGER,
          updated_at = NOW()
      WHERE id = p_product_id;
    ELSE
      UPDATE public.products
      SET stock_quantity = v_qty_after,
          stock = FLOOR(v_qty_after)::INTEGER,
          updated_at = NOW()
      WHERE id = p_product_id;
    END IF;
  END IF;

  -- 7. Record Immutable Inventory Movement
  IF p_quantity_received > 0 THEN
    INSERT INTO public.inventory_movements (
      product_id, variant_id, barcode_id, movement_type,
      quantity_delta, quantity_before, quantity_after,
      unit_cost, reference_type, reference_id, note, created_by_name, branch
    )
    VALUES (
      p_product_id, p_variant_id, v_barcode_id, v_movement_type,
      p_quantity_received, v_qty_before, v_qty_after,
      p_unit_cost, 'barcode_receipt', v_barcode_value,
      COALESCE(p_note, ''), COALESCE(p_created_by_name, ''), v_branch
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'barcode_id', v_barcode_id,
    'barcode_value', v_barcode_value,
    'is_new_barcode', v_is_new_barcode,
    'movement_type', v_movement_type,
    'quantity_before', v_qty_before,
    'quantity_received', p_quantity_received,
    'quantity_after', v_qty_after,
    'product_id', p_product_id,
    'variant_id', p_variant_id,
    'product_name', v_prod_name,
    'variant_name', v_var_name
  );
END;
$$;

-- get_expense_summary_metrics  (from 20260930_0027_split_expenses_by_branch.sql)
CREATE OR REPLACE FUNCTION public.get_expense_summary_metrics(
  p_current_date DATE DEFAULT CURRENT_DATE,
  p_branch TEXT DEFAULT 'pos1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today NUMERIC(12,2) := 0;
  v_this_week NUMERIC(12,2) := 0;
  v_this_month NUMERIC(12,2) := 0;
  v_this_year NUMERIC(12,2) := 0;
  v_total_all_time NUMERIC(12,2) := 0;
  v_week_start DATE := date_trunc('week', p_current_date)::DATE;
  v_month_start DATE := date_trunc('month', p_current_date)::DATE;
  v_year_start DATE := date_trunc('year', p_current_date)::DATE;
  v_branch TEXT := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN expense_date = p_current_date THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN expense_date >= v_week_start AND expense_date <= p_current_date THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN expense_date >= v_month_start AND expense_date <= p_current_date THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN expense_date >= v_year_start AND expense_date <= p_current_date THEN amount ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO
    v_today, v_this_week, v_this_month, v_this_year, v_total_all_time
  FROM public.expenses
  WHERE branch = v_branch;

  RETURN jsonb_build_object(
    'today', v_today,
    'this_week', v_this_week,
    'this_month', v_this_month,
    'this_year', v_this_year,
    'total_all_time', v_total_all_time
  );
END;
$$;

-- 7. Restore YG's own triggers ----------------------------------------------

-- on_auth_user_created  (from 20260716_0001_purple_boutique_schema.sql)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- sync_product_category_name_trigger  (from 20260716_0001_purple_boutique_schema.sql)
DROP TRIGGER IF EXISTS sync_product_category_name_trigger ON public.products;
CREATE TRIGGER sync_product_category_name_trigger
BEFORE INSERT OR UPDATE OF category_id ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_category_name();

-- sync_category_name_to_products_trigger  (from 20260716_0001_purple_boutique_schema.sql)
DROP TRIGGER IF EXISTS sync_category_name_to_products_trigger ON public.categories;
CREATE TRIGGER sync_category_name_to_products_trigger
AFTER UPDATE OF name_en ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.sync_category_name_to_products();

-- ensure_one_default_variant_trigger  (from 20260716_0001_purple_boutique_schema.sql)
DROP TRIGGER IF EXISTS ensure_one_default_variant_trigger ON public.product_variants;
CREATE TRIGGER ensure_one_default_variant_trigger
AFTER INSERT OR UPDATE OF is_default ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.ensure_one_default_variant();

-- 8. Access for the app (same roles YG's migrations grant) -------------------

GRANT EXECUTE ON FUNCTION public.complete_pos_sale_with_inventory(TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, JSONB, NUMERIC, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_advance_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_advance_order_v2(UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_barcode_value(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_barcode_and_receive_stock(BIGINT, UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(BIGINT, UUID, NUMERIC, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_summary_metrics(DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_invoice_by_number(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_advance_order_status(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_advance_order_event(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 9. Verify -- any failure rolls back everything above -----------------------

DO $$
DECLARE
  v_missing TEXT;
  v_left TEXT;
BEGIN
  SELECT string_agg(x, ', ') INTO v_missing
  FROM unnest(ARRAY[
    'public.complete_pos_sale_with_inventory(text,text,text,jsonb,numeric,text,text,text,numeric,numeric,numeric,text,numeric,text,numeric,text,jsonb,numeric,boolean,text,text,timestamptz,text)',
    'public.create_order_with_stock(text,text,text,jsonb,numeric,text,text,text,numeric,numeric,numeric,text,numeric,text,numeric,numeric,boolean,text,jsonb,text)',
    'public.create_advance_order(text,text,text,text,text,text,numeric,numeric,date,text,text,text,jsonb,text)',
    'public.complete_advance_order_v2(uuid,text,numeric,text,numeric,numeric,text)',
    'public.generate_barcode_value(text,text)',
    'public.create_barcode_and_receive_stock(bigint,uuid,numeric,numeric,text,text,text)',
    'public.adjust_inventory_stock(bigint,uuid,numeric,text,text,text)',
    'public.get_expense_summary_metrics(date,text)',
    'public.get_public_invoice_by_number(text)',
    'public.update_advance_order_status(uuid,text,text)',
    'public.add_advance_order_event(uuid,text,text,text)',
    'public.get_next_invoice_no(text)',
    'public.delete_inventory_item(bigint,uuid,text)',
    'public.is_admin()', 'public.touch_updated_at()', 'public.handle_new_user()',
    'public.sync_product_category_name()', 'public.sync_category_name_to_products()',
    'public.ensure_one_default_variant()'
  ]) AS x
  WHERE to_regprocedure(x) IS NULL;
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'YG function(s) not restored: %', v_missing;
  END IF;

  -- Exactly one version of each restored RPC (no jewellery overload left).
  SELECT string_agg(proname, ', ') INTO v_left FROM (
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'complete_pos_sale_with_inventory', 'create_order_with_stock', 'create_advance_order',
      'complete_advance_order_v2', 'generate_barcode_value', 'create_barcode_and_receive_stock',
      'adjust_inventory_stock', 'get_expense_summary_metrics', 'get_public_invoice_by_number',
      'update_advance_order_status', 'add_advance_order_event')
    GROUP BY p.proname HAVING count(*) > 1) d;
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'Extra versions still installed: %', v_left;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_advance_order_v2'
                 AND prosrc ILIKE '%Not enough stock to complete this order%') THEN
    RAISE EXCEPTION 'complete_advance_order_v2 is not the stock-deducting version';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('complete_pos_sale_with_inventory', 'create_order_with_stock')
             AND prosrc ~ 'WHERE UPPER\(BTRIM\(code\)\) = UPPER\(BTRIM\(p_coupon_code\)\)(?! AND branch = v_branch)') THEN
    RAISE EXCEPTION 'Checkout still counts coupon use on both POS';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_stock_trigger') THEN
    RAISE EXCEPTION 'orders_stock_trigger is still installed';
  END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgname IN (
        'enforce_variant_branch_trigger', 'enforce_barcode_registry_branch_trigger',
        'enforce_inventory_movement_branch_trigger', 'on_auth_user_created',
        'sync_product_category_name_trigger', 'sync_category_name_to_products_trigger',
        'ensure_one_default_variant_trigger')) <> 7 THEN
    RAISE EXCEPTION 'A YG trigger is missing';
  END IF;

  IF to_regclass('public.coupons_code_upper_unique') IS NOT NULL
     OR to_regclass('public.categories_name_en_key') IS NOT NULL
     OR to_regclass('public.barcode_registry_barcode_value_key') IS NOT NULL THEN
    RAISE EXCEPTION 'A cross-POS uniqueness rule is still installed';
  END IF;
  IF to_regclass('public.coupons_branch_code_upper_unique') IS NULL
     OR to_regclass('public.barcode_registry_branch_value_unique') IS NULL
     OR to_regclass('public.categories_branch_name_unique') IS NULL THEN
    RAISE EXCEPTION 'A per-POS uniqueness rule is missing';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
