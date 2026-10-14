-- Migration 0042: Add low_stock_alert_enabled column to store_settings
-- Controls independent low stock audio & visual alert switch for POS 1 (Mariyam) and POS 2 (Taj)

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS low_stock_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure default state is OFF for both branches
UPDATE public.store_settings
SET low_stock_alert_enabled = FALSE
WHERE branch IN ('pos1', 'pos2');

NOTIFY pgrst, 'reload schema';
