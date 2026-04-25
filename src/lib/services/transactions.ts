import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subDays, format, startOfDay, subMonths, startOfYear, subYears, isAfter } from 'date-fns'

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

/**
 * Optimised function to fetch all data for the trends page.
 * We only fetch necessary columns to reduce bandwidth.
 */
export async function getAllTrendsData(supabase: SupabaseClient) {
  const fiveYearsAgo = startOfYear(subYears(new Date(), 4))
  const oneYearAgo = startOfMonth(subMonths(new Date(), 11))
  const sevenDaysAgo = startOfDay(subDays(new Date(), 6))

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, amount, merchant, category, card')
    .gte('created_at', fiveYearsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  // Pre-process categories to avoid repeated logic
  const transactions = (data as any[]).map(t => ({
    ...t,
    category: t.category || categorizeMerchant(t.merchant)
  })) as Transaction[]

  const aggregateCategories = (txs: Transaction[]) => {
    const cats: Record<string, number> = {}
    txs.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }

  // Use raw Date objects for faster filtering
  const sevenDaysAgoDate = new Date(sevenDaysAgo)
  const oneYearAgoDate = new Date(oneYearAgo)

  // 1. Weekly Data
  const weeklyTxs = transactions.filter(t => new Date(t.created_at) >= sevenDaysAgoDate)
  const weeklyTrends: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    weeklyTrends[format(subDays(new Date(), i), 'MMM dd')] = 0
  }
  weeklyTxs.forEach(t => {
    const d = format(new Date(t.created_at), 'MMM dd')
    if (weeklyTrends[d] !== undefined) weeklyTrends[d] += Number(t.amount)
  })

  // 2. Monthly Data
  const monthlyTxs = transactions.filter(t => new Date(t.created_at) >= oneYearAgoDate)
  const monthlyTrends: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    monthlyTrends[format(subMonths(new Date(), i), 'MMM yyyy')] = 0
  }
  monthlyTxs.forEach(t => {
    const d = format(new Date(t.created_at), 'MMM yyyy')
    if (monthlyTrends[d] !== undefined) monthlyTrends[d] += Number(t.amount)
  })

  // 3. Yearly Data (using full transaction list)
  const yearlyTrends: Record<string, number> = {}
  transactions.forEach(t => {
    const d = format(new Date(t.created_at), 'yyyy')
    yearlyTrends[d] = (yearlyTrends[d] || 0) + Number(t.amount)
  })

  return {
    weekly: {
      trends: Object.entries(weeklyTrends).map(([date, amount]) => ({ date, amount })).reverse(),
      categories: aggregateCategories(weeklyTxs)
    },
    monthly: {
      trends: Object.entries(monthlyTrends).map(([date, amount]) => ({ date, amount })).reverse(),
      categories: aggregateCategories(monthlyTxs)
    },
    yearly: {
      trends: Object.entries(yearlyTrends).map(([date, amount]) => ({ date, amount })),
      categories: aggregateCategories(transactions)
    }
  }
}

export async function getSpendingByCategory(supabase: SupabaseClient) {
  const start = startOfMonth(new Date()).toISOString()
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount, category')
    .gte('created_at', start)

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
