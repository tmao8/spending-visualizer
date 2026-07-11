'use client'

import { Transaction } from '@/lib/services/transactions'
import { format } from 'date-fns'
import { Utensils, ShoppingBag, Car, Zap, CreditCard, Search, ChevronDown } from 'lucide-react'
import { useState, useMemo } from 'react'

const ICON_MAP: Record<string, any> = {
  'Food & Drink': Utensils,
  'Food & Drinks': Utensils,
  'Shopping': ShoppingBag,
  'Transportation': Car,
  'Services': Zap,
  'General': CreditCard,
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [search, setSearch] = useState('')
  const [displayCount, setDisplayCount] = useState(25)

  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions
    const lowerSearch = search.toLowerCase()
    return transactions.filter(t => 
      t.merchant.toLowerCase().includes(lowerSearch) || 
      (t.category && t.category.toLowerCase().includes(lowerSearch))
    )
  }, [transactions, search])

  const visibleTransactions = filteredTransactions.slice(0, displayCount)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setDisplayCount(25) // Reset count on search
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-black focus:ring-0 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <div className="space-y-1 px-6 py-2">
        {visibleTransactions.map((t) => {
          const Icon = ICON_MAP[t.category] || CreditCard
          return (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{t.merchant}</p>
                  <p className="text-[12px] text-gray-400 font-medium group-hover:text-black transition-colors">
                    {(() => {
                      const date = new Date(t.created_at)
                      return format(
                        new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), 
                        'EEEE, MMM dd'
                      )
                    })()} • {t.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-black">
                  ${Number(t.amount).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase group-hover:text-black transition-colors">
                  {t.card}
                </p>
              </div>
            </div>
          )
        })}
        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm font-medium">
            No transactions found
          </div>
        )}
      </div>

      {filteredTransactions.length > displayCount && (
        <div className="px-6 py-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => setDisplayCount(prev => prev + 25)}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black hover:bg-gray-50 rounded-xl transition-all"
          >
            Show More <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
