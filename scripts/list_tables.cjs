const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function listAllTables() {
  const res = await fetch(`${envConfig.VITE_SUPABASE_URL}/rest/v1/?apikey=${envConfig.SUPABASE_SERVICE_ROLE_KEY}`);
  const spec = await res.json();
  console.log('Available tables in OpenAPI:');
  console.log(Object.keys(spec.definitions || {}));
}
listAllTables();
