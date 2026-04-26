import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subDays, format, startOfDay, endOfDay, subMonths, startOfYear, endOfYear, subYears } from 'date-fns'

export interface Transaction {
  id: string
  created_at: string
  merchant: string
  amount: number
  card: string
  category: string
}

export interface FilterOptions {
  card?: string
  category?: string
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

export async function getSpendingByCard(supabase: SupabaseClient, filter?: FilterOptions) {
  let query = supabase
    .from('transactions')
    .select('card, amount, category, merchant')

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const { data, error } = await query

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const cards: Record<string, number> = {}
  filteredData.forEach((t) => {
    const cardName = t.card || 'Unknown'
    cards[cardName] = (cards[cardName] || 0) + Number(t.amount)
  })

  return Object.entries(cards)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export async function getMonthlyTotal(supabase: SupabaseClient) {
  const start = startOfDay(startOfMonth(new Date())).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .gte('created_at', start)

  if (error) throw error

  return data.reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getDailySpending(supabase: SupabaseClient, days: number = 30, weekOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subDays(new Date(), weekOffset * 7)
  const startDate = startOfDay(subDays(baseDate, days - 1)).toISOString()
  const endDate = endOfDay(baseDate).toISOString()

  let query = supabase
    .from('transactions')
    .select('created_at, amount, category, merchant, card')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const { data, error } = await query

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const groups: Record<string, any> = {}
  for (let i = 0; i < days; i++) {
    const d = format(subDays(baseDate, i), 'MMM dd')
    groups[d] = { date: d, amount: 0 }
  }

  filteredData.forEach((t) => {
    const d = format(new Date(t.created_at), 'MMM dd')
    if (groups[d] !== undefined) {
      const cat = t.category || categorizeMerchant(t.merchant)
      groups[d].amount += Number(t.amount)
      groups[d][cat] = (groups[d][cat] || 0) + Number(t.amount)
    }
  })

  return Object.values(groups).reverse()
}

export async function getCategorySpendingForRange(supabase: SupabaseClient, startDate: string, endDate?: string, filter?: FilterOptions) {
  let query = supabase
    .from('transactions')
    .select('merchant, amount, category, card')
    .gte('created_at', startDate)

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const { data, error } = await query

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const categories: Record<string, number> = {}
  filteredData.forEach((t) => {
    const cat = t.category || categorizeMerchant(t.merchant)
    categories[cat] = (categories[cat] || 0) + Number(t.amount)
  })

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export async function getFirstTransactionDate(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('transactions')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.created_at ? new Date(data.created_at) : new Date()
}

export async function getWeeklySpending(supabase: SupabaseClient, weekOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subDays(new Date(), weekOffset * 7)
  const startDate = startOfDay(subDays(baseDate, 6)).toISOString()
  const endDate = endOfDay(baseDate).toISOString()
  
  const [trends, categories, firstDate] = await Promise.all([
    getDailySpending(supabase, 7, weekOffset, filter),
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    getFirstTransactionDate(supabase)
  ])
  return { trends, categories, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getMonthlySpendingTrend(supabase: SupabaseClient, monthOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subMonths(new Date(), monthOffset * 12)
  const startDate = startOfMonth(subMonths(baseDate, 11)).toISOString()
  const endDate = endOfMonth(baseDate).toISOString()
  
  let query = supabase
    .from('transactions')
    .select('created_at, amount, category, merchant, card')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const [categories, { data, error }, firstDate] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    query,
    getFirstTransactionDate(supabase)
  ])

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const groups: Record<string, any> = {}
  for (let i = 0; i < 12; i++) {
    const d = format(subMonths(baseDate, i), 'MMM yyyy')
    groups[d] = { date: d, amount: 0 }
  }

  filteredData.forEach((t) => {
    const d = format(new Date(t.created_at), 'MMM yyyy')
    if (groups[d] !== undefined) {
      const cat = t.category || categorizeMerchant(t.merchant)
      groups[d].amount += Number(t.amount)
      groups[d][cat] = (groups[d][cat] || 0) + Number(t.amount)
    }
  })

  const trends = Object.values(groups).reverse()

  return { trends, categories, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getYearlySpending(supabase: SupabaseClient, yearOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subYears(new Date(), yearOffset * 5)
  const startDate = startOfYear(subYears(baseDate, 4)).toISOString()
  const endDate = endOfYear(baseDate).toISOString()

  let query = supabase
    .from('transactions')
    .select('created_at, amount, category, merchant, card')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const [categories, { data, error }, firstDate] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    query,
    getFirstTransactionDate(supabase)
  ])

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const groups: Record<string, any> = {}
  filteredData.forEach((t) => {
    const d = format(new Date(t.created_at), 'yyyy')
    if (!groups[d]) groups[d] = { date: d, amount: 0 }
    const cat = t.category || categorizeMerchant(t.merchant)
    groups[d].amount += Number(t.amount)
    groups[d][cat] = (groups[d][cat] || 0) + Number(t.amount)
  })

  const trends = Object.values(groups)

  return { trends, categories, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getSpendingByCategory(supabase: SupabaseClient) {
  return getCategorySpendingForRange(supabase, startOfMonth(new Date()).toISOString())
}

export async function getHistoricalMonthlyAverage(supabase: SupabaseClient) {
  const firstDate = await getFirstTransactionDate(supabase)
  const now = new Date()
  
  // Calculate months between first transaction and now (minimum 1)
  const monthDiff = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1
  
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .lt('created_at', startOfMonth(now).toISOString()) // Only count COMPLETED months for the average

  if (error) throw error
  if (!data || data.length === 0) return null

  const totalHistorical = data.reduce((sum, t) => sum + Number(t.amount), 0)
  return totalHistorical / Math.max(1, monthDiff - 1) // Divide by number of completed months
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
