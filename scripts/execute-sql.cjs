const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const migrationFile = path.resolve(__dirname, '../supabase/migrations/20260914_0018_barcode_custom_sizes.sql');

async function run() {
  console.log('Reading migration file:', migrationFile);
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file not found!');
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log(`Loaded SQL (${sql.length} bytes).`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

  console.log('\n--- Environment Configuration ---');
  console.log('Project Reference:', projectRef);
  console.log('Service Role Key Present:', !!serviceRoleKey);
  console.log('Supabase Access Token Present:', !!accessToken);
  console.log('Database Password Present:', !!dbPassword);

  // Method 1: If Supabase Access Token is provided
  if (accessToken && projectRef) {
    console.log('\nAttempting execution via Supabase Management API...');
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
        console.log('✅ Migration executed successfully via Supabase Management API!');
        return;
      } else {
        console.error('Management API error (' + res.status + '):', text);
      }
    } catch (err) {
      console.error('Failed calling Management API:', err.message);
    }
  }

  // Method 2: Explaining PostgREST architectural limitation
  console.log('\n⚠️  Supabase Architecture Note:');
  console.log('The SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY in .env are JWT tokens for PostgREST (Data API).');
  console.log('PostgREST is designed solely for Table CRUD operations and deliberately blocks DDL queries ("CREATE TABLE") over HTTP.');
  console.log('\nTo execute this migration automatically:');
  console.log('1. Add your Supabase Access Token to .env:');
  console.log('   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx');
  console.log('   (Generated in Supabase Dashboard -> Account -> Access Tokens)');
  console.log('OR');
  console.log('2. Run it in 10 seconds via the Supabase Dashboard SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
}

run();
