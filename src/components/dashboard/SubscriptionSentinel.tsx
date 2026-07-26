import { ShieldCheck, Calendar, AlertCircle } from 'lucide-react'

interface Subscription {
  merchant: string;
  amount: number;
  dates: Date[];
  category: string;
}

interface Balance {
  name: string;
  balance: number;
  type: string;
  subtype: string;
}

interface SubscriptionSentinelProps {
  subscriptions: Subscription[];
  balances: Balance[];
}

export function SubscriptionSentinel({ subscriptions, balances }: SubscriptionSentinelProps) {
  // Only sum up depository accounts (checking/savings) for liquid cash
  const liquidCash = balances
    .filter(b => b.type === 'depository')
    .reduce((sum, b) => sum + b.balance, 0)

  const totalMonthlySubscriptions = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
  
  // Safe to spend = liquid cash - upcoming subscriptions (simple model)
  const safeToSpend = liquidCash - totalMonthlySubscriptions

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-transform hover:scale-[1.01] duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Safe to Spend</h4>
          <h3 className="text-3xl font-black mt-1 text-emerald-950 dark:text-emerald-50">
            ${safeToSpend > 0 ? safeToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-emerald-800/60 dark:text-emerald-200/60">Liquid Cash</span>
          <span className="font-bold text-emerald-900 dark:text-emerald-100">${liquidCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-emerald-800/60 dark:text-emerald-200/60 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Upcoming Bills
          </span>
          <span className="font-bold text-emerald-900 dark:text-emerald-100">-${totalMonthlySubscriptions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {safeToSpend < 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <p className="text-xs font-bold text-red-700 dark:text-red-400">
            Your upcoming subscriptions exceed your available liquid cash.
          </p>
        </div>
      )}
    </div>
  )
}
