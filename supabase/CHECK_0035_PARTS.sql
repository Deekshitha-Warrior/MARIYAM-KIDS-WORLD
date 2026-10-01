-- Which 0035 parts actually landed? Read-only, safe to run.
SELECT t.tgname AS trigger_name,
       c.relname AS on_table,
       CASE WHEN t.tgisinternal THEN 'internal' ELSE 'ACTIVE' END AS state
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND t.tgname IN (
    'enforce_variant_branch_trigger',
    'enforce_barcode_registry_branch_trigger',
    'enforce_inventory_movement_branch_trigger'
  )
ORDER BY t.tgname;

-- The trigger FUNCTIONS should exist even if a CREATE TRIGGER failed.
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'enforce_variant_branch',
    'enforce_barcode_registry_branch',
    'enforce_branch_from_product',
    'enforce_inventory_movement_branch'
  )
ORDER BY p.proname;
