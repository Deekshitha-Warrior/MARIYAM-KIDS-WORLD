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
