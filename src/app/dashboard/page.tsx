import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { 
  getMonthlyTotal, 
  getDailySpending, 
  getTopMerchants, 
  getRecentTransactions 
} from '@/lib/services/transactions'
import { KPI } from '@/components/dashboard/KPI'
import { SpendingBarChart } from '@/components/dashboard/SpendingBarChart'
import { MerchantPieChart } from '@/components/dashboard/MerchantPieChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { CreditCard, LogOut, TrendingUp } from 'lucide-react'
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
  const [monthlyTotal, dailySpending, topMerchants, recentTransactions] = await Promise.all([
    getMonthlyTotal(supabase),
    getDailySpending(supabase),
    getTopMerchants(supabase),
    getRecentTransactions(supabase),
  ])

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Spending Visualizer</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action={signOut}>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KPI 
            title="Spent This Month" 
            value={`$${monthlyTotal.toFixed(2)}`} 
            icon={TrendingUp} 
          />
          <KPI 
            title="Recent Merchant" 
            value={recentTransactions[0]?.merchant || 'N/A'} 
            icon={CreditCard} 
            description={recentTransactions[0] ? `Last spend: $${Number(recentTransactions[0].amount).toFixed(2)}` : undefined}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">Spending (Last 30 Days)</h2>
            <SpendingBarChart data={dailySpending} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">Top Merchants</h2>
            <MerchantPieChart data={topMerchants} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </main>
    </div>
  )
}
