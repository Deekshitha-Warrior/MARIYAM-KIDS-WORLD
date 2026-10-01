-- Migration: 20260912_0017_update_store_address.sql
-- Update store address for YG ENTERPRISES

BEGIN;

UPDATE public.store_settings
SET address = '1892 A, bypass road, Sevoor,arani-632316',
    updated_at = NOW()
WHERE id = 1
  -- Guarded: same "legacy identity only" rule as 0016 / 0021, so a re-run
  -- never moves the address of a profile the owner has already edited.
  AND COALESCE(email, '') IN (
        'mypurpleboutique05@gmail.com',
        'cladclothing26@gmail.com',
        'chandrums1552004@gmail.com'
      );

COMMIT;
