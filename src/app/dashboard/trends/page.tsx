import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  getWeeklySpending, 
  getMonthlySpendingTrend, 
  getYearlySpending 
} from '@/lib/services/transactions'
import { TrendsView } from '@/components/dashboard/TrendsView'
import { ChevronLeft } from 'lucide-react'

export default async function TrendsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch all trend data in parallel
  const [weeklyData, monthlyData, yearlyData] = await Promise.all([
    getWeeklySpending(supabase),
    getMonthlySpendingTrend(supabase),
    getYearlySpending(supabase),
  ])

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-black">Spending Trends</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <TrendsView 
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          yearlyData={yearlyData}
        />
      </main>
    </div>
  )
}
