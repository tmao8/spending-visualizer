import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getTransactionsPaginated } from '@/lib/services/transactions'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface TransactionsPageProps {
  searchParams: Promise<{ page?: string; search?: string; card?: string; category?: string }>
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const page = Math.max(1, Number(params.page || 1))
  const search = params.search || undefined
  const filter = {
    card: params.card || undefined,
    category: params.category || undefined,
  }

  const { transactions, totalCount, totalPages } = await getTransactionsPaginated(
    supabase, page, PAGE_SIZE, search, filter, user.id
  )

  // Build URL helper for pagination links
  const buildUrl = (newPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(newPage))
    if (search) p.set('search', search)
    if (filter.card) p.set('card', filter.card)
    if (filter.category) p.set('category', filter.category)
    return `/dashboard/transactions?${p.toString()}`
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-white/10">
        <div className="px-6 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">All Transactions</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{totalCount} items</p>
        </div>
      </header>

      <main className="px-6 md:px-8 py-12 max-w-4xl">
        <div className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
          <RecentTransactions transactions={transactions} />
        </div>

        {/* Server-side Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm font-bold text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildUrl(page - 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-300 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={buildUrl(page + 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-black text-sm font-bold text-white hover:bg-gray-800 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-200 text-sm font-bold text-gray-400 cursor-not-allowed">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
