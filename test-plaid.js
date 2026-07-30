const { createClient } = require('@supabase/supabase-js');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

async function run() {
  const { data: connections, error } = await supabase.from('plaid_connections').select('*');
  console.log('Connections:', connections?.length);
  if (!connections) return;
  for (const c of connections) {
    try {
      console.log('Fetching item:', c.item_id);
      const itemResponse = await plaidClient.itemGet({ access_token: c.access_token });
      console.log('Item:', itemResponse.data.item.institution_id);
    } catch (e) {
      console.error('Error on itemGet:', e?.response?.data || e.message);
    }
  }
}
run();
