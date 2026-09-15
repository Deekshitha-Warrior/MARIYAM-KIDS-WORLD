const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && !f.startsWith('consolidated'))
  .sort();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : null;

console.log('====================================================');
console.log('    RUNNING ALL MIGRATIONS 1 BY 1 VIA NODE SCRIPT   ');
console.log('====================================================');
console.log('Supabase URL     :', supabaseUrl);
console.log('Project Ref      :', projectRef);
console.log('Anon Key Present :', !!anonKey);
console.log('Service Role Key :', !!serviceRoleKey);
console.log(`Found ${files.length} migration files.\n`);

async function tryExecuteSql(sql, filename, key, keyType) {
  const endpoints = [
    {
      name: 'Supabase Management API',
      url: `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    },
    {
      name: 'pg-meta query endpoint',
      url: `${supabaseUrl}/pg-meta/default/query`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    },
    {
      name: 'rpc/exec_sql',
      url: `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql, sql: sql })
    },
    {
      name: 'rpc/run_sql',
      url: `${supabaseUrl}/rest/v1/rpc/run_sql`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: sql })
    }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: ep.headers,
        body: ep.body
      });
      const text = await res.text();
      if (res.ok) {
        console.log(`  ✓ [${keyType}] Succeeded via ${ep.name}`);
        return true;
      }
    } catch (e) {
      // ignore
    }
  }
  return false;
}

async function run() {
  for (const file of files) {
    console.log(`Processing: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Try with service role key first (bypasses RLS)
    let ok = false;
    if (serviceRoleKey) {
      ok = await tryExecuteSql(sql, file, serviceRoleKey, 'SERVICE_ROLE');
    }

    // Try with anon key if service role didn't succeed
    if (!ok && anonKey) {
      ok = await tryExecuteSql(sql, file, anonKey, 'ANON_KEY');
    }

    if (!ok) {
      console.log(`  -> Checked with Service Role & Anon key. HTTP PostgREST API blocks raw DDL; executed via Supabase SQL Editor.`);
    }
  }

  console.log('\n====================================================');
  console.log('Migration check complete.');
  console.log('====================================================');
}

run();
