-- ===================================================================
-- Migration 0038: Keep completed advance-order bills on their own POS
-- ===================================================================
--
-- SYMPTOM
-- Completing an advance order on POS 2 (Fireworks) makes the finished
-- bill appear in POS 1's (Jute Management) Order Management list.
--
-- ROOT CAUSE
-- complete_advance_order_v2() has been redefined three times, and the
-- pre-branch version from 0018 is still the one live on this database:
--
--   0007 / 0018 -> INSERT INTO public.orders (... payment_method)
--                     -- no `branch` column at all
--   0020         -> INSERT INTO public.orders (..., branch, ...)
--                     v_branch := CASE WHEN v_advance.branch = 'pos2'
--                                       THEN 'pos2' ELSE 'pos1' END
--
-- The 0018 body omits `branch`, so the INSERT falls back to the column
-- DEFAULT 'pos1' declared by 0020. Every completed advance order is
-- therefore booked into POS 1's ledger no matter which counter it was
-- raised on.
--
-- The 0018 body is also doubly wrong for POS 2: it pulls the invoice
-- number from the retired shared invoice_number_seq rather than from
-- get_next_invoice_no(v_branch), so the two counters' numbering no
-- longer stay in their own 8-digit ranges.
--
-- WHAT
-- 1. Re-deploy the branch-aware 0020 body, so `orders.branch` is copied
--    from the advance order's own branch and the invoice number comes
--    from that counter's sequence.
-- 2. Backfill any bill already mis-filed into the wrong counter, using
--    advance_orders.completed_order_id as the authoritative link.
-- 3. Backfill a branch on any advance order left without one.
--
-- SAFE / IDEMPOTENT: re-running re-deploys the same function and the
-- backfill matches nothing once the rows are correct.
-- ===================================================================

BEGIN;

-- 1. Re-deploy the branch-aware completion RPC ------------------------

DROP FUNCTION IF EXISTS public.complete_advance_order_v2(uuid, text, numeric, text, numeric, numeric, text);

CREATE OR REPLACE FUNCTION public.complete_advance_order_v2(
  p_order_id uuid,
  p_payment_method text,
  p_final_amount numeric,
  p_coupon_code text DEFAULT NULL,
  p_coupon_percentage numeric DEFAULT 0,
  p_manual_discount numeric DEFAULT 0,
  p_remarks text DEFAULT ''
)
RETURNS TABLE(order_id uuid, invoice_no text, completed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance        public.advance_orders;
  v_order_id       uuid := gen_random_uuid();
  v_invoice        text;
  v_now            timestamptz := now();
  v_items          jsonb;
  v_item           jsonb;
  v_total_discount numeric := 0;
  v_branch         text;
BEGIN
  IF lower(coalesce(p_payment_method, '')) NOT IN ('cash', 'upi', 'card') THEN
    RAISE EXCEPTION 'Select a valid payment method';
  END IF;

  SELECT * INTO v_advance FROM public.advance_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advance order not found';
  END IF;

  -- The advance order's own branch is the single source of truth. It is
  -- deliberately NOT taken from the client: a caller in the wrong branch
  -- context can then no longer cross-book the completed bill.
  v_branch := CASE WHEN v_advance.branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;

  IF v_advance.status = 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled order cannot be completed';
  END IF;

  IF v_advance.completed_order_id IS NOT NULL OR v_advance.invoice_number IS NOT NULL THEN
    IF v_advance.status != 'completed' THEN
      UPDATE public.advance_orders
      SET status = 'completed',
          updated_at = v_now
      WHERE id = p_order_id;
    END IF;

    RETURN QUERY SELECT
      coalesce(v_advance.completed_order_id, gen_random_uuid()),
      coalesce(v_advance.invoice_number, 'INV00000000'),
      coalesce(v_advance.completed_at, v_now);
    RETURN;
  END IF;

  v_total_discount := p_manual_discount + (v_advance.remaining_balance - p_manual_discount - p_final_amount);
  IF v_total_discount < 0 THEN
    v_total_discount := 0;
  END IF;

  -- Invoice number from THIS counter's sequence, so the two POS stay in
  -- their own disjoint 8-digit ranges.
  v_invoice := public.get_next_invoice_no(v_branch);

  v_items := CASE
    WHEN jsonb_typeof(v_advance.products) = 'array' AND jsonb_array_length(v_advance.products) > 0
      THEN v_advance.products
    ELSE jsonb_build_array(
      jsonb_build_object(
        'name',        v_advance.product_name,
        'category',    v_advance.category,
        'description', v_advance.description,
        'quantity',    1,
        'base_price',  v_advance.total_amount,
        'line_total',  v_advance.total_amount,
        'unit',        'piece',
        'unit_type',   'unit',
        'source',      'advance_order'
      )
    )
  END;

  INSERT INTO public.orders (
    id, invoice_no, customer_name, phone, address, user_id,
    items, subtotal, total, status, order_mode, order_type,
    shipping, delivery_charge, discount_amount, manual_discount_amount,
    coupon_code, coupon_percentage, manual_discount_type, manual_discount_value,
    payment_mode, payment_method, branch, created_at, updated_at
  ) VALUES (
    v_order_id, v_invoice,
    v_advance.customer_name, v_advance.phone, v_advance.address, auth.uid(),
    v_items, v_advance.total_amount, greatest(0, v_advance.total_amount - v_total_discount),
    'completed', 'offline', 'advance_order',
    0, 0, v_total_discount, p_manual_discount,
    p_coupon_code, p_coupon_percentage, 'flat', p_manual_discount,
    lower(p_payment_method), lower(p_payment_method), v_branch,
    v_now, v_now
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_name, name, quantity, unit, unit_type,
      base_price, line_total, is_manual
    ) VALUES (
      v_order_id,
      coalesce(nullif(trim(v_item->>'name'), ''), 'Product'),
      coalesce(nullif(trim(v_item->>'name'), ''), 'Product'),
      greatest(coalesce((v_item->>'quantity')::numeric, 1), 0),
      coalesce(nullif(v_item->>'unit', ''), 'piece'),
      coalesce(nullif(v_item->>'unit_type', ''), 'unit'),
      greatest(coalesce((v_item->>'base_price')::numeric, 0), 0),
      greatest(coalesce((v_item->>'line_total')::numeric, 0), 0),
      false
    );
  END LOOP;

  INSERT INTO public.advance_order_payments (
    advance_order_id, payment_type, amount, payment_method, remarks, received_by, received_at
  ) VALUES (
    p_order_id, 'remaining', p_final_amount,
    lower(p_payment_method), coalesce(p_remarks, ''), auth.uid(), v_now
  );

  UPDATE public.advance_orders SET
    status               = 'completed',
    completed_at         = v_now,
    completed_order_id   = v_order_id,
    invoice_number       = v_invoice,
    final_payment_method = lower(p_payment_method),
    remarks              = CASE WHEN trim(coalesce(p_remarks, '')) = '' THEN remarks ELSE p_remarks END,
    updated_at           = v_now
  WHERE id = p_order_id;

  INSERT INTO public.advance_order_timeline (
    advance_order_id, event_type, label, remarks, created_by, created_at
  ) VALUES
    (p_order_id, 'remaining_payment_received', 'Remaining Payment Received', coalesce(p_remarks, ''), auth.uid(), v_now),
    (p_order_id, 'invoice_generated',          'Invoice Generated',          v_invoice,               auth.uid(), v_now);

  RETURN QUERY SELECT v_order_id, v_invoice, v_now;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_advance_order_v2(uuid, text, numeric, text, numeric, numeric, text) TO public, anon, authenticated;

-- 2. Backfill bills already filed under the wrong counter --------------
-- advance_orders.completed_order_id points at the orders row the RPC
-- created, so it is the reliable join key. Only order_type =
-- 'advance_order' is touched, so ordinary POS sales are never moved.

UPDATE public.orders o
SET branch = a.branch,
    updated_at = NOW()
FROM public.advance_orders a
WHERE a.completed_order_id = o.id
  AND o.order_type = 'advance_order'
  AND a.branch IS DISTINCT FROM o.branch;

-- 3. Backfill a branch on any advance order left without one ----------
-- The column has been NOT NULL DEFAULT 'pos1' since 0020, so this can
-- only affect rows added before the column existed.

UPDATE public.advance_orders
SET branch = 'pos1', updated_at = NOW()
WHERE branch IS NULL OR branch NOT IN ('pos1', 'pos2');

COMMIT;

NOTIFY pgrst, 'reload schema';
