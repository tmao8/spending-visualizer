import { Transaction } from '@/lib/services/transactions'
import { format } from 'date-fns'
import { Utensils, ShoppingBag, Car, Zap, CreditCard } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  'Food & Drink': Utensils,
  'Shopping': ShoppingBag,
  'Transportation': Car,
  'Services': Zap,
  'General': CreditCard,
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-4 px-6 py-2">
      {transactions.map((t) => {
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
                  {format(new Date(t.created_at), 'EEEE, MMM dd')} • {t.category}
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
      {transactions.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm font-medium">
          No transactions yet
        </div>
      )}
    </div>
  )
}
