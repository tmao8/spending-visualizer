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
  pending?: boolean
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
  'starbucks': 'Food & Drinks',
  'mcdonald': 'Food & Drinks',
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

export async function getSpendingByCategory(supabase: SupabaseClient, filter?: FilterOptions, startDate?: string, endDate?: string) {
  let query = supabase
    .from('transactions')
    .select('category, amount, merchant, card')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
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

export async function getSpendingByCard(supabase: SupabaseClient, filter?: FilterOptions, startDate?: string, endDate?: string) {
  let query = supabase
    .from('transactions')
    .select('card, amount, category, merchant')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
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
  // Use a rolling 30-day window to match the "Last 30 Days" dashboard label
  const start = startOfDay(subDays(new Date(), 29)).toISOString()
  const end = endOfDay(new Date()).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .gte('created_at', start)
    .lte('created_at', end)

  if (error) throw error

  return data.reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getDailySpending(supabase: SupabaseClient, days: number = 30, weekOffset: number = 0, filter?: FilterOptions, groupDays: number = 1, alignment: 'day' | 'week' = 'day', exactStart?: string, exactEnd?: string) {
  let startDateObj = new Date();
  let endDateObj = new Date();

  if (exactStart && exactEnd) {
    startDateObj = new Date(exactStart);
    endDateObj = new Date(exactEnd);
  } else {
    const baseDate = alignment === 'week' ? subWeeks(new Date(), weekOffset) : subDays(new Date(), weekOffset * 7)
    startDateObj = alignment === 'week' ? startOfWeek(baseDate, { weekStartsOn: 1 }) : subDays(baseDate, days - 1)
    endDateObj = alignment === 'week' ? endOfWeek(baseDate, { weekStartsOn: 1 }) : baseDate
  }
  
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
      const label = alignment === 'week' && (!exactStart) ? format(date, 'EEE') : format(date, 'd')
      const fullDate = format(date, 'MMM dd')
      
      const dayData: any = { 
        date: label, 
        fullDate, 
        amount: 0,
        rangeStart: startOfDay(date).toISOString(),
        rangeEnd: endOfDay(date).toISOString()
      }
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
      const endGroupDate = subDays(endDateObj, i) // Use endDateObj as base for grouping instead of baseDate to be exact with exactStart/End
      const startGroupDate = subDays(endGroupDate, groupDays - 1)
      
      // If we go past the startDateObj, cap it so we don't fetch outside the exact date range
      const actualStartGroupDate = startGroupDate < startDateObj ? startDateObj : startGroupDate;
      
      const label = `${format(actualStartGroupDate, 'd')}-${format(endGroupDate, 'd')}`
      const fullDate = `${format(actualStartGroupDate, 'MMM dd')} - ${format(endGroupDate, 'MMM dd')}`
      
      const groupData: any = { 
        date: label, 
        fullDate, 
        amount: 0,
        rangeStart: startOfDay(actualStartGroupDate).toISOString(),
        rangeEnd: endOfDay(endGroupDate).toISOString()
      }
      
      filteredData.forEach(t => {
        const tDate = new Date(getCalendarDay(t.created_at) + 'T00:00:00') // Treat as local time
        if (tDate >= startOfDay(actualStartGroupDate) && tDate <= endOfDay(endGroupDate)) {
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

export async function getWeeklySpending(supabase: SupabaseClient, weekOffset: number = 0, filter?: FilterOptions, exactStart?: string, exactEnd?: string) {
  let startDate = exactStart ? startOfDay(new Date(exactStart)).toISOString() : '';
  let endDate = exactEnd ? endOfDay(new Date(exactEnd)).toISOString() : '';

  if (!exactStart || !exactEnd) {
    const baseDate = subWeeks(new Date(), weekOffset)
    startDate = startOfDay(startOfWeek(baseDate, { weekStartsOn: 1 })).toISOString()
    endDate = endOfDay(endOfWeek(baseDate, { weekStartsOn: 1 })).toISOString()
  }

  const [trends, categories, firstDate, transactions] = await Promise.all([
    getDailySpending(supabase, 7, weekOffset, filter, 1, 'week', exactStart, exactEnd),
    getCategorySpendingForRange(supabase, startDate, endDate, filter),
    getFirstTransactionDate(supabase),
    getTransactionsForRange(supabase, startDate, endDate, filter)
  ])
  return { trends, categories, transactions, dateRange: { start: startDate, end: endDate }, firstTransactionDate: firstDate.toISOString() }
}

export async function getMonthlySpendingTrend(supabase: SupabaseClient, monthOffset: number = 0, filter?: FilterOptions, exactStart?: string, exactEnd?: string) {
  let startDate = exactStart ? startOfDay(new Date(exactStart)).toISOString() : '';
  let endDate = exactEnd ? endOfDay(new Date(exactEnd)).toISOString() : '';
  
  if (!exactStart || !exactEnd) {
    const baseDate = subMonths(new Date(), monthOffset)
    startDate = startOfMonth(baseDate).toISOString()
    endDate = endOfMonth(baseDate).toISOString()
  }
  
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
    const label = `${format(startGroupDate, 'd')}-${format(endGroupDate, 'd')}`
    const fullDate = `${format(startGroupDate, 'MMM d')} - ${format(endGroupDate, 'MMM d')}`
    
    const groupData: any = { 
      date: label, 
      fullDate, 
      amount: 0,
      rangeStart: startOfDay(startGroupDate).toISOString(),
      rangeEnd: endOfDay(endGroupDate).toISOString()
    }
    
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
    const label = format(month, 'MMM')
    const fullDate = format(month, 'MMMM yyyy')
    const monthData: any = { 
      date: label, 
      fullDate, 
      amount: 0,
      rangeStart: startOfMonth(month).toISOString(),
      rangeEnd: endOfMonth(month).toISOString()
    }
    
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

export async function getTransactionsPaginated(
  supabase: SupabaseClient, 
  page: number = 1, 
  pageSize: number = 50, 
  search?: string,
  filter?: FilterOptions
) {
  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter?.card) {
    query = query.eq('card', filter.card)
  }
  if (filter?.category) {
    query = query.eq('category', filter.category)
  }
  if (search) {
    query = query.ilike('merchant', `%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  const transactions = (data as any[]).map(t => ({
    ...t,
    category: t.category || categorizeMerchant(t.merchant)
  })) as Transaction[]

  return {
    transactions,
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function getSubscriptions(supabase: SupabaseClient) {
  const startDate = subDays(new Date(), 90).toISOString();
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount, created_at, category')
    .gte('created_at', startDate)
    .gt('amount', 0); // Ignore refunds/payments
  
  if (error || !data) return [];
  
  const map: Record<string, { merchant: string, amount: number, dates: Date[], category: string }> = {};
  
  data.forEach(t => {
    const key = `${t.merchant}_${t.amount}`;
    if (!map[key]) {
      map[key] = { merchant: t.merchant, amount: t.amount, dates: [], category: t.category || categorizeMerchant(t.merchant) };
    }
    map[key].dates.push(new Date(t.created_at));
  });
  
  const subscriptions = Object.values(map).filter(sub => {
    if (sub.dates.length < 2) return false;
    sub.dates.sort((a, b) => b.getTime() - a.getTime());
    
    // Check if the most recent gap is roughly a month (20-40 days)
    const gapDays = (sub.dates[0].getTime() - sub.dates[1].getTime()) / (1000 * 60 * 60 * 24);
    return gapDays >= 20 && gapDays <= 40;
  });
  
  return subscriptions.sort((a, b) => b.amount - a.amount);
}

export async function getBudgets(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('budgets').select('*');
  if (error || !data) {
    // Return default demo budgets if table doesn't exist yet
    return [
      { category: 'Food & Drinks', amount: 500 },
      { category: 'Shopping', amount: 300 }
    ];
  }
  return data;
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

