'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function forceResync(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  // Reset the Plaid sync cursor so next sync fetches ALL history
  // We do NOT delete any transactions — the upsert will update existing
  // rows and insert any that are missing
  const { error: cursorError } = await supabase
    .from('plaid_connections')
    .update({ next_cursor: null })
    .eq('user_id', user.id)

  if (cursorError) {
    return { success: false, message: `Failed to reset cursor: ${cursorError.message}` }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, message: 'Cursor reset. Syncing all history...' }
}
