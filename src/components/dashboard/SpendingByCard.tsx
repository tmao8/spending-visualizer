'use client'

import { CreditCard } from 'lucide-react'
import Link from 'next/link'

interface SpendingByCardProps {
  data: { name: string; value: number }[]
  onCardClick?: (card: string) => void
}

export function SpendingByCard({ data, onCardClick }: SpendingByCardProps) {
  return (
    <div className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm transition-transform hover:scale-[1.01] duration-300">
      <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Spending by Card</h4>
      <div className="space-y-6">
        {data.map((card) => {
          const content = (
            <div className="w-full flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-700 transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-bold text-black dark:text-white group-hover:opacity-70 transition-opacity">{card.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )

          if (onCardClick) {
            return (
              <button key={card.name} onClick={() => onCardClick(card.name)} className="w-full">
                {content}
              </button>
            )
          }

          return (
            <Link key={card.name} href={`/dashboard/trends?card=${encodeURIComponent(card.name)}`} className="block w-full">
              {content}
            </Link>
          )
        })}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No card data available</p>
        )}
      </div>
    </div>
  )
}
