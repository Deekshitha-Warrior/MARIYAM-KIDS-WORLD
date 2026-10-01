-- 0034 / 0032 / 0029 verification
-- Expect every "detail" to read OK.

SELECT '1. generate_barcode_value overloads' AS check_name,
       CASE WHEN count(*) = 1 THEN 'OK - single canonical function'
            ELSE 'PROBLEM - ' || count(*) || ' overloads (stale 1-arg version still present)'
       END AS detail
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'generate_barcode_value'

UNION ALL

SELECT '2. barcode RPC derives branch' AS check_name,
       CASE WHEN count(*) = 1 THEN 'OK - derives v_branch from product'
            ELSE 'PROBLEM - branch logic missing' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'create_barcode_and_receive_stock'
  AND pg_get_functiondef(p.oid) ILIKE '%v_branch%'

UNION ALL

SELECT '3. adjust_inventory_stock derives branch',
       CASE WHEN count(*) = 1 THEN 'OK - v_branch present'
            ELSE 'PROBLEM - branch logic missing' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'adjust_inventory_stock'
  AND pg_get_functiondef(p.oid) ILIKE '%v_branch%'

UNION ALL

SELECT '4. POS sale RPC is branch-aware',
       CASE WHEN count(*) = 1 THEN 'OK - has p_branch'
            ELSE 'PROBLEM - p_branch missing' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'complete_pos_sale_with_inventory'
  AND pg_get_functiondef(p.oid) ILIKE '%p_branch%'

UNION ALL

SELECT '5. coupon uniqueness is per-branch',
       CASE WHEN count(*) = 1 THEN 'OK - branch-scoped unique index'
            WHEN count(*) = 0 THEN 'PROBLEM - old global index still active'
            ELSE 'PROBLEM - ' || count(*) || ' indexes' END
FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'coupons_branch_code_upper_unique'

UNION ALL

SELECT '6. old global coupon index is gone',
       CASE WHEN count(*) = 0 THEN 'OK - dropped'
            ELSE 'PROBLEM - coupons_code_upper_unique still exists' END
FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'coupons_code_upper_unique'

UNION ALL

SELECT '7. movement branch trigger installed',
       CASE WHEN count(*) = 1 THEN 'OK - trigger active'
            ELSE 'PROBLEM - trigger missing' END
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgfoid
WHERE t.tgname = 'enforce_inventory_movement_branch_trigger'
  AND NOT t.tgisinternal
