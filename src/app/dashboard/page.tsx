import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { 
  getMonthlyTotal, 
  getDailySpending, 
  getRecentTransactions,
  getSpendingByCategory
} from '@/lib/services/transactions'
import { SpendingBarChart } from '@/components/dashboard/SpendingBarChart'
import { MerchantPieChart } from '@/components/dashboard/MerchantPieChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { CardGradient } from '@/components/dashboard/CardGradient'
import { LogOut } from 'lucide-react'
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
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-black">Clarity</h1>
          <form action={signOut}>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 mt-4 space-y-10">
        {/* Card Section */}
        <section>
          <div className="relative">
            <CardGradient />
            {/* Inject the value into the card using a small trick for server components or just hardcode if it was static */}
            <div className="absolute bottom-8 left-16 hidden">
               {/* This is just a reference for where the value goes visually in CardGradient */}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            #card-total-value { content: '${monthlyTotal.toFixed(2)}'; }
            #card-total-value::before { content: '${monthlyTotal.toFixed(2)}'; }
          ` }} />
        </section>

        {/* Charts Section */}
        <section className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-black">Spending</h2>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 30 Days</span>
            </div>
            <div className="bg-gray-50/50 rounded-3xl p-6">
              <SpendingBarChart data={dailySpending} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-black">Categories</h2>
            </div>
            <div className="bg-gray-50/50 rounded-3xl p-6">
              <MerchantPieChart data={categorySpending} />
            </div>
          </div>
        </section>

        {/* Activity Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight text-black">Latest Activity</h2>
          </div>
          <div className="bg-white">
            <RecentTransactions transactions={recentTransactions} />
          </div>
        </section>
      </main>
    </div>
  )
}
