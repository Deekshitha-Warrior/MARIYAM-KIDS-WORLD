-- ====================================================================
-- VERIFY_BRANCH_ISOLATION.sql  (READ-ONLY — safe to run any time)
--
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Every row of the first result set is one isolation check:
--   violations = 0  -> that area is clean
--   violations > 0  -> that area has cross-branch contamination
--
-- It never writes or deletes anything.
-- ====================================================================

WITH
-- Catalog: every product / variant must belong to exactly one counter
q_variants_wrong_branch AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.product_variants v
  JOIN public.products p ON p.id = v.product_id
  WHERE v.branch <> p.branch
),
q_movements_wrong_branch AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.inventory_movements m
  LEFT JOIN public.products p ON p.id = m.product_id
  WHERE m.product_id IS NOT NULL AND m.branch <> p.branch
),
q_barcodes_wrong_branch AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.barcode_registry b
  JOIN public.products p ON p.id = b.product_id
  WHERE b.branch <> p.branch
),

-- Product details / sales details / invoices / bills
-- A POS bill may only contain items whose product lives in the same counter.
q_pos_bills_cross_branch AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.order_type <> 'online_request'
    AND o.branch <> p.branch
),

-- Stage-based revenue: a website request must never post into POS 2 revenue
q_revenue_online_in_pos_bills AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.orders
  WHERE order_type = 'online_request'
    AND status IN ('completed', 'paid')
    AND branch = 'pos2'
),
q_orders_bad_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.orders WHERE branch NOT IN ('pos1', 'pos2')
),
q_movement_bad_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.inventory_movements WHERE branch NOT IN ('pos1', 'pos2')
),
q_advance_orders_bad_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.advance_orders WHERE branch NOT IN ('pos1', 'pos2')
),
q_expenses_bad_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.expenses WHERE branch NOT IN ('pos1', 'pos2')
),

-- Coupons: the same code may exist once per counter, never twice in one counter
q_coupon_dupes_in_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM (
    SELECT branch, UPPER(BTRIM(code))
    FROM public.coupons
    GROUP BY branch, UPPER(BTRIM(code))
    HAVING COUNT(*) > 1
  ) d
),
q_expense_category_dupes_in_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM (
    SELECT branch, LOWER(BTRIM(name))
    FROM public.expense_categories
    GROUP BY branch, LOWER(BTRIM(name))
    HAVING COUNT(*) > 1
  ) d
),

-- Store settings: exactly one row per counter, no shared row
q_settings_rows AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.store_settings
),
q_settings_wrong_branch AS (
  SELECT COUNT(*)::BIGINT AS n FROM public.store_settings WHERE branch NOT IN ('pos1', 'pos2')
),
-- Store settings: a counter must not still be printing the original seed
-- identity, or its invoices / receipts / WhatsApp messages show a header
-- that disagrees with the logo and footer.
q_settings_legacy_identity AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.store_settings
  WHERE LOWER(BTRIM(COALESCE(name,  ''))) = 'clad'
     OR LOWER(BTRIM(COALESCE(email, ''))) = 'cladclothing26@gmail.com'
),

-- Invoice numbers come from two disjoint sequences, so numbers cannot collide
q_duplicate_invoice_no AS (
  SELECT COUNT(*)::BIGINT AS n FROM (
    SELECT invoice_no FROM public.orders GROUP BY invoice_no HAVING COUNT(*) > 1
  ) d
),
q_pos2_invoice_in_pos1_range AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM public.orders
  WHERE branch = 'pos2'
    AND (CASE WHEN invoice_no ~ '^[0-9]+$' THEN invoice_no::BIGINT END) < 50000000
),

-- Checkout routines must only count a coupon use against the selling
-- counter's coupon (0034 once silently undid this; see 0039).
q_checkout_coupon_unscoped AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.prokind = 'f'
    AND p.prosrc ILIKE '%UPDATE public.coupons%'
    AND p.prosrc ILIKE '%v_branch%'
    AND p.prosrc ~ 'WHERE UPPER\(BTRIM\(code\)\) = UPPER\(BTRIM\(p_coupon_code\)\)(?! AND branch = v_branch)'
),
-- Barcodes and category names must be unique per counter, not globally,
-- or one counter's entry blocks or overwrites the other's.
q_global_unique_across_counters AS (
  SELECT COUNT(*)::BIGINT AS n
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
  WHERE i.indisunique
    AND NOT i.indisprimary
    AND i.indnatts = 1
    AND i.indexprs IS NULL
    AND (
      (i.indrelid = 'public.barcode_registry'::regclass AND a.attname = 'barcode_value')
      OR (i.indrelid = 'public.categories'::regclass AND a.attname = 'name_en')
    )
)

SELECT * FROM (
  SELECT 1  AS ord, 'Catalog: variants matching their product branch'           AS check_name, q_variants_wrong_branch.n         AS violations, 'product details'            AS area FROM q_variants_wrong_branch
  UNION ALL SELECT 2,  'Catalog: stock movements matching their product branch',     q_movements_wrong_branch.n,                       'stock analytics & reports'   FROM q_movements_wrong_branch
  UNION ALL SELECT 3,  'Catalog: barcodes matching their product branch',            q_barcodes_wrong_branch.n,                        'barcode lookup / billing'    FROM q_barcodes_wrong_branch
  UNION ALL SELECT 4,  'Bills: POS bills containing the other counter''s product',   q_pos_bills_cross_branch.n,                       'sales details / invoices'    FROM q_pos_bills_cross_branch
  UNION ALL SELECT 5,  'Orders: rows with an unknown branch',                        q_orders_bad_branch.n,                            'order management'            FROM q_orders_bad_branch
  UNION ALL SELECT 6,  'Revenue: website (online request) bills counted in POS 2',   q_revenue_online_in_pos_bills.n,                  'POS 2 revenue'               FROM q_revenue_online_in_pos_bills
  UNION ALL SELECT 7,  'Stock ledger: rows with an unknown branch',                  q_movement_bad_branch.n,                          'stock analytics & reports'   FROM q_movement_bad_branch
  UNION ALL SELECT 8,  'Advance orders: rows with an unknown branch',                q_advance_orders_bad_branch.n,                    'advance orders'              FROM q_advance_orders_bad_branch
  UNION ALL SELECT 9,  'Expense tracker: rows with an unknown branch',               q_expenses_bad_branch.n,                          'expense tracker'             FROM q_expenses_bad_branch
  UNION ALL SELECT 10, 'Coupons: duplicate code inside one counter',                 q_coupon_dupes_in_branch.n,                       'coupons'                     FROM q_coupon_dupes_in_branch
  UNION ALL SELECT 11, 'Expense categories: duplicate name inside one counter',      q_expense_category_dupes_in_branch.n,             'expense tracker'             FROM q_expense_category_dupes_in_branch
  UNION ALL SELECT 12, 'Store settings: total rows (must be 2, one per counter)',    q_settings_rows.n,                                'store settings'              FROM q_settings_rows
  UNION ALL SELECT 13, 'Store settings: rows with an unknown branch',                q_settings_wrong_branch.n,                        'store settings'              FROM q_settings_wrong_branch
  UNION ALL SELECT 14, 'Invoices: duplicate invoice numbers',                        q_duplicate_invoice_no.n,                         'invoices / bills'            FROM q_duplicate_invoice_no
  UNION ALL SELECT 15, 'Invoices: POS 2 invoice number inside POS 1 number range',   q_pos2_invoice_in_pos1_range.n,                   'invoices / bills'            FROM q_pos2_invoice_in_pos1_range
  UNION ALL SELECT 16, 'Store settings: legacy seed identity still in use',          q_settings_legacy_identity.n,                     'invoices / receipts'         FROM q_settings_legacy_identity
  UNION ALL SELECT 17, 'Coupons: checkout counting a use on both counters'' coupon', q_checkout_coupon_unscoped.n,                     'coupons'                     FROM q_checkout_coupon_unscoped
  UNION ALL SELECT 18, 'Barcodes / categories: unique across both counters',        q_global_unique_across_counters.n,                'barcodes / categories'       FROM q_global_unique_across_counters
) checks
ORDER BY ord;

-- ====================================================================
-- Informational (expected > 0, harmless): website requests referencing the
-- other counter's product — the public storefront shows one merged catalog.
-- ====================================================================
SELECT COUNT(*) AS website_requests_with_other_counter_item
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.order_type = 'online_request'
  AND o.branch <> p.branch;

-- ====================================================================
-- Per-counter totals (spot check: the two counters must never share bills)
-- ====================================================================
SELECT
  branch,
  COUNT(*)                                              AS bills,
  COUNT(*) FILTER (WHERE order_type = 'online_request')  AS website_requests,
  ROUND(COALESCE(SUM(total), 0), 2)                      AS billed_value,
  MIN(invoice_no)                                       AS first_invoice_no,
  MAX(invoice_no)                                       AS latest_invoice_no
FROM public.orders
GROUP BY branch
ORDER BY branch;

