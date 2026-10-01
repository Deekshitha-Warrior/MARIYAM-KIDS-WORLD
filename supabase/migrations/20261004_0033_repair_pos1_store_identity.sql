-- ====================================================================
-- Migration 0033: Repair the POS 1 (id = 1) store identity
--
-- WHY
-- The store_settings row for POS 1 still carries the very first seed
-- values written by migration 20260901_0012 — "CLAD" / "Rubi krishna" /
-- cladclothing26@gmail.com / "Manapparai, Trichy, Tamil Nadu - 621 306".
-- The later rebrand migrations (0016, 0017, 0021) that were supposed to
-- replace those details were never applied to this database, so every
-- POS 1 invoice, advance receipt, thermal receipt, WhatsApp message and
-- barcode label kept printing the legacy CLAD header directly under the
-- YG Enterprises logo and above the "Thank you for shopping at
-- YG ENTERPRISES!" footer.
--
-- WHY A GUARDED UPDATE (and not a blind overwrite)
-- Admin → Store Settings writes the same columns at runtime, so a plain
-- `SET name = ...WHERE branch = 'pos1'` could silently undo an identity
-- the owner had already corrected by hand. This migration therefore only
-- rewrites rows that are STILL on the legacy CLAD placeholders.
--
-- VALUES
-- They match src/lib/brand.ts (the fallback the app already prints when a
-- field is blank), migration 0021 and the POS 2 row, so the POS 1 invoice
-- header now agrees with the website, the invoice footer and the other
-- counter. The owner can still change any of it at runtime in
-- Admin → Store Settings → Shop Profile; this migration won't fight that
-- because the CLAD guard will no longer match.
--
-- SAFE / IDEMPOTENT: re-running finds nothing left to repair.
-- Only the identity columns are touched — theme colour, logo, business
-- type and Instagram handle are left exactly as they are.
-- ====================================================================

BEGIN;

UPDATE public.store_settings
SET name       = 'YG ENTERPRISES',
    owner_name = 'M. Gurumoorthy',
    phone      = '+91 98844 10700, +91 97878 08090',
    email      = 'ygenterprises2000@gmail.com',
    address    = '#189, N.S.C. Bose Road, (Opp. Bus Depot, Hotel Sankar Cafe Building), Chennai - 600 001',
    updated_at = NOW()
WHERE branch = 'pos1'
  AND (
        LOWER(BTRIM(COALESCE(name,  ''))) = 'clad'
     OR LOWER(BTRIM(COALESCE(email, ''))) = 'cladclothing26@gmail.com'
      );

COMMIT;

NOTIFY pgrst, 'reload schema';
