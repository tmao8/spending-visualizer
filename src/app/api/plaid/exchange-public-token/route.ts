import { createClient } from '@/utils/supabase/server';
import { exchangePublicToken } from '@/lib/services/plaid';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publicToken } = body;

    if (!publicToken) {
      return NextResponse.json({ error: 'Public token is required' }, { status: 400 });
    }

    await exchangePublicToken(supabase, publicToken, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
