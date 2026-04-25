'use client'

import { useState } from 'react'
import { SpendingBarChart } from './SpendingBarChart'
import { MerchantPieChart } from './MerchantPieChart'

interface TimeframeData {
  trends: { date: string; amount: number }[]
  categories: { name: string; value: number }[]
}

interface TrendsViewProps {
  weekly: TimeframeData
  monthly: TimeframeData
  yearly: TimeframeData
}

type Timeframe = 'weekly' | 'monthly' | 'yearly'

export function TrendsView({ weekly, monthly, yearly }: TrendsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')

  const activeData = timeframe === 'weekly' ? weekly : timeframe === 'monthly' ? monthly : yearly

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-center p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100">
            <div className="mb-8">
              <h3 className="text-2xl font-black tracking-tight text-black capitalize">{timeframe} Spending Trend</h3>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {timeframe === 'weekly' && 'Daily breakdown for the last 7 days'}
                {timeframe === 'monthly' && 'Monthly breakdown for the last year'}
                {timeframe === 'yearly' && 'Annual spending totals'}
              </p>
            </div>
            <SpendingBarChart data={activeData.trends} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average {timeframe.replace('ly', '')}</p>
              <p className="text-2xl font-black text-black">
                ${(activeData.trends.reduce((sum, d) => sum + d.amount, 0) / (activeData.trends.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
                ${activeData.trends.reduce((sum, d) => sum + d.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
