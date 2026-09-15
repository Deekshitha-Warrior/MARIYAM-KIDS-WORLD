-- ====================================================
-- CLAD RETAIL: CONSOLIDATED MIGRATIONS 0019 - 0026
-- ====================================================

-- >>> FILE: 20260915_0019_organization_and_branches.sql <<<
-- Migration: 20260915_0019_organization_and_branches.sql
-- Description: Creates organizations, branches, branch_memberships, and updates profiles for multi-branch support

BEGIN;

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  branch_type TEXT NOT NULL DEFAULT 'retail',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- 3. Branch Memberships Table
CREATE TABLE IF NOT EXISTS public.branch_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, branch_id)
);

-- 4. Update profiles role constraint & add default_branch_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'customer', 'staff'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_branches_organization ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(code);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_user ON public.branch_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_branch ON public.branch_memberships(branch_id);

-- 6. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_memberships ENABLE ROW LEVEL SECURITY;

-- Temporary open read policy for setup (to be replaced in 0023 with strict branch auth)
DROP POLICY IF EXISTS org_read ON public.organizations;
CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated, anon USING (is_active = TRUE);

DROP POLICY IF EXISTS branches_read ON public.branches;
CREATE POLICY branches_read ON public.branches FOR SELECT TO authenticated, anon USING (is_active = TRUE);

DROP POLICY IF EXISTS memberships_self_read ON public.branch_memberships;
CREATE POLICY memberships_self_read ON public.branch_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());

COMMIT;


-- >>> FILE: 20260915_0020_branch_columns.sql <<<
-- Migration: 20260915_0020_branch_columns.sql
-- Description: Adds nullable branch_id UUID column to all operational and settings tables

BEGIN;

-- Core Catalog & Inventory
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Barcode System
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_registry') THEN
    ALTER TABLE public.barcode_registry ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_custom_sizes') THEN
    ALTER TABLE public.barcode_custom_sizes ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
END $$;

-- Orders & Billing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Advance Orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_orders') THEN
    ALTER TABLE public.advance_orders ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_order_timeline') THEN
    ALTER TABLE public.advance_order_timeline ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_order_payments') THEN
    ALTER TABLE public.advance_order_payments ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
END $$;

-- Expenses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
END $$;

-- Settings & Promotions
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS branch_id UUID;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_reviews') THEN
    ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS branch_id UUID;
  END IF;
END $$;

COMMIT;


-- >>> FILE: 20260915_0021_seed_branches_and_backfill.sql <<<
-- Migration: 20260915_0021_seed_branches_and_backfill.sql
-- Description: Seeds CLAD RETAIL organization, TEXTILE and GROCERY branches, backfills existing data to TEXTILE, and seeds grocery store settings

BEGIN;

-- 1. Deterministic Organization & Branch UUIDs
-- Org: a0000000-0000-0000-0000-000000000001 (CLAD RETAIL)
-- Textile Branch: b0000000-0000-0000-0000-000000000001 (CLAD TEXTILE)
-- Grocery Branch: b0000000-0000-0000-0000-000000000002 (CLAD GROCERY)

INSERT INTO public.organizations (id, name, code, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'CLAD RETAIL', 'CLAD', TRUE)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.branches (id, organization_id, code, name, branch_type, is_active)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TEXTILE', 'CLAD TEXTILE', 'retail', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'GROCERY', 'CLAD GROCERY', 'grocery', TRUE)
ON CONFLICT (organization_id, code) DO UPDATE 
SET name = EXCLUDED.name, branch_type = EXCLUDED.branch_type, is_active = TRUE;

-- 2. Backfill Existing Data to TEXTILE Branch (b0000000-0000-0000-0000-000000000001)
UPDATE public.categories SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.products SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.product_variants SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.inventory_movements SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.orders SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- Backfill order_items through orders or direct
UPDATE public.order_items oi
SET branch_id = COALESCE(o.branch_id, 'b0000000-0000-0000-0000-000000000001')
FROM public.orders o
WHERE oi.order_id = o.id AND oi.branch_id IS NULL;

UPDATE public.order_items SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- Backfill other operational tables if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_registry') THEN
    UPDATE public.barcode_registry SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_custom_sizes') THEN
    UPDATE public.barcode_custom_sizes SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_orders') THEN
    UPDATE public.advance_orders SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_order_timeline') THEN
    UPDATE public.advance_order_timeline SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_order_payments') THEN
    UPDATE public.advance_order_payments SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    UPDATE public.expenses SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_reviews') THEN
    UPDATE public.store_reviews SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
  END IF;
END $$;

UPDATE public.coupons SET branch_id = 'b0000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 3. Branch Store Settings
-- Update existing store_settings for TEXTILE
UPDATE public.store_settings 
SET branch_id = 'b0000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

-- Insert store_settings for GROCERY branch if not present
INSERT INTO public.store_settings (name, owner_name, phone, email, address, gst_enabled, branch_id)
SELECT 'CLAD GROCERY', 'CLAD RETAIL', '9876543210', 'grocery@clad.com', '1892 A, Bypass Road, Sevoor, Arani - 632316', FALSE, 'b0000000-0000-0000-0000-000000000002'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings WHERE branch_id = 'b0000000-0000-0000-0000-000000000002');

-- 4. Initial Seed Categories for GROCERY Branch
INSERT INTO public.categories (name_en, name_ta, is_active, sort_order, branch_id)
VALUES
  ('Rice & Grains', 'அரிசி மற்றும் தானியங்கள்', TRUE, 1, 'b0000000-0000-0000-0000-000000000002'),
  ('Oils & Ghee', 'எண்ணெய் & நெய்', TRUE, 2, 'b0000000-0000-0000-0000-000000000002'),
  ('Spices & Masalas', 'மசாலா பொருட்கள்', TRUE, 3, 'b0000000-0000-0000-0000-000000000002'),
  ('Snacks & Beverages', 'தின்பண்டங்கள் மற்றும் பானங்கள்', TRUE, 4, 'b0000000-0000-0000-0000-000000000002'),
  ('Household & Cleaning', 'வீட்டு உபயோக பொருட்கள்', TRUE, 5, 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

COMMIT;


-- >>> FILE: 20260915_0022_branch_constraints_and_indexes.sql <<<
-- Migration: 20260915_0022_branch_constraints_and_indexes.sql
-- Description: Adds NOT NULL, foreign keys, indexes, and branch-scoped unique constraints

BEGIN;

-- 1. Foreign Keys and NOT NULL on Core Tables
ALTER TABLE public.categories 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_categories_branch,
  ADD CONSTRAINT fk_categories_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.products 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_products_branch,
  ADD CONSTRAINT fk_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.product_variants 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_variants_branch,
  ADD CONSTRAINT fk_variants_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_orders_branch,
  ADD CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.order_items 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_order_items_branch,
  ADD CONSTRAINT fk_order_items_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_movements 
  ALTER COLUMN branch_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS fk_inventory_movements_branch,
  ADD CONSTRAINT fk_inventory_movements_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- Optional operational tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_registry') THEN
    ALTER TABLE public.barcode_registry 
      ALTER COLUMN branch_id SET NOT NULL,
      DROP CONSTRAINT IF EXISTS fk_barcode_registry_branch,
      ADD CONSTRAINT fk_barcode_registry_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    ALTER TABLE public.expenses 
      ALTER COLUMN branch_id SET NOT NULL,
      DROP CONSTRAINT IF EXISTS fk_expenses_branch,
      ADD CONSTRAINT fk_expenses_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advance_orders') THEN
    ALTER TABLE public.advance_orders 
      ALTER COLUMN branch_id SET NOT NULL,
      DROP CONSTRAINT IF EXISTS fk_advance_orders_branch,
      ADD CONSTRAINT fk_advance_orders_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.store_settings 
  DROP CONSTRAINT IF EXISTS fk_store_settings_branch,
  ADD CONSTRAINT fk_store_settings_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- 2. Scoped Unique Constraints
-- Categories: unique per branch
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_en_key;
DROP INDEX IF EXISTS idx_categories_branch_name;
CREATE UNIQUE INDEX idx_categories_branch_name ON public.categories (branch_id, lower(trim(name_en)));

-- Products: unique per branch and category
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_name_unique;
DROP INDEX IF EXISTS idx_products_branch_category_name;
CREATE UNIQUE INDEX idx_products_branch_category_name ON public.products (branch_id, category_id, lower(trim(name)));

-- 3. High-performance Branch Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_branch ON public.order_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_created ON public.orders(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_branch ON public.products(branch_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_branch ON public.product_variants(branch_id);
CREATE INDEX IF NOT EXISTS idx_categories_branch ON public.categories(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch ON public.inventory_movements(branch_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_branch ON public.expenses(branch_id);
  END IF;
END $$;

COMMIT;


-- >>> FILE: 20260915_0023_branch_auth_and_rls.sql <<<
-- Migration: 20260915_0023_branch_auth_and_rls.sql
-- Description: Central authorization functions and branch-isolated Row Level Security (RLS) policies

BEGIN;

-- 1. Private Security Schema & Auth Helpers
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.user_is_admin() 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = '' 
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.user_can_access_branch(p_branch_id UUID) 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = '' 
STABLE AS $$
  SELECT (SELECT private.user_is_admin())
  OR EXISTS (
    SELECT 1 FROM public.branch_memberships bm
    WHERE bm.user_id = (SELECT auth.uid())
      AND bm.branch_id = p_branch_id
      AND bm.is_active = TRUE
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.user_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.user_can_access_branch(UUID) TO authenticated, anon;

-- 2. Drop Obsolete Broad Policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.inventory_movements;
DROP POLICY IF EXISTS inventory_movements_all ON public.inventory_movements;
DROP POLICY IF EXISTS expenses_all ON public.expenses;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS barcode_registry_all ON public.barcode_registry;
DROP POLICY IF EXISTS barcode_custom_sizes_all ON public.barcode_custom_sizes;
DROP POLICY IF EXISTS "orders_portal_manage" ON public.orders;
DROP POLICY IF EXISTS "order_items_portal_manage" ON public.order_items;

-- 3. Branch-Scoped RLS: Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_branch_select ON public.categories;
CREATE POLICY categories_branch_select ON public.categories
  FOR SELECT TO authenticated, anon
  USING (is_active = TRUE OR (SELECT private.user_can_access_branch(branch_id)));

DROP POLICY IF EXISTS categories_branch_modify ON public.categories;
CREATE POLICY categories_branch_modify ON public.categories
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

-- 4. Branch-Scoped RLS: Products & Variants
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_branch_select ON public.products;
CREATE POLICY products_branch_select ON public.products
  FOR SELECT TO authenticated, anon
  USING (is_active = TRUE OR (SELECT private.user_can_access_branch(branch_id)));

DROP POLICY IF EXISTS products_branch_modify ON public.products;
CREATE POLICY products_branch_modify ON public.products
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS variants_branch_select ON public.product_variants;
CREATE POLICY variants_branch_select ON public.product_variants
  FOR SELECT TO authenticated, anon
  USING (is_active = TRUE OR (SELECT private.user_can_access_branch(branch_id)));

DROP POLICY IF EXISTS variants_branch_modify ON public.product_variants;
CREATE POLICY variants_branch_modify ON public.product_variants
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

-- 5. Branch-Scoped RLS: Orders & Order Items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_branch_policy ON public.orders;
CREATE POLICY orders_branch_policy ON public.orders
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_items_branch_policy ON public.order_items;
CREATE POLICY order_items_branch_policy ON public.order_items
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

-- 6. Branch-Scoped RLS: Inventory Movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_movements_branch_policy ON public.inventory_movements;
CREATE POLICY inventory_movements_branch_policy ON public.inventory_movements
  FOR ALL TO authenticated
  USING ((SELECT private.user_can_access_branch(branch_id)))
  WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));

-- 7. Branch-Scoped RLS: Expenses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS expenses_branch_policy ON public.expenses;
    CREATE POLICY expenses_branch_policy ON public.expenses
      FOR ALL TO authenticated
      USING ((SELECT private.user_can_access_branch(branch_id)))
      WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));
  END IF;
END $$;

-- 8. Branch-Scoped RLS: Barcode Registry
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_registry') THEN
    ALTER TABLE public.barcode_registry ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS barcode_registry_branch_policy ON public.barcode_registry;
    CREATE POLICY barcode_registry_branch_policy ON public.barcode_registry
      FOR ALL TO authenticated
      USING ((SELECT private.user_can_access_branch(branch_id)))
      WITH CHECK ((SELECT private.user_can_access_branch(branch_id)));
  END IF;
END $$;

COMMIT;


-- >>> FILE: 20260915_0024_branch_aware_pos_rpcs.sql <<<
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


-- >>> FILE: 20260915_0025_branch_invoice_counters.sql <<<
-- Migration: 20260915_0025_branch_invoice_counters.sql
-- Description: Branch-specific invoice sequence counters (TX-100001, GR-100001)

BEGIN;

CREATE TABLE IF NOT EXISTS public.branch_invoice_counters (
  branch_id UUID PRIMARY KEY REFERENCES public.branches(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  next_number BIGINT NOT NULL DEFAULT 100001,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial counters for Textile and Grocery
INSERT INTO public.branch_invoice_counters (branch_id, prefix, next_number)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'TX-', 100001),
  ('b0000000-0000-0000-0000-000000000002', 'GR-', 100001)
ON CONFLICT (branch_id) DO NOTHING;

-- Function: Atomic Branch Invoice Number Generator
CREATE OR REPLACE FUNCTION public.generate_branch_invoice_number(p_branch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_num BIGINT;
  v_invoice TEXT;
BEGIN
  -- Atomically select and lock row
  SELECT prefix, next_number 
  INTO v_prefix, v_num 
  FROM public.branch_invoice_counters 
  WHERE branch_id = p_branch_id 
  FOR UPDATE;

  -- Fallback if not configured for this branch
  IF v_prefix IS NULL THEN
    v_prefix := 'INV-';
    v_num := 100001;
    INSERT INTO public.branch_invoice_counters (branch_id, prefix, next_number)
    VALUES (p_branch_id, v_prefix, v_num + 1)
    ON CONFLICT (branch_id) DO UPDATE SET next_number = branch_invoice_counters.next_number + 1;
  ELSE
    UPDATE public.branch_invoice_counters
    SET next_number = next_number + 1, updated_at = NOW()
    WHERE branch_id = p_branch_id;
  END IF;

  v_invoice := v_prefix || LPAD(v_num::TEXT, 6, '0');
  RETURN v_invoice;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_branch_invoice_number(UUID) TO authenticated, anon;

COMMIT;


-- >>> FILE: 20260915_0026_admin_analytics.sql <<<
-- Migration: 20260915_0026_admin_analytics.sql
-- Description: Aggregated database analytics functions for the Admin Orchestrator

BEGIN;

-- 1. Global Admin Overview RPC
CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_total_sales NUMERIC := 0;
  v_total_bills BIGINT := 0;
  v_total_expenses NUMERIC := 0;
  v_branches_json JSONB;
BEGIN
  -- Aggregate today's overall metrics
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(id)
  INTO v_total_sales, v_total_bills
  FROM public.orders
  WHERE status != 'cancelled' AND created_at >= v_today_start;

  -- Aggregate today's expenses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM public.expenses
    WHERE created_at >= v_today_start;
  END IF;

  -- Per-branch breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'branch_id', b.id,
      'code', b.code,
      'name', b.name,
      'branch_type', b.branch_type,
      'is_active', b.is_active,
      'today_sales', COALESCE(ord.today_sales, 0),
      'today_bills', COALESCE(ord.today_bills, 0),
      'low_stock_count', COALESCE(stk.low_stock_count, 0),
      'total_products', COALESCE(stk.total_products, 0)
    )
  ) INTO v_branches_json
  FROM public.branches b
  LEFT JOIN (
    SELECT 
      branch_id,
      SUM(total) AS today_sales,
      COUNT(id) AS today_bills
    FROM public.orders
    WHERE status != 'cancelled' AND created_at >= v_today_start
    GROUP BY branch_id
  ) ord ON ord.branch_id = b.id
  LEFT JOIN (
    SELECT 
      branch_id,
      COUNT(id) AS total_products,
      COUNT(id) FILTER (WHERE stock_quantity <= COALESCE(low_stock_alert, 5)) AS low_stock_count
    FROM public.products
    WHERE is_active = TRUE
    GROUP BY branch_id
  ) stk ON stk.branch_id = b.id;

  RETURN jsonb_build_object(
    'today_sales', v_total_sales,
    'today_bills', v_total_bills,
    'today_expenses', v_total_expenses,
    'branches', COALESCE(v_branches_json, '[]'::JSONB),
    'generated_at', NOW()
  );
END;
$$;

-- 2. Single Branch Dashboard Deep-Dive RPC
CREATE OR REPLACE FUNCTION public.get_branch_dashboard(p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_today_sales NUMERIC := 0;
  v_today_bills BIGINT := 0;
  v_avg_bill NUMERIC := 0;
  v_inventory_value NUMERIC := 0;
  v_low_stock_count BIGINT := 0;
  v_top_products JSONB;
  v_recent_alerts JSONB;
  v_daily_sales JSONB;
  v_branch_info JSONB;
BEGIN
  -- Branch Details
  SELECT jsonb_build_object('id', id, 'code', code, 'name', name, 'branch_type', branch_type)
  INTO v_branch_info
  FROM public.branches
  WHERE id = p_branch_id;

  IF v_branch_info IS NULL THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  -- Today's sales
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(id)
  INTO v_today_sales, v_today_bills
  FROM public.orders
  WHERE branch_id = p_branch_id AND status != 'cancelled' AND created_at >= v_today_start;

  IF v_today_bills > 0 THEN
    v_avg_bill := ROUND(v_today_sales / v_today_bills, 2);
  END IF;

  -- Inventory retail valuation & low stock count
  SELECT 
    COALESCE(SUM(stock_quantity * price), 0),
    COUNT(id) FILTER (WHERE stock_quantity <= COALESCE(low_stock_alert, 5))
  INTO v_inventory_value, v_low_stock_count
  FROM public.products
  WHERE branch_id = p_branch_id AND is_active = TRUE;

  -- Top 5 selling items in last 30 days
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', oi.product_name,
      'quantity_sold', oi.sold_qty,
      'total_amount', oi.sold_amount
    )
  ) INTO v_top_products
  FROM (
    SELECT 
      product_name,
      SUM(quantity) AS sold_qty,
      SUM(line_total) AS sold_amount
    FROM public.order_items
    WHERE branch_id = p_branch_id AND created_at >= (NOW() - INTERVAL '30 days')
    GROUP BY product_name
    ORDER BY sold_qty DESC
    LIMIT 5
  ) oi;

  -- Items currently at or below low stock alert
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'stock_quantity', p.stock_quantity,
      'low_stock_alert', COALESCE(p.low_stock_alert, 5)
    )
  ) INTO v_recent_alerts
  FROM (
    SELECT id, name, stock_quantity, low_stock_alert
    FROM public.products
    WHERE branch_id = p_branch_id AND is_active = TRUE 
      AND stock_quantity <= COALESCE(low_stock_alert, 5)
    ORDER BY stock_quantity ASC
    LIMIT 8
  ) p;

  -- 7-Day sales breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.day_str,
      'sales', COALESCE(ord.day_sales, 0),
      'bills', COALESCE(ord.day_bills, 0)
    )
  ) INTO v_daily_sales
  FROM (
    SELECT to_char(d, 'YYYY-MM-DD') AS day_str, date_trunc('day', d) AS day_ts
    FROM generate_series(NOW() - INTERVAL '6 days', NOW(), INTERVAL '1 day') d
  ) ds
  LEFT JOIN (
    SELECT 
      date_trunc('day', created_at) AS day_ts,
      SUM(total) AS day_sales,
      COUNT(id) AS day_bills
    FROM public.orders
    WHERE branch_id = p_branch_id AND status != 'cancelled' AND created_at >= (NOW() - INTERVAL '7 days')
    GROUP BY date_trunc('day', created_at)
  ) ord ON ord.day_ts = ds.day_ts;

  RETURN jsonb_build_object(
    'branch', v_branch_info,
    'today_sales', v_today_sales,
    'today_bills', v_today_bills,
    'avg_bill', v_avg_bill,
    'inventory_value', v_inventory_value,
    'low_stock_count', v_low_stock_count,
    'top_products', COALESCE(v_top_products, '[]'::JSONB),
    'alerts', COALESCE(v_recent_alerts, '[]'::JSONB),
    'daily_sales', COALESCE(v_daily_sales, '[]'::JSONB),
    'generated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_branch_dashboard(UUID) TO authenticated, anon;

COMMIT;


