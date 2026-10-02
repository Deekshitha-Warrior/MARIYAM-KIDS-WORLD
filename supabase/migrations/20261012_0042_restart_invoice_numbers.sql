-- ===================================================================
-- Migration 0042: Restart each POS's invoice numbers from the start
-- ===================================================================
--
-- Test and deleted bills had already used up invoice numbers, so the next
-- real bill would not have been the first number. This puts each POS's
-- counter back to its first number:
--
--   POS 1 -> 10000001      POS 2 -> 50000001
--
-- It can never create a duplicate: if a POS still has bills, its counter
-- continues right after the highest number already used in its range
-- instead of restarting. Advance-order completion bills use the same
-- counters, so they are covered too.
--
-- SAFE / IDEMPOTENT: re-running gives the same result.
-- ===================================================================

BEGIN;

-- Hold off new bills while the counters are being set.
LOCK TABLE public.orders IN SHARE ROW EXCLUSIVE MODE;

SELECT setval(
  'public.invoice_number_seq_pos1',
  COALESCE((
    SELECT MAX(invoice_no::BIGINT) + 1 FROM public.orders
    WHERE invoice_no ~ '^[0-9]+$' AND invoice_no::BIGINT BETWEEN 10000001 AND 49999999
  ), 10000001),
  FALSE
);

SELECT setval(
  'public.invoice_number_seq_pos2',
  COALESCE((
    SELECT MAX(invoice_no::BIGINT) + 1 FROM public.orders
    WHERE invoice_no ~ '^[0-9]+$' AND invoice_no::BIGINT >= 50000001
  ), 50000001),
  FALSE
);

COMMIT;

-- Shows the next number each POS will use (reads only; uses up nothing).
SELECT
  (SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM public.invoice_number_seq_pos1) AS pos1_next_bill,
  (SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM public.invoice_number_seq_pos2) AS pos2_next_bill;
