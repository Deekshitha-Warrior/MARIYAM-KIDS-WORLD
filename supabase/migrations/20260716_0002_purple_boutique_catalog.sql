-- YG Enterprises initial catalog. Existing matching products are preserved.
--
-- ============================================================================
-- IDEMPOTENCE / DELETION SAFETY  (see migration 0036)
-- ============================================================================
-- An earlier version guarded the product insert with a NAME-based
-- `WHERE NOT EXISTS (SELECT 1 FROM products WHERE <same name>)` check.
-- That guard is name-based, not run-based: once an operator DELETES a
-- seeded product the row is gone, the NOT EXISTS check passes again, and
-- re-running this file silently RE-CREATED the deleted product at its
-- placeholder price and 999 opening stock. Deleting a catalog item was
-- therefore not durable.
--
-- Every statement below is now additionally gated on public.seed_ledger, a
-- run-once marker table created by migration 0036. Once this seed has run
-- once, re-running the file is a complete no-op no matter what has since
-- been deleted, so operator deletions stay permanent.
--
-- On a brand-new database public.seed_ledger does not exist yet (0036 has
-- not run), so the DO block below creates it empty, the marker row is absent,
-- and all guards evaluate to TRUE -- the seed runs normally.
-- ============================================================================

-- Marker row for THIS seed. The plpgsql DO block only creates the table
-- when it is missing (fresh-database bootstrap) and never inserts the
-- marker itself, so the guards below decide whether the seed runs.
DO $$
BEGIN
  IF to_regclass('public.seed_ledger') IS NULL THEN
    CREATE TABLE public.seed_ledger (
      seed_key   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

INSERT INTO public.categories (name_en, name_ta, is_active, sort_order)
SELECT v.name_en, v.name_ta, TRUE, v.sort_order
FROM (VALUES
  ('Tailoring', '', 1),
  ('Jewellery & Accessories', '', 2),
  ('Posstore', '', 3)
) AS v(name_en, name_ta, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.seed_ledger WHERE seed_key = '20260716_0002_purple_boutique_catalog'
)
ON CONFLICT (name_en) DO UPDATE SET
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

WITH catalog(category_name, product_name, sort_order) AS (
  VALUES
    ('Tailoring', 'Saree Blouse', 101),
    ('Tailoring', 'Saree Blouse + Cup', 102),
    ('Tailoring', 'Readymade Saree', 103),
    ('Tailoring', 'Punjabi Suit', 104),
    ('Tailoring', 'Punjabi Suit + Salwar', 105),
    ('Tailoring', 'Baju Kurung', 106),
    ('Tailoring', 'Baju Kebaya', 107),
    ('Tailoring', 'Baju Melaya', 108),
    ('Tailoring', 'Lehelga', 109),
    ('Tailoring', 'Alterations', 110),
    ('Tailoring', 'Pavadai Sattai', 111),
    ('Tailoring', 'Designs', 112),
    ('Tailoring', 'Add-ons', 113),
    ('Jewellery & Accessories', 'Earrings', 201),
    ('Jewellery & Accessories', 'Bridal Jewellery Rent', 202),
    ('Jewellery & Accessories', 'Choker Set', 203),
    ('Jewellery & Accessories', 'Anklet', 204),
    ('Jewellery & Accessories', 'Add-ons', 205),
    ('Posstore', 'Claim Parcel', 301),
    ('Posstore', 'Perfume', 302),
    ('Posstore', 'Add-ons', 303)
), resolved AS (
  SELECT c.id AS category_id, c.name_en AS category_name, catalog.product_name, catalog.sort_order
  FROM catalog
  JOIN public.categories c ON LOWER(c.name_en) = LOWER(catalog.category_name)
)
INSERT INTO public.products (
  name, category, category_id, price, purchase_price, mrp, unit_type, unit_label,
  unit, base_quantity, stock_quantity, opening_stock, stock, stock_unit,
  allow_decimal_quantity, predefined_options, description, is_active, sort_order
)
SELECT
  resolved.product_name,
  resolved.category_name,
  resolved.category_id,
  0,
  0,
  0,
  'unit',
  'piece',
  'piece',
  1,
  999,
  999,
  999,
  'piece',
  FALSE,
  '[]'::JSONB,
  resolved.product_name || ' service or product',
  TRUE,
  resolved.sort_order
FROM resolved
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE p.category_id = resolved.category_id
    AND LOWER(BTRIM(p.name)) = LOWER(BTRIM(resolved.product_name))
)
AND NOT EXISTS (
  SELECT 1 FROM public.seed_ledger WHERE seed_key = '20260716_0002_purple_boutique_catalog'
);

UPDATE public.products p
SET is_active = TRUE,
    category = c.name_en,
    updated_at = NOW()
FROM public.categories c
WHERE p.category_id = c.id
  AND c.name_en IN ('Tailoring', 'Jewellery & Accessories', 'Posstore')
  AND NOT EXISTS (
    SELECT 1 FROM public.seed_ledger WHERE seed_key = '20260716_0002_purple_boutique_catalog'
  );

WITH catalog(category_name, product_name, sort_order) AS (
  VALUES
    ('Tailoring', 'Saree Blouse', 101),
    ('Tailoring', 'Saree Blouse + Cup', 102),
    ('Tailoring', 'Readymade Saree', 103),
    ('Tailoring', 'Punjabi Suit', 104),
    ('Tailoring', 'Punjabi Suit + Salwar', 105),
    ('Tailoring', 'Baju Kurung', 106),
    ('Tailoring', 'Baju Kebaya', 107),
    ('Tailoring', 'Baju Melaya', 108),
    ('Tailoring', 'Lehelga', 109),
    ('Tailoring', 'Alterations', 110),
    ('Tailoring', 'Pavadai Sattai', 111),
    ('Tailoring', 'Designs', 112),
    ('Tailoring', 'Add-ons', 113),
    ('Jewellery & Accessories', 'Earrings', 201),
    ('Jewellery & Accessories', 'Bridal Jewellery Rent', 202),
    ('Jewellery & Accessories', 'Choker Set', 203),
    ('Jewellery & Accessories', 'Anklet', 204),
    ('Jewellery & Accessories', 'Add-ons', 205),
    ('Posstore', 'Claim Parcel', 301),
    ('Posstore', 'Perfume', 302),
    ('Posstore', 'Add-ons', 303)
)
UPDATE public.products p
SET name = catalog.product_name,
    sort_order = catalog.sort_order,
    updated_at = NOW()
FROM catalog
JOIN public.categories c ON LOWER(c.name_en) = LOWER(catalog.category_name)
WHERE p.category_id = c.id
  AND LOWER(BTRIM(p.name)) = LOWER(BTRIM(catalog.product_name))
  AND NOT EXISTS (
    SELECT 1 FROM public.seed_ledger WHERE seed_key = '20260716_0002_purple_boutique_catalog'
  );

-- Mark this seed as applied. From now on every guard above is a no-op, so a
-- future re-run can never resurrect a product an operator has deleted.
INSERT INTO public.seed_ledger (seed_key)
VALUES ('20260716_0002_purple_boutique_catalog')
ON CONFLICT (seed_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
