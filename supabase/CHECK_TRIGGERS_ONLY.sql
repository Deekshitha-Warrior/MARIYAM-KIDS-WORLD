-- Only the triggers. Expect up to 3 rows.
SELECT t.tgname AS trigger_name, c.relname AS on_table
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname LIKE 'enforce_%branch%'
ORDER BY t.tgname;
