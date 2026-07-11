'use server'

import { createClient } from '@/utils/supabase/server'
import { addTransaction } from '@/lib/services/transactions'
import { revalidatePath } from 'next/cache'

export async function createManualTransaction(formData: FormData) {
  const supabase = await createClient()

  const merchant = formData.get('merchant') as string
  const amountStr = formData.get('amount') as string
  const category = formData.get('category') as string
  const card = formData.get('card') as string
  const date = formData.get('date') as string

  const amount = parseFloat(amountStr)

  if (!merchant || isNaN(amount) || !category || !card) {
    return { error: 'Missing or invalid required fields' }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // We pass the transaction. Note: if your table has a user_id column, 
    // you might need to add it here, but you mentioned there isn't one.
    await addTransaction(supabase, {
      merchant,
      amount,
      category,
      card,
      created_at: date ? new Date(date).toISOString() : new Date().toISOString()
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/trends')
    return { success: true }
  } catch (error: any) {
    console.error('Error adding transaction:', error)
    return { error: error.message || 'Failed to add transaction' }
  }
}

export async function saveBudget(category: string, amount: number) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('budgets')
      .upsert({ category, amount }, { onConflict: 'category' })
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error saving budget:', error)
    return { error: error.message || 'Failed to save budget' }
  }
}

export async function deleteBudget(category: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting budget:', error)
    return { error: error.message || 'Failed to delete budget' }
  }
}
