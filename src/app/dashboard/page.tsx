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
  getHistoricalMonthlyAverage
} from '@/lib/services/transactions'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { OverviewSpendingChart } from '@/components/dashboard/OverviewSpendingChart'
import { MerchantPieChart } from '@/components/dashboard/MerchantPieChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SpendingByCard } from '@/components/dashboard/SpendingByCard'
import { CardBalances } from '@/components/dashboard/CardBalances'
import { NumberTicker } from '@/components/dashboard/NumberTicker'
import { AIRoastWidget } from '@/components/dashboard/AIRoastWidget'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

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
  const [monthlyTotal, dailySpending, categorySpending, recentTransactions, cardSpending, historicalAverage] = await Promise.all([
    getMonthlyTotal(supabase),
    getDailySpending(supabase, 30, 0, undefined, 5, 'day'),
    getSpendingByCategory(supabase, undefined, startDate, endDate),
    getRecentTransactions(supabase),
    getSpendingByCard(supabase, undefined, startDate, endDate),
    getHistoricalMonthlyAverage(supabase)
  ])

  // Compute insight inline
  const pctOfAvg = historicalAverage ? Math.round((monthlyTotal / historicalAverage) * 100) : null
  const insightIcon = pctOfAvg === null ? null : pctOfAvg > 110 ? <ArrowUpRight className="w-4 h-4" /> : pctOfAvg < 90 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />
  const insightColor = pctOfAvg === null ? '' : pctOfAvg > 110 ? 'text-red-500' : pctOfAvg < 90 ? 'text-emerald-500' : 'text-gray-400'
  const insightText = pctOfAvg !== null
    ? `${pctOfAvg}% of your $${historicalAverage!.toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly avg`
    : 'First month of tracking'

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <main className="px-6 md:px-8 py-12 space-y-12">
        {/* Summary Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Last 30 Days</p>
            <h2 className="text-6xl font-black tracking-tighter text-black dark:text-white">
              <NumberTicker prefix="$" value={monthlyTotal} decimals={2} />
            </h2>
            <div className={`flex items-center gap-1.5 mt-2 text-sm font-bold ${insightColor}`}>
              {insightIcon}
              <span>{insightText}</span>
            </div>
          </div>
          <Link 
            href="/dashboard/trends"
            className="inline-flex items-center px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Deep Dive into Trends
          </Link>
        </section>

        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area (2/3 width) */}
          <div className="lg:col-span-2 space-y-12">
            <AIRoastWidget />

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Spending History</h2>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Last 30 Days</span>
              </div>
              <div className="bg-gray-50/50 dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-white/10 transition-transform hover:scale-[1.01] duration-300">
                <OverviewSpendingChart data={dailySpending} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Latest Activity</h2>
                <Link 
                  href="/dashboard/transactions"
                  className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
                >
                  View All
                </Link>
              </div>
              <div className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
                <RecentTransactions transactions={recentTransactions} />
              </div>
            </section>
          </div>

          {/* Sidebar Area (1/3 width) */}
          <div className="space-y-12">
            <section className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden group transition-transform hover:scale-[1.01] duration-300">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">By Category</h3>
              <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-black/[0.02] dark:from-white/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <MerchantPieChart data={categorySpending} />
              </div>
            </section>

            <SpendingByCard data={cardSpending} />
            <CardBalances />
          </div>
        </div>
      </main>
    </div>
  )
}
