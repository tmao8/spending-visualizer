'use client'

import { useState } from 'react'
import { SpendingBarChart } from './SpendingBarChart'
import { MerchantPieChart } from './MerchantPieChart'
import { SpendingByCard } from './SpendingByCard'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { format, isAfter, startOfDay } from 'date-fns'

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
  fetchWeeklyAction: (offset: number) => Promise<TimeframeData>
  fetchMonthlyAction: (offset: number) => Promise<TimeframeData>
  fetchYearlyAction: (offset: number) => Promise<TimeframeData>
}

type Timeframe = 'weekly' | 'monthly' | 'yearly'

export function TrendsView({ 
  weekly, monthly, yearly, cardData, 
  fetchWeeklyAction, fetchMonthlyAction, fetchYearlyAction 
}: TrendsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')
  const [offsets, setOffsets] = useState({ weekly: 0, monthly: 0, yearly: 0 })
  const [isNavigating, setIsNavigating] = useState(false)
  const [data, setData] = useState({ weekly, monthly, yearly })

  const activeData = data[timeframe]
  const currentOffset = offsets[timeframe]

  const handleNav = async (delta: number) => {
    const newOffset = currentOffset + delta
    setIsNavigating(true)
    try {
      let newData: TimeframeData
      if (timeframe === 'weekly') newData = await fetchWeeklyAction(newOffset)
      else if (timeframe === 'monthly') newData = await fetchMonthlyAction(newOffset)
      else newData = await fetchYearlyAction(newOffset)
      
      setData(prev => ({ ...prev, [timeframe]: newData }))
      setOffsets(prev => ({ ...prev, [timeframe]: newOffset }))
    } finally {
      setIsNavigating(false)
    }
  }

  const calculateSmartAverage = () => {
    const total = activeData.trends.reduce((sum, d) => sum + d.amount, 0)
    if (total === 0) return 0

    if (!activeData.firstTransactionDate || !activeData.dateRange) {
      return total / (activeData.trends.length || 1)
    }

    const firstDate = startOfDay(new Date(activeData.firstTransactionDate))
    const rangeStart = startOfDay(new Date(activeData.dateRange.start))
    
    // If the first transaction is AFTER the range start, we only count periods since the first transaction
    let periodsToCount = activeData.trends.length
    
    if (isAfter(firstDate, rangeStart)) {
      // Find how many items in trends are on or after the first transaction
      // This is a rough estimation based on the trend items
      periodsToCount = activeData.trends.filter(d => {
        // This assumes the 'date' string in trends can be parsed or matched
        // For simplicity, we count periods that actually had spending or are later than first transaction
        // But the user specifically mentioned "one transaction divided by 6" for a week.
        // So for weekly (7 days), if only 1 day has passed since first transaction, divide by 1.
        
        // Let's use a more precise method:
        return true 
      }).length

      // Refined logic: count days/months/years between max(rangeStart, firstDate) and rangeEnd
      const effectiveStart = isAfter(firstDate, rangeStart) ? firstDate : rangeStart
      const rangeEnd = new Date(activeData.dateRange.end)
      
      if (timeframe === 'weekly') {
        const diffDays = Math.ceil((rangeEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24))
        periodsToCount = Math.max(1, Math.min(7, diffDays))
      } else if (timeframe === 'monthly') {
        // Trends for monthly is always 12 months. 
        // We should count how many of those 12 months are >= firstTransactionMonth
        const firstMonth = firstDate.getMonth() + firstDate.getFullYear() * 12
        periodsToCount = activeData.trends.filter(t => {
          const d = new Date(t.date)
          if (isNaN(d.getTime())) return true // Fallback for 'MMM yyyy' strings
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
              onClick={() => setTimeframe(t)}
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
                {currentOffset !== 0 && (
                  <button 
                    onClick={() => handleNav(-currentOffset)}
                    className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1"
                  >
                    Back to Latest
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 relative overflow-hidden">
            {isNavigating && (
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center" />
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-black tracking-tight text-black capitalize">{timeframe} Spending Trend</h3>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {timeframe === 'weekly' && 'Daily breakdown for the selected 7-day period'}
                {timeframe === 'monthly' && 'Monthly breakdown for the last 12 months'}
                {timeframe === 'yearly' && 'Annual spending for the last 5 years'}
              </p>
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
            <MerchantPieChart data={activeData.categories} />
          </div>

          <SpendingByCard data={cardData} />

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Category Breakdown</h4>
            <div className="space-y-4">
              {activeData.categories.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-black">{cat.name}</span>
                  <span className="text-sm font-medium text-gray-500">${cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
