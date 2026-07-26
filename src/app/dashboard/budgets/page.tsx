import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSubscriptions, getBudgets, getSpendingByCategory } from '@/lib/services/transactions'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { SubscriptionsList } from '@/components/dashboard/SubscriptionsList'
import { Target, RotateCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BudgetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const startDate = startOfMonth(new Date()).toISOString()
  const endDate = endOfMonth(new Date()).toISOString()

  const [budgets, subscriptions, categorySpending] = await Promise.all([
    getBudgets(supabase),
    getSubscriptions(supabase),
    getSpendingByCategory(supabase, undefined, startDate, endDate),
  ])

  const totalFixedCosts = subscriptions.reduce((sum: number, s: any) => sum + s.amount, 0)

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-white/10">
        <div className="px-6 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">Budgets & Subscriptions</h1>
        </div>
      </header>

      <main className="px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Budgets Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-black dark:text-white">Monthly Budgets</h2>
                <p className="text-xs font-medium text-gray-400">Track spending against your limits</p>
              </div>
            </div>
            <BudgetProgress budgets={budgets} categorySpending={categorySpending} />
          </div>

          {/* Subscriptions Column */}
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
                  <RotateCw className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-black dark:text-white">Fixed Costs</h2>
                  <p className="text-xs font-medium text-gray-400">Auto-detected recurring charges</p>
                </div>
              </div>
              {totalFixedCosts > 0 && (
                <span className="text-sm font-black text-black dark:text-white">
                  ${totalFixedCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              )}
            </div>
            <SubscriptionsList subscriptions={subscriptions} />
          </div>

        </div>
      </main>
    </div>
  )
}
