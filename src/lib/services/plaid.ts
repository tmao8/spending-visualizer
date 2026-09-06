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
    optional_products: ['liabilities'] as any,
    country_codes: ['US'] as any,
    language: 'en',
    transactions: {
      days_requested: 730,
    }
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
    throw new Error(`Failed to save bank connection to database: ${error.message} (Code: ${error.code || 'unknown'})`);
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

function formatCardName(name: string): string {
  // Strip trailing spaces, dots, dashes, asterisks, and 2-5 digits
  return name.replace(/[\s\*\.\-]+(\d{2,5})$/, '').trim();
}

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
    
    // If a cursor was already stored but the user has 0 transactions in the database,
    // a previous sync failed to insert. Reset cursor so Plaid re-fetches full history.
    if (nextCursor) {
      try {
        const { count, error: countErr } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (!countErr && (count === 0 || count === null)) {
          console.log(`[Plaid Sync] 0 transactions found for user ${userId} despite cursor. Resetting cursor to pull full history...`);
          nextCursor = null;
        }
      } catch (e) {
        console.warn('[Plaid Sync] Error checking existing transaction count:', e);
      }
    }

    // Fetch accounts to map account_id to name for the "card" column
    let accountsMap: Record<string, string> = {};
    try {
      const accountsResponse = await plaidClient.accountsGet({
        access_token: connection.access_token
      });
      accountsResponse.data.accounts.forEach(acc => {
        accountsMap[acc.account_id] = acc.name;
      });
    } catch (e: any) {
      console.error('Error fetching accounts for mapping:', e?.response?.data || e.message);
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

        console.log(`[Plaid Sync] Page: added=${added.length}, modified=${modified.length}, removed=${removed.length}, hasMore=${hasMore}`);

        // Collect pending_transaction_ids to remove the old pending versions
        const replacedPendingIds = [...added, ...modified]
          .map(t => t.pending_transaction_id)
          .filter((id): id is string => id != null);

        // Process removed (delete them and replaced pending transactions)
        const allIdsToRemove = [...removed.map(t => t.transaction_id), ...replacedPendingIds];
        if (allIdsToRemove.length > 0) {
          const { error: delError } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', userId)
            .in('plaid_transaction_id', allIdsToRemove);
          if (delError) console.error('[Plaid Sync] Delete error:', delError.message);
          else console.log(`[Plaid Sync] Deleted ${allIdsToRemove.length} replaced/removed transactions`);
        }

        // Only filter out credit card bill payments — everything else
        // (refunds, credits, rewards, transfers) gets included
        const EXCLUDED_CATEGORIES = ['LOAN_PAYMENTS', 'INCOME', 'TRANSFER_IN', 'TRANSFER_OUT'];
        
        const allTransactions = [...added, ...modified];
        const toUpsert = allTransactions
          .filter(t => {
            const primaryCategory = t.personal_finance_category?.primary || '';
            const name = (t.merchant_name || t.name || '').toLowerCase();
            
            // Exclude if explicitly categorized as a loan payment, income, or transfer
            const isExcludedCategory = EXCLUDED_CATEGORIES.includes(primaryCategory);
            // Exclude negative amounts (credits to card) that are explicitly labeled as payments
            const isCreditCardPayment = t.amount < 0 && name.includes('payment');

            const shouldExclude = isExcludedCategory || isCreditCardPayment;
            
            if (shouldExclude) {
              console.log(`[Plaid Sync] Filtered out: "${t.merchant_name || t.name}" amount=${t.amount} category=${primaryCategory} pending=${t.pending}`);
            }
            return !shouldExclude;
          })
          .map(t => {
          const merchant = t.merchant_name || t.name || 'Unknown';
          // Use Plaid's personal finance category if available
          const category = mapPlaidCategory(t.personal_finance_category?.primary);
          
          return {
            user_id: userId,
            plaid_transaction_id: t.transaction_id,
            merchant: merchant,
            amount: t.amount,
            card: formatCardName(accountsMap[t.account_id] || t.account_id), // Map account_id to name and truncate
            category: category,
            created_at: t.datetime || `${t.date}T00:00:00Z`,
            pending: t.pending,
            plaid_account_id: t.account_id
          };
        });

        console.log(`[Plaid Sync] Upserting ${toUpsert.length} of ${allTransactions.length} transactions (${allTransactions.length - toUpsert.length} filtered)`);

        if (toUpsert.length > 0) {
          // Try composite constraint (user_id, plaid_transaction_id) first
          let { error: upsertError } = await supabase
            .from('transactions')
            .upsert(toUpsert, { onConflict: 'user_id, plaid_transaction_id' });

          // If composite constraint does not exist in DB, fallback to plaid_transaction_id
          if (upsertError && (upsertError.message.includes('ON CONFLICT') || upsertError.code === '42P10')) {
            console.warn('[Plaid Sync] Composite onConflict failed, retrying with plaid_transaction_id...');
            const retry = await supabase
              .from('transactions')
              .upsert(toUpsert, { onConflict: 'plaid_transaction_id' });
            upsertError = retry.error;
          }

          if (upsertError) {
            console.error('[Plaid Sync] Upsert error:', upsertError.message);
            throw new Error(`Failed to save transactions: ${upsertError.message}`);
          }
        }

        // Only update cursor in db if upsert succeeded
        await supabase
          .from('plaid_connections')
          .update({ next_cursor: nextCursor })
          .eq('id', connection.id);

      } catch (err: any) {
        console.error('[Plaid Sync] Error:', err?.response?.data || err.message || err);
        hasMore = false; // Stop on error
        throw err;
      }
    }
  }
};

export const getBalances = async (supabase: SupabaseClient, userId: string) => {
  const { data: connections } = await supabase
    .from('plaid_connections')
    .select('*')
    .eq('user_id', userId);

  if (!connections) return [];

  let allAccounts: any[] = [];
  for (const connection of connections) {
    try {
      const response = await plaidClient.accountsGet({
        access_token: connection.access_token
      });
      allAccounts = [...allAccounts, ...response.data.accounts];
    } catch (e) {
      console.error('Error fetching balances:', e);
    }
  }
  return allAccounts.map(acc => ({
    name: acc.name,
    balance: acc.balances.current || 0,
    type: acc.type,
    subtype: acc.subtype
  }));
};

export interface CreditCardLiability {
  accountName: string;
  currentBalance: number;
  lastStatementBalance: number | null;
  lastStatementDate: string | null;
  minimumPayment: number | null;
  nextPaymentDueDate: string | null;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  creditLimit: number | null;
}

export const getLiabilities = async (supabase: SupabaseClient, userId: string): Promise<{ data: CreditCardLiability[]; error: string | null }> => {
  const { data: connections } = await supabase
    .from('plaid_connections')
    .select('*')
    .eq('user_id', userId);

  if (!connections || connections.length === 0) return { data: [], error: 'No bank connections found. Link a bank in Settings.' };

  const allLiabilities: CreditCardLiability[] = [];
  let lastError: string | null = null;

  for (const connection of connections) {
    try {
      // Get account names
      const accountsResponse = await plaidClient.accountsGet({
        access_token: connection.access_token
      });
      const accountsMap: Record<string, { name: string; balance: number; limit: number | null }> = {};
      accountsResponse.data.accounts.forEach(acc => {
        accountsMap[acc.account_id] = {
          name: acc.name,
          balance: acc.balances.current || 0,
          limit: acc.balances.limit || null
        };
      });

      // Get liabilities
      const response = await plaidClient.liabilitiesGet({
        access_token: connection.access_token
      });

      const creditCards = response.data.liabilities.credit || [];
      for (const card of creditCards) {
        const account = (card.account_id ? accountsMap[card.account_id] : null) || { name: 'Unknown Card', balance: 0, limit: null };
        allLiabilities.push({
          accountName: account.name,
          currentBalance: account.balance,
          lastStatementBalance: card.last_statement_balance ?? null,
          lastStatementDate: card.last_statement_issue_date ?? null,
          minimumPayment: card.minimum_payment_amount ?? null,
          nextPaymentDueDate: card.next_payment_due_date ?? null,
          lastPaymentAmount: card.last_payment_amount ?? null,
          lastPaymentDate: card.last_payment_date ?? null,
          creditLimit: account.limit,
        });
      }
    } catch (e: any) {
      const plaidError = e?.response?.data;
      lastError = plaidError?.error_message || plaidError?.error_code || e.message || 'Unknown error';
      console.error('[Plaid] Error fetching liabilities:', plaidError || e.message);
    }
  }

  const sorted = allLiabilities.sort((a, b) => {
    if (!a.nextPaymentDueDate) return 1;
    if (!b.nextPaymentDueDate) return -1;
    return new Date(a.nextPaymentDueDate).getTime() - new Date(b.nextPaymentDueDate).getTime();
  });

  return { data: sorted, error: allLiabilities.length === 0 ? lastError : null };
};
