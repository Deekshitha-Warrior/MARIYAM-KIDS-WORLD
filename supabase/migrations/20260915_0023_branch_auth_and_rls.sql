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
