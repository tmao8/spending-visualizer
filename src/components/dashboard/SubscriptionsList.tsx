'use client'

import { Repeat, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface Subscription {
  merchant: string;
  amount: number;
  dates: Date[];
  category: string;
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
}

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="bg-black dark:bg-neutral-900 text-white rounded-3xl p-8 shadow-sm border border-transparent dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fixed Costs</h4>
          <h3 className="text-2xl font-black mt-1">${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-800 dark:bg-black flex items-center justify-center">
          <Repeat className="w-5 h-5 text-gray-300" />
        </div>
      </div>
      
      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        {subscriptions.map((sub, i) => (
          <motion.div 
            key={i} 
            variants={{
              hidden: { opacity: 0, x: -10 },
              show: { opacity: 1, x: 0 }
            }}
            className="flex items-center justify-between py-2 border-t border-gray-800/50 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold truncate max-w-[140px]">{sub.merchant}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium block">
                ${sub.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3" /> Monthly
              </span>
            </div>
          </motion.div>
        ))}
        {subscriptions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No recurring subscriptions detected.</p>
        )}
      </motion.div>
    </div>
  )
}
