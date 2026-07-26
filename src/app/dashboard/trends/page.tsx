import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

import { 
  getWeeklySpending, 
  getMonthlySpendingTrend, 
  getYearlySpending,
  getSpendingByCard,
  FilterOptions
} from '@/lib/services/transactions'

import { TrendsView } from '@/components/dashboard/TrendsView'
import { ChevronLeft } from 'lucide-react'
import { Suspense } from 'react'

async function TrendsContent({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const weekOffset = Number(params.weekOffset || 0)
  const monthOffset = Number(params.monthOffset || 0)
  const yearOffset = Number(params.yearOffset || 0)
  const exactStart = params.start || undefined
  const exactEnd = params.end || undefined
  
  const filter: FilterOptions = {
    card: params.card || undefined,
    category: params.category || undefined
  }

  // Fetch trend data in parallel based on filters
  const [weekly, monthly, yearly, cardData] = await Promise.all([
    getWeeklySpending(supabase, weekOffset, filter, exactStart, exactEnd),
    getMonthlySpendingTrend(supabase, monthOffset, filter, exactStart, exactEnd),
    getYearlySpending(supabase, yearOffset, filter),
    getSpendingByCard(supabase, filter),
  ])

  return (
    <>
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-white/10">
        <div className="px-6 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">Spending Trends</h1>
        </div>
      </header>

      <main className="px-6 md:px-8 mt-12">
        <TrendsView 
          weekly={weekly}
          monthly={monthly}
          yearly={yearly}
          cardData={cardData}
        />
      </main>
    </>
  )
}

interface PageProps {
  searchParams: Promise<any>
}

export default function TrendsPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-20">
      <Suspense fallback={<TrendsLoadingSkeleton />}>
        <TrendsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function TrendsLoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-white/10 rounded-2xl w-fit mx-auto">
        <div className="w-24 h-8 bg-gray-200 rounded-xl mx-1 animate-pulse" />
        <div className="w-24 h-8 bg-white dark:bg-black rounded-xl mx-1 shadow-sm" />
        <div className="w-24 h-8 bg-gray-200 rounded-xl mx-1 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-gray-50/50 dark:bg-neutral-900/50 rounded-3xl p-10 border border-gray-100 dark:border-white/10 h-[450px] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-black h-32 rounded-3xl border border-gray-100 dark:border-white/10 animate-pulse" />
            <div className="bg-white dark:bg-black h-32 rounded-3xl border border-gray-100 dark:border-white/10 animate-pulse" />
            <div className="bg-white dark:bg-black h-32 rounded-3xl border border-gray-100 dark:border-white/10 animate-pulse" />
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-gray-50/50 dark:bg-neutral-900/50 rounded-3xl p-10 border border-gray-100 dark:border-white/10 h-[350px] animate-pulse" />
          <div className="bg-white dark:bg-black h-64 rounded-3xl border border-gray-100 dark:border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
