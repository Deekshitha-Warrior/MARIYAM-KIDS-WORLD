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
