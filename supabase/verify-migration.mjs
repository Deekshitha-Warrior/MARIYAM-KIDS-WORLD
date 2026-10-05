import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Error: Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const REQUIRED_TABLES = [
  'profiles',
  'store_settings',
  'categories',
  'products',
  'product_variants',
  'barcode_registry',
  'inventory_movements',
  'orders',
  'order_items',
  'advance_orders',
  'advance_order_items',
  'coupons',
  'expenses',
  'expense_categories',
  'portal_credentials',
  'seed_ledger'
];

async function verify() {
  console.log(`\n======================================================`);
  console.log(`Verifying Supabase Migration for: ${url}`);
  console.log(`======================================================\n`);

  let allOk = true;

  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ [Table] ${table.padEnd(25)} : ERROR (${error.code}: ${error.message})`);
        allOk = false;
      } else {
        console.log(`✅ [Table] ${table.padEnd(25)} : OK (rows: ${count ?? 0})`);
      }
    } catch (e) {
      console.log(`❌ [Table] ${table.padEnd(25)} : EXCEPTION (${e.message})`);
      allOk = false;
    }
  }

  // Check store settings specifically
  try {
    const { data, error } = await supabase.from('store_settings').select('branch, store_name, business_type');
    if (!error && data) {
      console.log('\n--- Store Settings Branches ---');
      data.forEach(s => console.log(`   Branch: ${s.branch} | Name: ${s.store_name} | Type: ${s.business_type}`));
    }
  } catch {}

  console.log('\n======================================================');
  if (allOk) {
    console.log('🎉 SUCCESS: All core tables are present and verified in Supabase!');
  } else {
    console.log('⚠️  SOME CHECKS FAILED: Please make sure migrations have finished running in Supabase.');
  }
  console.log('======================================================\n');
}

verify().catch(console.error);
