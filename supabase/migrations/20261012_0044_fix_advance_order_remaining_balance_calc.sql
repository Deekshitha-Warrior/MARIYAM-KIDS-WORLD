-- ===================================================================
-- Migration 0044: Fix advance order remaining_balance calculation
-- ===================================================================
--
-- Fixes:
-- 1. When creating an advance order, remaining_balance was defaulting to 0
--    because migration 0043 removed the GENERATED expression and set DEFAULT 0,
--    while create_advance_order omitted remaining_balance from INSERT.
-- 2. Replaces create_advance_order to explicitly insert:
--    remaining_balance = round(p_total_amount - p_deposit_amount, 2)
-- 3. Adds a trigger BEFORE INSERT OR UPDATE ON advance_orders to keep
--    remaining_balance computed automatically as greatest(0, total_amount - deposit_amount)
--    unless the order is completed or cancelled (where remaining_balance = 0).
-- 4. Backfills all non-completed advance orders currently having remaining_balance = 0.
-- ===================================================================

BEGIN;

-- 1. Redefine create_advance_order with remaining_balance
CREATE OR REPLACE FUNCTION public.create_advance_order(
  p_customer_name text, p_phone text, p_address text, p_product_name text,
  p_category text, p_description text, p_total_amount numeric, p_deposit_amount numeric,
  p_expected_delivery_date date, p_remarks text, p_payment_method text, p_created_by_name text,
  p_products jsonb DEFAULT '[]'::jsonb,
  p_branch text DEFAULT 'pos1'
)
RETURNS public.advance_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order public.advance_orders;
  v_now timestamptz := now();
  v_deposit_id text;
  v_branch text := CASE WHEN p_branch = 'pos2' THEN 'pos2' ELSE 'pos1' END;
  v_remaining numeric;
BEGIN
  IF trim(coalesce(p_customer_name,'')) = '' THEN RAISE EXCEPTION 'Customer name is required'; END IF;
  IF trim(coalesce(p_phone,'')) = '' THEN RAISE EXCEPTION 'Phone number is required'; END IF;
  IF trim(coalesce(p_product_name,'')) = '' THEN RAISE EXCEPTION 'Product name is required'; END IF;
  IF coalesce(p_total_amount,0) <= 0 THEN RAISE EXCEPTION 'Total amount must be greater than zero'; END IF;
  IF coalesce(p_deposit_amount,0) <= 0 OR p_deposit_amount >= p_total_amount THEN RAISE EXCEPTION 'Deposit must be greater than zero and less than the total amount'; END IF;
  IF lower(coalesce(p_payment_method,'')) NOT IN ('cash','upi','card') THEN RAISE EXCEPTION 'Select a valid deposit payment method'; END IF;

  v_remaining := round(p_total_amount - p_deposit_amount, 2);
  v_deposit_id := 'DEP-' || to_char(v_now at time zone 'Asia/Kolkata','YYYYMMDD') || '-' || lpad(nextval('public.deposit_number_seq')::text,4,'0');

  INSERT INTO public.advance_orders(
    deposit_id, customer_name, phone, address, product_name, products, category,
    description, total_amount, deposit_amount, remaining_balance, expected_delivery_date,
    remarks, created_by, created_by_name, created_at, updated_at, branch
  )
  VALUES(
    v_deposit_id, trim(p_customer_name), trim(p_phone), trim(coalesce(p_address,'')),
    trim(p_product_name),
    CASE WHEN jsonb_typeof(coalesce(p_products,'[]'::jsonb))='array' THEN coalesce(p_products,'[]'::jsonb) ELSE '[]'::jsonb END,
    trim(coalesce(p_category,'')), trim(coalesce(p_description,'')),
    round(p_total_amount, 2), round(p_deposit_amount, 2), v_remaining,
    p_expected_delivery_date, trim(coalesce(p_remarks,'')),
    auth.uid(), trim(coalesce(p_created_by_name,'')), v_now, v_now, v_branch
  )
  RETURNING * INTO v_order;

  INSERT INTO public.advance_order_payments(advance_order_id, payment_type, amount, payment_method, remarks, received_by, received_at)
  VALUES(v_order.id, 'deposit', v_order.deposit_amount, lower(p_payment_method), coalesce(p_remarks,''), auth.uid(), v_now);

  INSERT INTO public.advance_order_timeline(advance_order_id, event_type, label, created_by, created_at)
  VALUES
    (v_order.id, 'created', 'Created', auth.uid(), v_now),
    (v_order.id, 'deposit_received', 'Deposit Received', auth.uid(), v_now);

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_advance_order(text,text,text,text,text,text,numeric,numeric,date,text,text,text,jsonb,text) TO public, anon, authenticated;

-- 2. Trigger to keep remaining_balance accurate on INSERT / UPDATE
CREATE OR REPLACE FUNCTION public.advance_orders_calc_remaining_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') THEN
    NEW.remaining_balance := 0;
  ELSIF NEW.remaining_balance IS NULL OR (TG_OP = 'INSERT' AND NEW.remaining_balance = 0 AND NEW.total_amount > NEW.deposit_amount) THEN
    NEW.remaining_balance := GREATEST(0, ROUND(COALESCE(NEW.total_amount, 0) - COALESCE(NEW.deposit_amount, 0), 2));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_orders_calc_balance ON public.advance_orders;
CREATE TRIGGER trg_advance_orders_calc_balance
BEFORE INSERT OR UPDATE OF total_amount, deposit_amount, status
ON public.advance_orders
FOR EACH ROW
EXECUTE FUNCTION public.advance_orders_calc_remaining_balance();

-- 3. Backfill any existing open/pending orders that have remaining_balance = 0 or NULL
UPDATE public.advance_orders
SET remaining_balance = GREATEST(0, ROUND(total_amount - deposit_amount, 2)),
    updated_at = now()
WHERE status NOT IN ('completed', 'cancelled')
  AND (remaining_balance = 0 OR remaining_balance IS NULL)
  AND total_amount > deposit_amount;

COMMIT;

NOTIFY pgrst, 'reload schema';
