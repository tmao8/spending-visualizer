import { Configuration, PlaidApi, PlaidEnvironments, Transaction, RemovedTransaction } from 'plaid';
import { SupabaseClient } from '@supabase/supabase-js';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export const createLinkToken = async (userId: string) => {
  const request = {
    user: { client_user_id: userId },
    client_name: 'Clarity',
    products: ['transactions'] as any,
    country_codes: ['US'] as any,
    language: 'en',
  };

  const response = await plaidClient.linkTokenCreate(request);
  return response.data.link_token;
};

export const exchangePublicToken = async (supabase: SupabaseClient, publicToken: string, userId: string) => {
  // 1. Exchange public token for access token
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });
  
  const accessToken = response.data.access_token;
  const itemId = response.data.item_id;

  // 2. Save the access token and item ID to Supabase
  const { error } = await supabase
    .from('plaid_connections')
    .insert([{
      user_id: userId,
      access_token: accessToken,
      item_id: itemId,
    }]);

  if (error) {
    console.error('Error saving plaid connection:', error);
    throw error;
  }

  return { success: true };
};

// Map Plaid primary categories to our app categories
const mapPlaidCategory = (plaidPrimary?: string): string => {
  if (!plaidPrimary) return 'Other';
  switch (plaidPrimary) {
    case 'FOOD_AND_DRINK':
      return 'Food & Drinks';
    case 'TRAVEL':
      return 'Travel';
    case 'ENTERTAINMENT':
      return 'Entertainment';
    case 'GENERAL_MERCHANDISE':
      return 'Shopping';
    case 'TRANSPORTATION':
      return 'Transportation';
    case 'GENERAL_SERVICES':
    case 'INCOME': // You might want to handle income differently
      return 'Services';
    case 'PERSONAL_CARE':
    case 'MEDICAL':
      return 'Health';
    default:
      return 'Other';
  }
};

export const syncTransactions = async (supabase: SupabaseClient, userId: string) => {
  // 1. Get all connections for this user
  const { data: connections, error: connError } = await supabase
    .from('plaid_connections')
    .select('*')
    .eq('user_id', userId);

  if (connError || !connections) {
    console.error('Error fetching connections:', connError);
    return;
  }

  for (const connection of connections) {
    let hasMore = true;
    let nextCursor = connection.next_cursor;
    
    // Fetch accounts to map account_id to name for the "card" column
    let accountsMap: Record<string, string> = {};
    try {
      const accountsResponse = await plaidClient.accountsGet({
        access_token: connection.access_token
      });
      accountsResponse.data.accounts.forEach(acc => {
        accountsMap[acc.account_id] = acc.name;
      });
    } catch (e) {
      console.error('Error fetching accounts for mapping:', e);
    }

    while (hasMore) {
      try {
        const response = await plaidClient.transactionsSync({
          access_token: connection.access_token,
          cursor: nextCursor || undefined,
          options: {
            include_personal_finance_category: true,
          }
        });

        const data = response.data;
        const added: Transaction[] = data.added;
        const modified: Transaction[] = data.modified;
        const removed: RemovedTransaction[] = data.removed;

        hasMore = data.has_more;
        nextCursor = data.next_cursor;

        // Process removed (delete them)
        if (removed.length > 0) {
          const removedIds = removed.map(t => t.transaction_id);
          await supabase
            .from('transactions')
            .delete()
            .in('plaid_transaction_id', removedIds);
        }

        // Process added and modified together (Upsert)
        const toUpsert = [...added, ...modified].map(t => {
          const merchant = t.merchant_name || t.name || 'Unknown';
          // Use Plaid's personal finance category if available
          const category = mapPlaidCategory(t.personal_finance_category?.primary);
          
          return {
            plaid_transaction_id: t.transaction_id,
            merchant: merchant,
            amount: t.amount,
            card: accountsMap[t.account_id] || t.account_id, // Map account_id to name
            category: category,
            created_at: t.datetime || `${t.date}T00:00:00Z`,
            pending: t.pending,
            plaid_account_id: t.account_id
          };
        });

        if (toUpsert.length > 0) {
          await supabase
            .from('transactions')
            .upsert(toUpsert, { onConflict: 'plaid_transaction_id' });
        }

        // Update cursor in db
        await supabase
          .from('plaid_connections')
          .update({ next_cursor: nextCursor })
          .eq('id', connection.id);

      } catch (err: any) {
        console.error('Error during Plaid sync:', err?.response?.data || err);
        hasMore = false; // Stop on error
      }
    }
  }
};
