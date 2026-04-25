import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subDays, format, startOfDay, subMonths, startOfYear, subYears } from 'date-fns'

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

  const groups: Record<string, number> = {}
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

export async function getCategorySpendingForRange(supabase: SupabaseClient, startDate: string, endDate?: string) {
  let query = supabase
    .from('transactions')
    .select('merchant, amount, category')
    .gte('created_at', startDate)

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) throw error

  const categories: Record<string, number> = {}
  data.forEach((t) => {
    const cat = t.category || categorizeMerchant(t.merchant)
    categories[cat] = (categories[cat] || 0) + Number(t.amount)
  })

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export async function getWeeklySpending(supabase: SupabaseClient) {
  const startDate = startOfDay(subDays(new Date(), 6)).toISOString()
  const [trends, categories] = await Promise.all([
    getDailySpending(supabase, 7),
    getCategorySpendingForRange(supabase, startDate)
  ])
  return { trends, categories }
}

export async function getMonthlySpendingTrend(supabase: SupabaseClient) {
  const startDate = startOfMonth(subMonths(new Date(), 11)).toISOString()
  
  const [categories, { data, error }] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate),
    supabase
      .from('transactions')
      .select('created_at, amount')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })
  ])

  if (error) throw error

  const groups: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const d = format(subMonths(new Date(), i), 'MMM yyyy')
    groups[d] = 0
  }

  data.forEach((t) => {
    const d = format(new Date(t.created_at), 'MMM yyyy')
    if (groups[d] !== undefined) {
      groups[d] += Number(t.amount)
    }
  })

  const trends = Object.entries(groups)
    .map(([date, amount]) => ({ date, amount }))
    .reverse()

  return { trends, categories }
}

export async function getYearlySpending(supabase: SupabaseClient) {
  const startDate = startOfYear(subYears(new Date(), 4)).toISOString()

  const [categories, { data, error }] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate),
    supabase
      .from('transactions')
      .select('created_at, amount')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })
  ])

  if (error) throw error

  const groups: Record<string, number> = {}
  data.forEach((t) => {
    const d = format(new Date(t.created_at), 'yyyy')
    groups[d] = (groups[d] || 0) + Number(t.amount)
  })

  const trends = Object.entries(groups)
    .map(([date, amount]) => ({ date, amount }))

  return { trends, categories }
}

export async function getSpendingByCategory(supabase: SupabaseClient) {
  return getCategorySpendingForRange(supabase, startOfMonth(new Date()).toISOString())
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
    category: t.category || categorizeMerchant(t.merchant)
  })) as Transaction[]
}
