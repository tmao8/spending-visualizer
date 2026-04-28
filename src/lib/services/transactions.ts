import { SupabaseClient } from '@supabase/supabase-js'
import { 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  format, 
  startOfDay, 
  endOfDay, 
  subMonths, 
  startOfYear, 
  endOfYear, 
  subYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  subWeeks
} from 'date-fns'

// Helper to get YYYY-MM-DD from a potentially UTC string without timezone shifting
function getCalendarDay(dateStr: string) {
  return dateStr.substring(0, 10)
}

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

export const STATIC_CATEGORIES = [
  "Groceries", "Food & Drinks", "Travel", "Entertainment", 
  "Shopping", "Transportation", "Services", "Health", "Other"
] as const

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

export async function getDailySpending(supabase: SupabaseClient, days: number = 30, weekOffset: number = 0, filter?: FilterOptions, groupDays: number = 1, alignment: 'day' | 'week' = 'day') {
  const baseDate = alignment === 'week' ? subWeeks(new Date(), weekOffset) : subDays(new Date(), weekOffset * 7)
  const startDateObj = alignment === 'week' ? startOfWeek(baseDate, { weekStartsOn: 1 }) : subDays(baseDate, days - 1)
  const endDateObj = alignment === 'week' ? endOfWeek(baseDate, { weekStartsOn: 1 }) : baseDate
  
  const startDate = startOfDay(startDateObj).toISOString()
  const endDate = endOfDay(endDateObj).toISOString()

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

  const groups: any[] = []
  
  if (groupDays === 1) {
    const dateInterval = eachDayOfInterval({ start: startDateObj, end: endDateObj })
    dateInterval.forEach(date => {
      const dayStr = format(date, 'yyyy-MM-dd')
      const label = alignment === 'week' ? format(date, 'eee') : format(date, 'MMM dd')
      
      const dayData: any = { date: label, amount: 0 }
      filteredData.forEach(t => {
        if (getCalendarDay(t.created_at) === dayStr) {
          const cat = t.category || categorizeMerchant(t.merchant)
          dayData.amount += Number(t.amount)
          dayData[cat] = (dayData[cat] || 0) + Number(t.amount)
        }
      })
      groups.push(dayData)
    })
  } else {
    // Grouped view (e.g. 5-day increments for Home)
    for (let i = 0; i < days; i += groupDays) {
      const endGroupDate = subDays(baseDate, i)
      const startGroupDate = subDays(endGroupDate, groupDays - 1)
      const label = `${format(startGroupDate, 'MMM dd')} - ${format(endGroupDate, 'dd')}`
      
      const groupData: any = { date: label, amount: 0 }
      
      filteredData.forEach(t => {
        const tDate = new Date(getCalendarDay(t.created_at) + 'T00:00:00') // Treat as local time
        if (tDate >= startOfDay(startGroupDate) && tDate <= endOfDay(endGroupDate)) {
          const cat = t.category || categorizeMerchant(t.merchant)
          groupData.amount += Number(t.amount)
          groupData[cat] = (groupData[cat] || 0) + Number(t.amount)
        }
      })
      groups.unshift(groupData)
    }
  }

  return groups
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
  const baseDate = subWeeks(new Date(), weekOffset)
  const startDate = startOfDay(startOfWeek(baseDate, { weekStartsOn: 1 })).toISOString()
  const endDate = endOfDay(endOfWeek(baseDate, { weekStartsOn: 1 })).toISOString()

  
  const [trends, categories, firstDate, transactions] = await Promise.all([
    getDailySpending(supabase, 7, weekOffset, filter, 1, 'week'),
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    getFirstTransactionDate(supabase),
    getTransactionsForRange(supabase, startDate, endDate, filter)
  ])
  return { trends, categories, transactions, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getMonthlySpendingTrend(supabase: SupabaseClient, monthOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subMonths(new Date(), monthOffset)
  const startDate = startOfMonth(baseDate).toISOString()
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

  const [categories, { data, error }, firstDate, transactions] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    query,
    getFirstTransactionDate(supabase),
    getTransactionsForRange(supabase, startDate, endDate, filter)
  ])

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const daysInMonth = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) })
  const groupDays = 7
  const trends: any[] = []

  for (let i = 0; i < daysInMonth.length; i += groupDays) {
    const startGroupDate = daysInMonth[i]
    const endGroupDate = daysInMonth[Math.min(i + groupDays - 1, daysInMonth.length - 1)]
    const label = `${format(startGroupDate, 'MMM dd')} - ${format(endGroupDate, 'dd')}`
    
    const groupData: any = { date: label, amount: 0 }
    
    const groupDaysSlice = daysInMonth.slice(i, i + groupDays).map(d => format(d, 'yyyy-MM-dd'))

    filteredData.forEach(t => {
      const transactionDay = getCalendarDay(t.created_at)
      if (groupDaysSlice.includes(transactionDay)) {
        const cat = t.category || categorizeMerchant(t.merchant)
        groupData.amount += Number(t.amount)
        groupData[cat] = (groupData[cat] || 0) + Number(t.amount)
      }
    })
    trends.push(groupData)
  }

  return { trends, categories, transactions, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getYearlySpending(supabase: SupabaseClient, yearOffset: number = 0, filter?: FilterOptions) {
  const baseDate = subYears(new Date(), yearOffset)
  const startDate = startOfYear(baseDate).toISOString()
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

  const [categories, { data, error }, firstDate, transactions] = await Promise.all([
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    query,
    getFirstTransactionDate(supabase),
    getTransactionsForRange(supabase, startDate, endDate, filter)
  ])

  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }

  const months = eachMonthOfInterval({ start: new Date(startDate), end: new Date(endDate) })
  const trends = months.map(month => {
    const monthPrefix = format(month, 'yyyy-MM')
    const monthData: any = { date: format(month, 'MMM'), amount: 0 }
    
    filteredData.forEach(t => {
      if (getCalendarDay(t.created_at).startsWith(monthPrefix)) {
        const cat = t.category || categorizeMerchant(t.merchant)
        monthData.amount += Number(t.amount)
        monthData[cat] = (monthData[cat] || 0) + Number(t.amount)
      }
    })
    return monthData
  })

  return { trends, categories, transactions, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getSpendingByCategory(supabase: SupabaseClient) {
  return getCategorySpendingForRange(supabase, startOfMonth(new Date()).toISOString())
}

export async function getTransactionsForRange(supabase: SupabaseClient, startDate: string, endDate: string, filter?: FilterOptions) {
  let query = supabase
    .from('transactions')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }

  const { data, error } = await query
  if (error) throw error

  let filteredData = data
  if (filter?.category) {
    filteredData = data.filter(t => (t.category || categorizeMerchant(t.merchant)) === filter.category)
  }
  
  return filteredData.map(t => ({
    ...t,
    category: t.category || categorizeMerchant(t.merchant)
  })) as Transaction[]
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

export async function addTransaction(supabase: SupabaseClient, transaction: Omit<Transaction, 'id' | 'created_at'> & { created_at?: string }) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}
