const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tables = ['branches', 'store_settings', 'users', 'staff', 'profiles', 'app_users', 'sales'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(5);
    console.log('TABLE:', t, 'ERROR:', error ? error.message : null, 'COUNT:', data ? data.length : 0);
    if (data && data.length > 0) {
      console.log('SAMPLE for', t, ':', JSON.stringify(data, null, 2));
    }
  }
}
inspect();
