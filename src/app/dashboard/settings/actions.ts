'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function forceResync(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  // 1. Reset the Plaid sync cursor so next sync fetches ALL history
  const { error: cursorError } = await supabase
    .from('plaid_connections')
    .update({ next_cursor: null })
    .eq('user_id', user.id)

  if (cursorError) {
    return { success: false, message: `Failed to reset cursor: ${cursorError.message}` }
  }

  // 2. Delete pending transactions so they get re-synced with correct status
  const { error: deleteError, count } = await supabase
    .from('transactions')
    .delete({ count: 'exact' })
    .eq('pending', true)

  if (deleteError) {
    return { success: false, message: `Failed to delete transactions: ${deleteError.message}` }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, message: `Cleared ${count ?? 0} transactions. Ready for resync.` }
}
