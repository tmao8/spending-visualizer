'use client'

import { useState, useCallback } from 'react'
import { SpendingBarChart } from './SpendingBarChart'
import { MerchantPieChart } from './MerchantPieChart'
import { SpendingByCard } from './SpendingByCard'
import { ChevronLeft, ChevronRight, Loader2, X, Filter } from 'lucide-react'
import { format, isAfter, startOfDay } from 'date-fns'
import { FilterOptions } from '@/lib/services/transactions'

interface TimeframeData {
  trends: { date: string; amount: number }[]
  categories: { name: string; value: number }[]
  dateRange?: { start: string; end: string }
  firstTransactionDate?: string
}

interface TrendsViewProps {
  weekly: TimeframeData
  monthly: TimeframeData
  yearly: TimeframeData
  cardData: { name: string; value: number }[]
  fetchWeeklyAction: (offset: number, filter?: FilterOptions) => Promise<TimeframeData>
  fetchMonthlyAction: (offset: number, filter?: FilterOptions) => Promise<TimeframeData>
  fetchYearlyAction: (offset: number, filter?: FilterOptions) => Promise<TimeframeData>
  fetchCardAction: (filter?: FilterOptions) => Promise<{ name: string; value: number }[]>
}

type Timeframe = 'weekly' | 'monthly' | 'yearly'

export function TrendsView({ 
  weekly, monthly, yearly, cardData, 
  fetchWeeklyAction, fetchMonthlyAction, fetchYearlyAction, fetchCardAction
}: TrendsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')
  const [offsets, setOffsets] = useState({ weekly: 0, monthly: 0, yearly: 0 })
  const [isNavigating, setIsNavigating] = useState(false)
  const [data, setData] = useState({ weekly, monthly, yearly })
  const [currentCardData, setCurrentCardData] = useState(cardData)
  const [activeFilter, setActiveFilter] = useState<FilterOptions | null>(null)

  const activeData = data[timeframe]
  const currentOffset = offsets[timeframe]

  const handleNav = useCallback(async (delta: number, filterOverride?: FilterOptions | null) => {
    const filterToUse = filterOverride === undefined ? activeFilter : filterOverride
    const newOffset = delta === 0 && filterOverride !== undefined ? currentOffset : currentOffset + delta
    
    setIsNavigating(true)
    try {
      // Fetch trend data for current timeframe
      let newData: TimeframeData
      if (timeframe === 'weekly') newData = await fetchWeeklyAction(newOffset, filterToUse || undefined)
      else if (timeframe === 'monthly') newData = await fetchMonthlyAction(newOffset, filterToUse || undefined)
      else newData = await fetchYearlyAction(newOffset, filterToUse || undefined)
      
      // Also fetch updated card data to keep everything in sync
      const newCardData = await fetchCardAction(filterToUse || undefined)
      
      setData(prev => ({ ...prev, [timeframe]: newData }))
      setCurrentCardData(newCardData)
      setOffsets(prev => ({ ...prev, [timeframe]: newOffset }))
      if (filterOverride !== undefined) setActiveFilter(filterOverride)
    } finally {
      setIsNavigating(false)
    }
  }, [timeframe, currentOffset, activeFilter, fetchWeeklyAction, fetchMonthlyAction, fetchYearlyAction, fetchCardAction])

  const clearFilter = () => handleNav(0, null)

  const calculateSmartAverage = () => {
    const total = activeData.trends.reduce((sum, d) => sum + d.amount, 0)
    if (total === 0) return 0

    if (!activeData.firstTransactionDate || !activeData.dateRange) {
      return total / (activeData.trends.length || 1)
    }

    const firstDate = startOfDay(new Date(activeData.firstTransactionDate))
    const rangeStart = startOfDay(new Date(activeData.dateRange.start))
    
    let periodsToCount = activeData.trends.length
    
    if (isAfter(firstDate, rangeStart)) {
      const effectiveStart = isAfter(firstDate, rangeStart) ? firstDate : rangeStart
      const rangeEnd = new Date(activeData.dateRange.end)
      
      if (timeframe === 'weekly') {
        const diffDays = Math.ceil((rangeEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24))
        periodsToCount = Math.max(1, Math.min(7, diffDays))
      } else if (timeframe === 'monthly') {
        const firstMonth = firstDate.getMonth() + firstDate.getFullYear() * 12
        periodsToCount = activeData.trends.filter(t => {
          const d = new Date(t.date)
          if (isNaN(d.getTime())) return true
          return (d.getMonth() + d.getFullYear() * 12) >= firstMonth
        }).length
        periodsToCount = Math.max(1, periodsToCount)
      }
    }

    return total / periodsToCount
  }

  const totalPeriodSpend = activeData.trends.reduce((sum, d) => sum + d.amount, 0)
  const averageSpend = calculateSmartAverage()

  return (
    <div className="space-y-12">
      {/* Timeframe Selector & Navigation */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center p-1 bg-gray-100 rounded-2xl w-fit">
          {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTimeframe(t)
                // We might need to refetch for the new timeframe if a filter is active
                // but for now let's just switch. The handleNav logic would need 
                // to be triggered if we want filtered view for the other timeframe.
                // To keep it simple, we refetch when timeframe changes if filtered.
              }}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                timeframe === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleNav(1)}
            disabled={isNavigating}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center min-w-[240px]">
            {isNavigating ? (
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
                      ? `${format(new Date(activeData.dateRange.start), 'MMMM yyyy')} - ${format(new Date(activeData.dateRange.end), 'MMMM yyyy')}`
                      : `${format(new Date(activeData.dateRange.start), 'yyyy')} - ${format(new Date(activeData.dateRange.end), 'yyyy')}`
                  ) : `Current ${timeframe}`}
                </p>
                {(currentOffset !== 0 || activeFilter) && (
                  <button 
                    onClick={() => {
                      if (activeFilter) clearFilter()
                      else handleNav(-currentOffset)
                    }}
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
            disabled={isNavigating || currentOffset === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter && (
          <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold animate-in fade-in zoom-in duration-300">
            <Filter className="w-3 h-3" />
            <span className="opacity-70 uppercase tracking-widest">{activeFilter.type}:</span>
            <span>{activeFilter.value}</span>
            <button 
              onClick={clearFilter}
              className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 relative overflow-hidden">
            {isNavigating && (
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center" />
            )}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-black capitalize">
                  {activeFilter ? activeFilter.value : timeframe} Spending Trend
                </h3>
                <p className="text-gray-400 text-sm font-medium mt-1">
                  {timeframe === 'weekly' && 'Daily breakdown for the selected 7-day period'}
                  {timeframe === 'monthly' && 'Monthly breakdown for the last 12 months'}
                  {timeframe === 'yearly' && 'Annual spending for the last 5 years'}
                </p>
              </div>
            </div>
            <SpendingBarChart data={activeData.trends} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average {timeframe.replace('ly', '')}</p>
              <p className="text-2xl font-black text-black">
                ${averageSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
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
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100">
            <div className="mb-8">
              <h3 className="text-xl font-black tracking-tight text-black capitalize">Categories ({timeframe})</h3>
            </div>
            <MerchantPieChart 
              data={activeData.categories} 
              onCategoryClick={(cat) => handleNav(0, { type: 'category', value: cat })}
            />
          </div>

          <SpendingByCard 
            data={currentCardData} 
            onCardClick={(card) => handleNav(0, { type: 'card', value: card })}
          />

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Category Breakdown</h4>
            <div className="space-y-4">
              {activeData.categories.map((cat) => (
                <button 
                  key={cat.name} 
                  onClick={() => handleNav(0, { type: 'category', value: cat.name })}
                  className="w-full flex justify-between items-center hover:opacity-70 transition-opacity text-left"
                >
                  <span className="text-sm font-bold text-black">{cat.name}</span>
                  <span className="text-sm font-medium text-gray-500">${cat.value.toLocaleString()}</span>
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
