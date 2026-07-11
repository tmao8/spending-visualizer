import { createClient } from '@/utils/supabase/server';
import { getBalances } from '@/lib/services/plaid';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balances = await getBalances(supabase, user.id);
    return NextResponse.json({ balances });
  } catch (error: any) {
    console.error('Error fetching balances:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
