# YG Enterprises Billing

Independent React, Vite, and Supabase billing administration for YG Enterprises (POS 1 and POS 2, branch-isolated).

## Local setup

1. Copy `.env.example` to `.env` and add the dedicated YG Enterprises Supabase URL, public key, and portal passwords.
2. Apply the SQL files in `supabase/migrations` in filename order.
3. Run `npm install`.
4. Run `npm run dev`.

The app keeps the established dashboard, POS billing, catalog, category, coupon, invoice, receipt, WhatsApp, and print flows. Local browser sessions use YG Enterprises-specific storage keys and do not share state with other shop projects.

## Environment

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER`
- `VITE_ADMIN_ID` / `VITE_ADMIN_PASSWORD` — Admin Orchestrator login (all branches)
- `VITE_BRANCH_1_STAFF_ID` / `VITE_BRANCH_1_STAFF_PASSWORD` — Branch 1 (Mariyam Kids World) staff login
- `VITE_BRANCH_2_STAFF_ID` / `VITE_BRANCH_2_STAFF_PASSWORD` — Branch 2 (Taj Textiles) staff login

Brand assets are located in `public/yg-logo.png`.
