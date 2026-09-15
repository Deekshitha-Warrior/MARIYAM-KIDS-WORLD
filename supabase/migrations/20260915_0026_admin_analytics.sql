-- Migration: 20260915_0026_admin_analytics.sql
-- Description: Aggregated database analytics functions for the Admin Orchestrator

BEGIN;

-- 1. Global Admin Overview RPC
CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_total_sales NUMERIC := 0;
  v_total_bills BIGINT := 0;
  v_total_expenses NUMERIC := 0;
  v_branches_json JSONB;
BEGIN
  -- Aggregate today's overall metrics
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(id)
  INTO v_total_sales, v_total_bills
  FROM public.orders
  WHERE status != 'cancelled' AND created_at >= v_today_start;

  -- Aggregate today's expenses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM public.expenses
    WHERE created_at >= v_today_start;
  END IF;

  -- Per-branch breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'branch_id', b.id,
      'code', b.code,
      'name', b.name,
      'branch_type', b.branch_type,
      'is_active', b.is_active,
      'today_sales', COALESCE(ord.today_sales, 0),
      'today_bills', COALESCE(ord.today_bills, 0),
      'low_stock_count', COALESCE(stk.low_stock_count, 0),
      'total_products', COALESCE(stk.total_products, 0)
    )
  ) INTO v_branches_json
  FROM public.branches b
  LEFT JOIN (
    SELECT 
      branch_id,
      SUM(total) AS today_sales,
      COUNT(id) AS today_bills
    FROM public.orders
    WHERE status != 'cancelled' AND created_at >= v_today_start
    GROUP BY branch_id
  ) ord ON ord.branch_id = b.id
  LEFT JOIN (
    SELECT 
      branch_id,
      COUNT(id) AS total_products,
      COUNT(id) FILTER (WHERE stock_quantity <= COALESCE(low_stock_alert, 5)) AS low_stock_count
    FROM public.products
    WHERE is_active = TRUE
    GROUP BY branch_id
  ) stk ON stk.branch_id = b.id;

  RETURN jsonb_build_object(
    'today_sales', v_total_sales,
    'today_bills', v_total_bills,
    'today_expenses', v_total_expenses,
    'branches', COALESCE(v_branches_json, '[]'::JSONB),
    'generated_at', NOW()
  );
END;
$$;

-- 2. Single Branch Dashboard Deep-Dive RPC
CREATE OR REPLACE FUNCTION public.get_branch_dashboard(p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_today_sales NUMERIC := 0;
  v_today_bills BIGINT := 0;
  v_avg_bill NUMERIC := 0;
  v_inventory_value NUMERIC := 0;
  v_low_stock_count BIGINT := 0;
  v_top_products JSONB;
  v_recent_alerts JSONB;
  v_daily_sales JSONB;
  v_branch_info JSONB;
BEGIN
  -- Branch Details
  SELECT jsonb_build_object('id', id, 'code', code, 'name', name, 'branch_type', branch_type)
  INTO v_branch_info
  FROM public.branches
  WHERE id = p_branch_id;

  IF v_branch_info IS NULL THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  -- Today's sales
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(id)
  INTO v_today_sales, v_today_bills
  FROM public.orders
  WHERE branch_id = p_branch_id AND status != 'cancelled' AND created_at >= v_today_start;

  IF v_today_bills > 0 THEN
    v_avg_bill := ROUND(v_today_sales / v_today_bills, 2);
  END IF;

  -- Inventory retail valuation & low stock count
  SELECT 
    COALESCE(SUM(stock_quantity * price), 0),
    COUNT(id) FILTER (WHERE stock_quantity <= COALESCE(low_stock_alert, 5))
  INTO v_inventory_value, v_low_stock_count
  FROM public.products
  WHERE branch_id = p_branch_id AND is_active = TRUE;

  -- Top 5 selling items in last 30 days
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', oi.product_name,
      'quantity_sold', oi.sold_qty,
      'total_amount', oi.sold_amount
    )
  ) INTO v_top_products
  FROM (
    SELECT 
      product_name,
      SUM(quantity) AS sold_qty,
      SUM(line_total) AS sold_amount
    FROM public.order_items
    WHERE branch_id = p_branch_id AND created_at >= (NOW() - INTERVAL '30 days')
    GROUP BY product_name
    ORDER BY sold_qty DESC
    LIMIT 5
  ) oi;

  -- Items currently at or below low stock alert
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'stock_quantity', p.stock_quantity,
      'low_stock_alert', COALESCE(p.low_stock_alert, 5)
    )
  ) INTO v_recent_alerts
  FROM (
    SELECT id, name, stock_quantity, low_stock_alert
    FROM public.products
    WHERE branch_id = p_branch_id AND is_active = TRUE 
      AND stock_quantity <= COALESCE(low_stock_alert, 5)
    ORDER BY stock_quantity ASC
    LIMIT 8
  ) p;

  -- 7-Day sales breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.day_str,
      'sales', COALESCE(ord.day_sales, 0),
      'bills', COALESCE(ord.day_bills, 0)
    )
  ) INTO v_daily_sales
  FROM (
    SELECT to_char(d, 'YYYY-MM-DD') AS day_str, date_trunc('day', d) AS day_ts
    FROM generate_series(NOW() - INTERVAL '6 days', NOW(), INTERVAL '1 day') d
  ) ds
  LEFT JOIN (
    SELECT 
      date_trunc('day', created_at) AS day_ts,
      SUM(total) AS day_sales,
      COUNT(id) AS day_bills
    FROM public.orders
    WHERE branch_id = p_branch_id AND status != 'cancelled' AND created_at >= (NOW() - INTERVAL '7 days')
    GROUP BY date_trunc('day', created_at)
  ) ord ON ord.day_ts = ds.day_ts;

  RETURN jsonb_build_object(
    'branch', v_branch_info,
    'today_sales', v_today_sales,
    'today_bills', v_today_bills,
    'avg_bill', v_avg_bill,
    'inventory_value', v_inventory_value,
    'low_stock_count', v_low_stock_count,
    'top_products', COALESCE(v_top_products, '[]'::JSONB),
    'alerts', COALESCE(v_recent_alerts, '[]'::JSONB),
    'daily_sales', COALESCE(v_daily_sales, '[]'::JSONB),
    'generated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_branch_dashboard(UUID) TO authenticated, anon;

COMMIT;
