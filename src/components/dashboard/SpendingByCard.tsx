'use client'

import { CreditCard } from 'lucide-react'

interface SpendingByCardProps {
  data: { name: string; value: number }[]
}

export function SpendingByCard({ data }: SpendingByCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Spending by Card</h4>
      <div className="space-y-6">
        {data.map((card) => (
          <div key={card.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-bold text-black">{card.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-500">
              ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No card data available</p>
        )}
      </div>
    </div>
  )
}
