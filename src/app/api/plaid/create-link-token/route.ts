import { createClient } from '@/utils/supabase/server';
import { createLinkToken } from '@/lib/services/plaid';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkToken = await createLinkToken(user.id);
    return NextResponse.json({ linkToken });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
