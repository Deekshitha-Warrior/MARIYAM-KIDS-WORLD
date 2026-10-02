-- ===================================================================
-- Migration 0037: Force YG Enterprises identity on every store_settings row
-- ===================================================================
--
-- WHY
-- Migration 0033 repaired only rows that still matched the exact 0012 seed
-- ("clad" / cladclothing26@gmail.com). Any row that had been partially
-- edited afterwards — or that sits on one of the other legacy identities
-- seeded by 0001 (Purple Boutique, Malaysia address) and 0016 (Chaji Mens
-- Wear) — was left untouched, so "View Invoice" on both POS 1 and POS 2
-- kept printing CLAD / Chaji shop details directly under the YG
-- Enterprises logo.
--
-- WHAT
-- This migration rewrites the identity columns of EVERY store_settings row
-- that is still on ANY known legacy placeholder (name, owner, phone, email
-- or address). Rows the owner has genuinely customised in
-- Admin -> Store Settings are matched by no marker and are left alone.
-- Theme colour, logo, business type, Instagram handle and GST flag are
-- never touched.
--
-- SAFE / IDEMPOTENT: re-running finds nothing left to repair.
-- ===================================================================

BEGIN;

UPDATE public.store_settings
SET name       = 'YG ENTERPRISES',
    owner_name = 'M. Gurumoorthy',
    phone      = '+91 98844 10700, +91 97878 08090',
    email      = 'ygenterprises2000@gmail.com',
    address    = '#189, N.S.C. Bose Road, (Opp. Bus Depot, Hotel Sankar Cafe Building), Chennai - 600 001',
    updated_at = NOW()
-- NOTE: 'yg enterprises' is deliberately NOT in the name list. Matching on the
-- current brand name alone is too weak a signal — it would let a re-run of this
-- migration reset a phone/address the owner has legitimately customised in
-- Admin -> Store Settings. Only unambiguous legacy markers are matched.
WHERE LOWER(BTRIM(COALESCE(name,       ''))) IN ('clad', 'chaji', 'chaji mens wear', 'purple boutique')
   OR LOWER(BTRIM(COALESCE(owner_name, ''))) IN ('clad', 'rubi krishna', 'chandru ajitha')
   OR LOWER(BTRIM(COALESCE(email,      ''))) IN (
        'cladclothing26@gmail.com',
        'chandrums1552004@gmail.com',
        'mypurpleboutique05@gmail.com'
      )
   OR COALESCE(phone, '') LIKE '%7010312145%'
   OR COALESCE(phone, '') LIKE '%8925094465%'
   OR COALESCE(phone, '') LIKE '%9344159498%'
   OR COALESCE(phone, '') LIKE '%11-3312 7107%'
   OR LOWER(COALESCE(address, '')) LIKE '%manapparai%'
   OR LOWER(COALESCE(address, '')) LIKE '%tamarind suite%'
   OR LOWER(COALESCE(address, '')) LIKE '%cyberjaya%';

COMMIT;

NOTIFY pgrst, 'reload schema';
