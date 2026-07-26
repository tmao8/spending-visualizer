'use client'

import { Transaction } from '@/lib/services/transactions'
import { format } from 'date-fns'
import { Utensils, ShoppingBag, ShoppingCart, Car, Zap, CreditCard, Search, ChevronDown, Film, Heart, Plane, Package } from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const ICON_MAP: Record<string, any> = {
  'Food & Drink': Utensils,
  'Food & Drinks': Utensils,
  'Groceries': ShoppingCart,
  'Shopping': ShoppingBag,
  'Transportation': Car,
  'Services': Zap,
  'Entertainment': Film,
  'Health': Heart,
  'Travel': Plane,
  'Other': Package,
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
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setDisplayCount(25) // Reset count on search
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-900 border-none rounded-xl text-sm font-medium text-black dark:text-white focus:ring-0 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
          />
        </div>
      </div>
      
      <motion.div 
        className="space-y-1 px-6 py-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.03 }
          }
        }}
      >
        {visibleTransactions.map((t) => {
          const Icon = ICON_MAP[t.category] || CreditCard
          return (
            <motion.div 
              key={t.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
              }}
              className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0 group cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-700 transition-colors">
                  <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                    {t.merchant}
                    {t.pending && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[9px] font-black uppercase tracking-widest">
                        Pending
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium group-hover:text-black dark:group-hover:text-white transition-colors">
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
                <p className="text-sm font-bold text-black dark:text-white">
                  ${Number(t.amount).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase group-hover:text-black dark:group-hover:text-white transition-colors">
                  {t.card}
                </p>
              </div>
            </motion.div>
          )
        })}
        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm font-medium">
            No transactions found
          </div>
        )}
      </motion.div>

      {filteredTransactions.length > displayCount && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 mt-auto">
          <button
            onClick={() => setDisplayCount(prev => prev + 25)}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-all"
          >
            Show More <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
