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
