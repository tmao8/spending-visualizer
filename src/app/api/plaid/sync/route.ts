import { createClient } from '@/utils/supabase/server';
import { syncTransactions } from '@/lib/services/plaid';
import { clearTransactionCache } from '@/lib/services/transactions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncTransactions(supabase, user.id);
    clearTransactionCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
