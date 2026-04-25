'use client'

import { useState } from 'react'
import { SpendingBarChart } from './SpendingBarChart'

interface TrendsViewProps {
  weeklyData: { date: string; amount: number }[]
  monthlyData: { date: string; amount: number }[]
  yearlyData: { date: string; amount: number }[]
}

type Timeframe = 'weekly' | 'monthly' | 'yearly'

export function TrendsView({ weeklyData, monthlyData, yearlyData }: TrendsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')

  const data = timeframe === 'weekly' ? weeklyData : timeframe === 'monthly' ? monthlyData : yearlyData

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setTimeframe('weekly')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            timeframe === 'weekly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimeframe('monthly')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            timeframe === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setTimeframe('yearly')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            timeframe === 'yearly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Yearly
        </button>
      </div>

      <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100">
        <div className="mb-8">
          <h3 className="text-2xl font-black tracking-tight text-black capitalize">{timeframe} Spending Trend</h3>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {timeframe === 'weekly' && 'Daily breakdown for the last 7 days'}
            {timeframe === 'monthly' && 'Monthly breakdown for the last year'}
            {timeframe === 'yearly' && 'Annual spending totals'}
          </p>
        </div>
        <SpendingBarChart data={data} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average {timeframe.replace('ly', '')}</p>
          <p className="text-2xl font-black text-black">
            ${(data.reduce((sum, d) => sum + d.amount, 0) / (data.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peak {timeframe.replace('ly', '')}</p>
          <p className="text-2xl font-black text-black">
            ${Math.max(...data.map(d => d.amount), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Period Spend</p>
          <p className="text-2xl font-black text-black">
            ${data.reduce((sum, d) => sum + d.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  )
}
