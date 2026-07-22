import { createClient } from '@/utils/supabase/server';
import { syncTransactions } from '@/lib/services/plaid';
import { clearTransactionCache } from '@/lib/services/transactions';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60s for full historical sync

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Plaid Sync] Starting sync for user:', user.id);
    await syncTransactions(supabase, user.id);
    clearTransactionCache();
    console.log('[Plaid Sync] Sync complete');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Plaid Sync] Error:', error?.response?.data || error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
