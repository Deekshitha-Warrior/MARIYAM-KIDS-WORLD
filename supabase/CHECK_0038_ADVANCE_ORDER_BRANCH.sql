-- ===================================================================
-- CHECK 0038: Diagnose cross-branch advance-order bills (READ ONLY)
-- ===================================================================
-- Run this BEFORE migration 0038. It changes nothing.
--
-- 1. "live function is branch-aware?"  -> expect TRUE after 0038.
--    Before 0038 this is FALSE, which is the actual bug: the 0018 body
--    inserts into `orders` without a branch column, so the row falls back
--    to the column DEFAULT 'pos1'.
--
-- 2. "mis-filed bills" -> expect 0 after 0038. Any row returned is a
--    completed advance bill sitting in the wrong counter's Order
--    Management list.
--
-- 3. The per-branch breakdown, to eyeball that the two ledgers hold
--    their own advance orders.
-- ===================================================================

-- 1. Does the live function write `orders.branch`?
SELECT
  CASE WHEN pg_get_functiondef(p.oid) LIKE '%branch%'
       THEN 'OK - branch-aware (0038 applied)'
       ELSE 'BUG - no branch in INSERT (pre-0038 / 0018 body)' END AS "1. live function",
  p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'complete_advance_order_v2';

-- 2. Completed advance bills filed under the wrong counter
SELECT
  a.branch        AS "advance order branch",
  o.branch        AS "bill filed under",
  a.deposit_id,
  o.invoice_no,
  o.total,
  o.created_at
FROM public.advance_orders a
JOIN public.orders o ON o.id = a.completed_order_id
WHERE o.order_type = 'advance_order'
  AND a.branch IS DISTINCT FROM o.branch
ORDER BY o.created_at DESC;

-- 3. Per-counter advance-order bill counts (should be 0 for any
--    'pending' row, and each branch should hold only its own)
SELECT
  branch,
  COUNT(*) FILTER (WHERE status = 'completed')       AS "completed",
  COUNT(*) FILTER (WHERE status <> 'completed')      AS "still open",
  COUNT(*)                                           AS "total"
FROM public.advance_orders
GROUP BY branch
ORDER BY branch;

-- 4. Any advance bill in `orders` with a branch that matches no
--    advance order at all (an orphan that the backfill cannot reach)
SELECT
  o.branch,
  COUNT(*) AS "orphan advance bills"
FROM public.orders o
WHERE o.order_type = 'advance_order'
  AND NOT EXISTS (
    SELECT 1 FROM public.advance_orders a
    WHERE a.completed_order_id = o.id
  )
GROUP BY o.branch
ORDER BY o.branch;
