import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  getMonthlyTotal, 
  getDailySpending, 
  getRecentTransactions,
  getSpendingByCategory
} from '@/lib/services/transactions'
import { SpendingBarChart } from '@/components/dashboard/SpendingBarChart'
import { MerchantPieChart } from '@/components/dashboard/MerchantPieChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { LogOut, ArrowUpRight } from 'lucide-react'
import { signOut } from '../login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch data in parallel
  const [monthlyTotal, dailySpending, categorySpending, recentTransactions] = await Promise.all([
    getMonthlyTotal(supabase),
    getDailySpending(supabase),
    getSpendingByCategory(supabase),
    getRecentTransactions(supabase),
  ])

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-black">Clarity</h1>
          <div className="flex items-center gap-6">
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
            
            {/* Quick Insights or other desktop elements can go here */}
            <section className="bg-black rounded-3xl p-8 text-white">
              <h3 className="text-lg font-bold mb-2">Smart Insight</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You've spent {((monthlyTotal / 2000) * 100).toFixed(0)}% of your typical monthly average. Keep tracking to see your full financial picture.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
