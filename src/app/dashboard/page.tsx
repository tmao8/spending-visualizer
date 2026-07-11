import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

import { 
  getMonthlyTotal, 
  getDailySpending, 
  getRecentTransactions,
  getSpendingByCategory,
  getSpendingByCard,
  getHistoricalMonthlyAverage,
  getSubscriptions,
  getBudgets
} from '@/lib/services/transactions'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { SpendingBarChart } from '@/components/dashboard/SpendingBarChart'
import { MerchantPieChart } from '@/components/dashboard/MerchantPieChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SpendingByCard } from '@/components/dashboard/SpendingByCard'
import { CardBalances } from '@/components/dashboard/CardBalances'
import { SubscriptionsList } from '@/components/dashboard/SubscriptionsList'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { PlaidConnect } from '@/components/dashboard/PlaidConnect'
import { PlaidSyncManager } from '@/components/dashboard/PlaidSyncManager'
import { LogOut, ArrowUpRight, Sparkles } from 'lucide-react'
import { signOut } from '../login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // 30 day date range for "Spending by Card" to match DailySpending
  const startDate = startOfDay(subDays(new Date(), 29)).toISOString()
  const endDate = endOfDay(new Date()).toISOString()

  // Fetch data in parallel
  const [monthlyTotal, dailySpending, categorySpending, recentTransactions, cardSpending, historicalAverage, subscriptions, budgets] = await Promise.all([
    getMonthlyTotal(supabase),
    getDailySpending(supabase, 30, 0, undefined, 5, 'day'),
    getSpendingByCategory(supabase, undefined, startDate, endDate),
    getRecentTransactions(supabase),
    getSpendingByCard(supabase, undefined, startDate, endDate),
    getHistoricalMonthlyAverage(supabase),
    getSubscriptions(supabase),
    getBudgets(supabase),
  ])

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-black" />
              Clarity.
            </h1>
            <div className="flex items-center gap-4">
              <PlaidSyncManager />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <PlaidConnect />
            <Link 
              href="/dashboard/trends" 
              className="text-sm font-semibold text-gray-500 hover:text-black transition-colors flex items-center gap-1"
            >
              Trends <ArrowUpRight className="w-4 h-4" />
            </Link>
            <form action={signOut}>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        {/* Summary Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Activity</p>
            <h2 className="text-6xl font-black tracking-tighter text-black">
              ${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <Link 
            href="/dashboard/trends"
            className="inline-flex items-center px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Deep Dive into Trends
          </Link>
        </section>

        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area (2/3 width) */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-black">Spending History</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 30 Days</span>
              </div>
              <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                <SpendingBarChart data={dailySpending} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-black">Latest Activity</h2>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <RecentTransactions transactions={recentTransactions} />
              </div>
            </section>
          </div>

          {/* Sidebar Area (1/3 width) */}
          <div className="space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-black">By Category</h2>
              </div>
              <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                <MerchantPieChart data={categorySpending} />
              </div>
            </section>

            <SpendingByCard data={cardSpending} />
            <CardBalances />
            
            <BudgetProgress budgets={budgets} categorySpending={categorySpending} />
            <SubscriptionsList subscriptions={subscriptions} />
            
            {/* Quick Insights or other desktop elements can go here */}
            <section className="bg-black rounded-3xl p-8 text-white">
              <h3 className="text-lg font-bold mb-2">Smart Insight</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {historicalAverage 
                  ? `You've spent ${((monthlyTotal / historicalAverage) * 100).toFixed(0)}% of your typical monthly average ($${historicalAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`
                  : "You're in your first month of tracking! Keep adding transactions to see how your spending compares to your future monthly average."
                }
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
