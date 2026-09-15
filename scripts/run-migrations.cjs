const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const targetMigrations = [
  '20260915_0019_organization_and_branches.sql',
  '20260915_0020_branch_columns.sql',
  '20260915_0021_seed_branches_and_backfill.sql',
  '20260915_0022_branch_constraints_and_indexes.sql',
  '20260915_0023_branch_auth_and_rls.sql',
  '20260915_0024_branch_aware_pos_rpcs.sql',
  '20260915_0025_branch_invoice_counters.sql',
  '20260915_0026_admin_analytics.sql',
];

async function run() {
  console.log('====================================================');
  console.log('  CLAD RETAIL Multi-Branch Migration Runner (0019-0026)');
  console.log('====================================================\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : null;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  console.log('Project Reference   :', projectRef || 'N/A');
  console.log('Supabase Token      :', accessToken ? '✓ Present' : '✗ Missing (SUPABASE_ACCESS_TOKEN)');
  console.log('Database Password   :', dbPassword || databaseUrl ? '✓ Present' : '✗ Missing');

  // Generate Consolidated Migration File for convenience
  let consolidatedSql = '-- ====================================================\n' +
                        '-- CLAD RETAIL: CONSOLIDATED MIGRATIONS 0019 - 0026\n' +
                        '-- ====================================================\n\n';

  for (const filename of targetMigrations) {
    const filePath = path.join(migrationsDir, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      consolidatedSql += `-- >>> FILE: ${filename} <<<\n` + content + '\n\n';
    }
  }

  const consolidatedPath = path.join(migrationsDir, 'consolidated_0019_to_0026.sql');
  fs.writeFileSync(consolidatedPath, consolidatedSql, 'utf8');
  console.log(`\n✓ Consolidated migration written to: ${consolidatedPath}`);

  // Method 1: Supabase Management API
  if (accessToken && projectRef) {
    console.log('\nAttempting automated execution via Supabase Management API...');
    for (const filename of targetMigrations) {
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      process.stdout.write(`Executing ${filename}... `);

      try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: sql })
        });
        const text = await res.text();
        if (res.ok) {
          console.log('✅ OK');
        } else {
          console.log(`❌ FAILED (${res.status}): ${text}`);
          return;
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        return;
      }
    }
    console.log('\n🎉 All multi-branch migrations executed successfully!');
    return;
  }

  // Method 2: Direct PostgreSQL Connection if pg is available
  if ((databaseUrl || (dbPassword && projectRef))) {
    try {
      const { Client } = require('pg');
      const connectionString = databaseUrl || `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
      console.log('\nConnecting to Postgres directly...');
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
      await client.connect();

      for (const filename of targetMigrations) {
        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        process.stdout.write(`Executing ${filename}... `);
        await client.query(sql);
        console.log('✅ OK');
      }

      await client.end();
      console.log('\n🎉 All multi-branch migrations executed successfully via PostgreSQL connection!');
      return;
    } catch (pgErr) {
      console.log(`Direct connection failed: ${pgErr.message}`);
    }
  }

  // Notice for Supabase Dashboard Execution
  console.log('\n----------------------------------------------------');
  console.log('  HOW TO COMPLETE MIGRATION IN SUPABASE:');
  console.log('----------------------------------------------------');
  console.log(`1. Open your Supabase SQL Editor:\n   👉 https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log(`2. Open the generated file:\n   supabase/migrations/consolidated_0019_to_0026.sql`);
  console.log('3. Paste the contents into the SQL Editor and click "Run".');
  console.log('\n(OR add SUPABASE_ACCESS_TOKEN=sbp_... to your .env file to run automatically via this script)');
}

run();
