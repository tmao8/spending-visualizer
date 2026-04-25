import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subDays, format, startOfDay } from 'date-fns'

export interface Transaction {
  id: string
  created_at: string
  merchant: string
  amount: number
  card: string
  category: string
}

const CATEGORY_MAP: Record<string, string> = {
  'starbucks': 'Food & Drink',
  'mcdonald': 'Food & Drink',
  'uber': 'Transportation',
  'lyft': 'Transportation',
  'amazon': 'Shopping',
  'target': 'Shopping',
  'walmart': 'Shopping',
  'apple': 'Services',
  'netflix': 'Services',
  'spotify': 'Services',
}

export function categorizeMerchant(merchant: string): string {
  const normalized = merchant.toLowerCase()
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) return value
  }
  return 'General'
}

export async function getMonthlyTotal(supabase: SupabaseClient) {
  const start = startOfMonth(new Date()).toISOString()
  const end = endOfMonth(new Date()).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .gte('created_at', start)
    .lte('created_at', end)

  if (error) throw error

  return data.reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getDailySpending(supabase: SupabaseClient, days: number = 30) {
  const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, amount')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date
  const groups: Record<string, number> = {}
  
  // Initialize all days in range with 0
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), i), 'MMM dd')
    groups[d] = 0
  }

  data.forEach((t) => {
    const d = format(new Date(t.created_at), 'MMM dd')
    if (groups[d] !== undefined) {
      groups[d] += Number(t.amount)
    }
  })

  return Object.entries(groups)
    .map(([date, amount]) => ({ date, amount }))
    .reverse()
}

export async function getSpendingByCategory(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount')

  if (error) throw error

  const categories: Record<string, number> = {}
  data.forEach((t) => {
    const cat = categorizeMerchant(t.merchant)
    categories[cat] = (categories[cat] || 0) + Number(t.amount)
  })

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export async function getTopMerchants(supabase: SupabaseClient, limit: number = 5) {
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount')

  if (error) throw error

  const merchants: Record<string, number> = {}
  data.forEach((t) => {
    merchants[t.merchant] = (merchants[t.merchant] || 0) + Number(t.amount)
  })

  return Object.entries(merchants)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export async function getRecentTransactions(supabase: SupabaseClient, limit: number = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  
  return (data as any[]).map(t => ({
    ...t,
    category: categorizeMerchant(t.merchant)
  })) as Transaction[]
}
