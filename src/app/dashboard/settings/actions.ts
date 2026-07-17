'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function forceResync() {
  const supabase = await createClient()

  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 2. Wipe the next_cursor for all of this user's Plaid connections
  // This forces Plaid to send ALL historical transactions from scratch on the next sync
  await supabase
    .from('plaid_connections')
    .update({ next_cursor: null })
    .eq('user_id', user.id)

  // 3. Clear existing pending transactions since a full resync will restore any valid ones
  await supabase
    .from('transactions')
    .delete()
    .eq('pending', true)

  revalidatePath('/dashboard', 'layout')
}
