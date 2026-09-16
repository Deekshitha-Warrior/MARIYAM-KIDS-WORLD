const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkAndRun() {
  console.log('Fetching all rows from store_settings...');
  const { data: rows, error } = await supabase.from('store_settings').select('*');
  console.log('Current rows:', rows, 'Error:', error);

  // Check if we can add branch_code or branch_id column or insert a second row
  // First, let's update row 1 to Taj textiles (Branch 1)
  console.log('Updating row 1 (Branch 1 - Taj textiles)...');
  const { data: updatedB1, error: errB1 } = await supabase
    .from('store_settings')
    .update({
      name: 'Taj textiles',
      owner_name: 'Mohammed ansari',
      phone: '9442711949 / 9445050934',
      email: 'tajtextiles1965@gmail.com',
      address: '111, P.V. Vaithiyalingam road old Pallavaram Chennai 600117',
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select();
  console.log('Updated row 1:', updatedB1, 'Error:', errB1);

  // Check if row 2 exists or insert row 2 for MARIYAM KIDS WORLD (Branch 2)
  console.log('Checking row 2 for Branch 2 (MARIYAM KIDS WORLD)...');
  const { data: row2 } = await supabase.from('store_settings').select('*').eq('id', 2);
  if (row2 && row2.length > 0) {
    const { data: updatedB2, error: errB2 } = await supabase
      .from('store_settings')
      .update({
        name: 'MARIYAM KIDS WORLD',
        owner_name: 'AANISHA BANU MOHAMMED ANSARI',
        phone: '9003024922 | 9445050934',
        email: 'mariyamkidsworld2025@gmail.com',
        address: '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117',
        updated_at: new Date().toISOString()
      })
      .eq('id', 2)
      .select();
    console.log('Updated row 2:', updatedB2, 'Error:', errB2);
  } else {
    console.log('Inserting row 2 for Branch 2...');
    const { data: insertedB2, error: errInsert } = await supabase
      .from('store_settings')
      .insert({
        id: 2,
        name: 'MARIYAM KIDS WORLD',
        owner_name: 'AANISHA BANU MOHAMMED ANSARI',
        phone: '9003024922 | 9445050934',
        email: 'mariyamkidsworld2025@gmail.com',
        address: '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117',
        gst_enabled: false,
        updated_at: new Date().toISOString()
      })
      .select();
    console.log('Inserted row 2:', insertedB2, 'Error:', errInsert);
  }

  const { data: finalRows } = await supabase.from('store_settings').select('*');
  console.log('Final store_settings in Supabase:');
  console.log(JSON.stringify(finalRows, null, 2));
}

checkAndRun().catch(console.error);
