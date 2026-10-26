-- =========================================================================
-- Migration 0045: Ensure purchase_price and low_stock_alert exist on products & variants
-- (purchase_price is the single unified column for cost / purchase price)
-- =========================================================================

-- 1. Ensure columns exist on public.products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS low_stock_alert NUMERIC(12,3) DEFAULT 5;

-- 2. Ensure columns exist on public.product_variants table
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS low_stock_alert NUMERIC(12,3) DEFAULT 5;

-- 3. If a separate cost_price column was created earlier, migrate its values into purchase_price and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cost_price'
  ) THEN
    UPDATE public.products 
    SET purchase_price = cost_price 
    WHERE (purchase_price IS NULL OR purchase_price = 0) AND cost_price > 0;

    ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'cost_price'
  ) THEN
    UPDATE public.product_variants 
    SET purchase_price = cost_price 
    WHERE (purchase_price IS NULL OR purchase_price = 0) AND cost_price > 0;

    ALTER TABLE public.product_variants DROP COLUMN IF EXISTS cost_price CASCADE;
  END IF;
END $$;

-- 4. Clean up any NULL or invalid values
UPDATE public.products
SET purchase_price = 0
WHERE purchase_price IS NULL;

UPDATE public.products
SET low_stock_alert = 5
WHERE low_stock_alert IS NULL OR low_stock_alert <= 0;

UPDATE public.product_variants
SET purchase_price = 0
WHERE purchase_price IS NULL;

UPDATE public.product_variants
SET low_stock_alert = 5
WHERE low_stock_alert IS NULL OR low_stock_alert <= 0;

-- 5. Enforce DEFAULTs and NOT NULL constraints on public.products
ALTER TABLE public.products
ALTER COLUMN purchase_price SET DEFAULT 0,
ALTER COLUMN purchase_price SET NOT NULL,
ALTER COLUMN low_stock_alert SET DEFAULT 5,
ALTER COLUMN low_stock_alert SET NOT NULL;

ALTER TABLE public.product_variants
ALTER COLUMN purchase_price SET DEFAULT 0;

-- 6. Reload PostgREST schema cache so Supabase immediately recognizes the columns
NOTIFY pgrst, 'reload schema';
