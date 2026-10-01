# YG Enterprises Supabase setup

Apply the migrations in filename order to the dedicated YG Enterprises Supabase project (or paste `RUN_ALL_MIGRATIONS.sql` in one go via the SQL Editor).

1. Run `20260716_0001_purple_boutique_schema.sql` (base schema — filename kept for history, content is YG Enterprises' schema).
2. Run `20260716_0002_purple_boutique_catalog.sql` (filename kept for history).
3. Continue through the remaining files in `supabase/migrations/` in filename order.
4. Create the owner account in Supabase Authentication and set its `role` metadata to `admin` if customer login is enabled.

The schema migration is idempotent. Invoice numbers use the format `PB-YYYY-000001` (POS 1) / a disjoint numeric range (POS 2) and are allocated under a locked database sequence per branch to prevent duplicates during concurrent billing.

Migration `20260930_0029_isolate_coupons_and_expense_categories.sql` gives coupons and expense categories separate POS 1 / POS 2 records. Legacy shared coupons and categories remain assigned to POS 1; POS 2 gets its own default expense categories. Apply this migration to the connected Supabase project before deploying the updated app.

Migration `20261001_0030_hard_delete_inventory_item.sql` permanently deletes a product or variant together with its barcode registry entries and inventory movement rows. Historical invoice line items keep their saved names, quantities, and totals. Apply this migration before deploying the product deletion change.
