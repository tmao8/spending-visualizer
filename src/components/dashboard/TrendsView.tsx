'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SpendingBarChart } from './SpendingBarChart'
import { MerchantPieChart } from './MerchantPieChart'
import { SpendingByCard } from './SpendingByCard'
import { RecentTransactions } from './RecentTransactions'
import { Transaction } from '@/lib/services/transactions'
import { ChevronLeft, ChevronRight, Loader2, X, Filter } from 'lucide-react'
import { format, isAfter, startOfDay } from 'date-fns'
import { FilterOptions } from '@/lib/services/transactions'

interface TimeframeData {
  trends: { date: string; amount: number }[]
  categories: { name: string; value: number }[]
  transactions: Transaction[]
  dateRange?: { start: string; end: string }
  firstTransactionDate?: string
}

interface TrendsViewProps {
  weekly: TimeframeData
  monthly: TimeframeData
  yearly: TimeframeData
  cardData: { name: string; value: number }[]
}

type Timeframe = 'weekly' | 'monthly' | 'yearly'

export function TrendsView({ 
  weekly, monthly, yearly, cardData
}: TrendsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const timeframe = (searchParams.get('timeframe') as Timeframe) || 'monthly'
  const weekOffset = Number(searchParams.get('weekOffset') || 0)
  const monthOffset = Number(searchParams.get('monthOffset') || 0)
  const yearOffset = Number(searchParams.get('yearOffset') || 0)
  
  const filter: FilterOptions = {
    card: searchParams.get('card') || undefined,
    category: searchParams.get('category') || undefined
  }

  const activeData = timeframe === 'weekly' ? weekly : timeframe === 'monthly' ? monthly : yearly
  const currentOffset = timeframe === 'weekly' ? weekOffset : timeframe === 'monthly' ? monthOffset : yearOffset

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    startTransition(() => {
      router.push(`/dashboard/trends?${params.toString()}`)
    })
  }

  const handleNav = (delta: number) => {
    const key = timeframe === 'weekly' ? 'weekOffset' : timeframe === 'monthly' ? 'monthOffset' : 'yearOffset'
    updateParams({ [key]: String(currentOffset + delta) })
  }

  const handleFilter = (type: keyof FilterOptions, value: string | null) => {
    updateParams({ [type]: value })
  }

  const resetView = () => {
    startTransition(() => {
      router.push('/dashboard/trends')
    })
  }
  
  const totalPeriodSpend = activeData.trends.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="space-y-12">
      {/* Timeframe Selector & Navigation */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center p-1 bg-gray-100 rounded-2xl w-fit">
          {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateParams({ timeframe: t })}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                timeframe === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleNav(1)}
            disabled={isPending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center min-w-[240px]">
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm font-bold text-gray-400">Loading {timeframe}...</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-black">
                  {activeData.dateRange ? (
                    timeframe === 'weekly' 
                      ? `${format(new Date(activeData.dateRange.start), 'MMM dd')} - ${format(new Date(activeData.dateRange.end), 'MMM dd, yyyy')}`
                      : timeframe === 'monthly'
                      ? format(new Date(activeData.dateRange.start), 'MMMM yyyy')
                      : format(new Date(activeData.dateRange.start), 'yyyy')
                  ) : `Current ${timeframe}`}
                </p>
                {(currentOffset !== 0 || filter.card || filter.category) && (
                  <button 
                    onClick={resetView}
                    className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1"
                  >
                    Reset View
                  </button>
                )}
              </>
            )}
          </div>

          <button 
            onClick={() => handleNav(-1)}
            disabled={isPending || currentOffset === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Active Filters */}
        {(filter.card || filter.category) && (
          <div className="flex flex-wrap items-center justify-center gap-2 px-4">
            {filter.card && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold animate-in fade-in zoom-in duration-300">
                <Filter className="w-3 h-3" />
                <span className="opacity-70 uppercase tracking-widest text-[10px]">Card:</span>
                <span>{filter.card}</span>
                <button 
                  onClick={() => handleFilter('card', null)}
                  className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {filter.category && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold animate-in fade-in zoom-in duration-300">
                <Filter className="w-3 h-3" />
                <span className="opacity-70 uppercase tracking-widest text-[10px]">Category:</span>
                <span>{filter.category}</span>
                <button 
                  onClick={() => handleFilter('category', null)}
                  className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 relative overflow-hidden">
            {isPending && (
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center" />
            )}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-black capitalize">
                  {filter.category || filter.card || timeframe} Spending Trend
                </h3>
                <p className="text-gray-400 text-sm font-medium mt-1">
                  {timeframe === 'weekly' && 'Daily breakdown for the selected week'}
                  {timeframe === 'monthly' && 'Weekly breakdown for the selected month'}
                  {timeframe === 'yearly' && 'Monthly breakdown for the selected year'}
                </p>
              </div>
            </div>
            <SpendingBarChart data={activeData.trends} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peak {timeframe.replace('ly', '')}</p>
              <p className="text-2xl font-black text-black">
                ${Math.max(...activeData.trends.map(d => d.amount), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Period Spend</p>
              <p className="text-2xl font-black text-black">
                ${totalPeriodSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Transactions in Period</h4>
            </div>
            <RecentTransactions transactions={activeData.transactions} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100">
            <div className="mb-8">
              <h3 className="text-xl font-black tracking-tight text-black capitalize">Categories ({timeframe})</h3>
            </div>
            <MerchantPieChart 
              data={activeData.categories} 
              onCategoryClick={(cat) => handleFilter('category', cat)}
            />
          </div>

          <SpendingByCard 
            data={cardData} 
            onCardClick={(card) => handleFilter('card', card)}
          />

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Category Breakdown</h4>
            <div className="space-y-4">
              {activeData.categories.map((cat) => (
                <button 
                  key={cat.name} 
                  onClick={() => handleFilter('category', cat.name)}
                  className="w-full flex justify-between items-center group text-left"
                >
                  <span className="text-sm font-bold text-black group-hover:opacity-70 transition-opacity">{cat.name}</span>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-black transition-colors">${cat.value.toLocaleString()}</span>
                </button>
              ))}
              {activeData.categories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No categories found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
