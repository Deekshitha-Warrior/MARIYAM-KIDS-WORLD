-- Migration: 20260915_0025_branch_invoice_counters.sql
-- Description: Branch-specific invoice sequence counters (TX-100001, GR-100001)

BEGIN;

CREATE TABLE IF NOT EXISTS public.branch_invoice_counters (
  branch_id UUID PRIMARY KEY REFERENCES public.branches(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  next_number BIGINT NOT NULL DEFAULT 100001,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial counters for Textile and Grocery
INSERT INTO public.branch_invoice_counters (branch_id, prefix, next_number)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'TX-', 100001),
  ('b0000000-0000-0000-0000-000000000002', 'GR-', 100001)
ON CONFLICT (branch_id) DO NOTHING;

-- Function: Atomic Branch Invoice Number Generator
CREATE OR REPLACE FUNCTION public.generate_branch_invoice_number(p_branch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_num BIGINT;
  v_invoice TEXT;
BEGIN
  -- Atomically select and lock row
  SELECT prefix, next_number 
  INTO v_prefix, v_num 
  FROM public.branch_invoice_counters 
  WHERE branch_id = p_branch_id 
  FOR UPDATE;

  -- Fallback if not configured for this branch
  IF v_prefix IS NULL THEN
    v_prefix := 'INV-';
    v_num := 100001;
    INSERT INTO public.branch_invoice_counters (branch_id, prefix, next_number)
    VALUES (p_branch_id, v_prefix, v_num + 1)
    ON CONFLICT (branch_id) DO UPDATE SET next_number = branch_invoice_counters.next_number + 1;
  ELSE
    UPDATE public.branch_invoice_counters
    SET next_number = next_number + 1, updated_at = NOW()
    WHERE branch_id = p_branch_id;
  END IF;

  v_invoice := v_prefix || LPAD(v_num::TEXT, 6, '0');
  RETURN v_invoice;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_branch_invoice_number(UUID) TO authenticated, anon;

COMMIT;
