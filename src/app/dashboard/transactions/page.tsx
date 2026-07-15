import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getTransactionsForRange } from '@/lib/services/transactions'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Fetch last 365 days of transactions for the ledger page
  const startDate = startOfDay(subDays(new Date(), 365)).toISOString()
  const endDate = endOfDay(new Date()).toISOString()
  
  const transactions = await getTransactionsForRange(supabase, startDate, endDate)

  return (
    <div className="bg-white">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="px-8 md:px-12 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-black">All Transactions</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{transactions.length} items</p>
        </div>
      </header>

      <main className="px-8 md:px-12 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <RecentTransactions transactions={transactions} />
        </div>
      </main>
    </div>
  )
}
