import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getLiabilities } from '@/lib/services/plaid'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import { CreditCard, CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getDueStatus(dueDate: string | null): { label: string; color: string; icon: any; urgent: boolean } {
  if (!dueDate) return { label: 'No due date', color: 'text-gray-400', icon: CalendarClock, urgent: false }
  
  const due = new Date(dueDate + 'T00:00:00')
  const daysUntil = differenceInDays(due, new Date())
  
  if (isPast(due) && !isToday(due)) {
    return { label: 'Overdue', color: 'text-red-500', icon: AlertTriangle, urgent: true }
  }
  if (daysUntil <= 3) {
    return { label: `Due in ${daysUntil}d`, color: 'text-amber-500', icon: AlertTriangle, urgent: true }
  }
  if (daysUntil <= 7) {
    return { label: `Due in ${daysUntil}d`, color: 'text-amber-400', icon: CalendarClock, urgent: false }
  }
  return { label: `Due in ${daysUntil}d`, color: 'text-green-500', icon: CheckCircle2, urgent: false }
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: liabilities, error } = await getLiabilities(supabase, user.id)

  const totalOwed = liabilities.reduce((sum, card) => sum + card.currentBalance, 0)
  const totalStatementBalance = liabilities.reduce((sum, card) => sum + (card.lastStatementBalance || 0), 0)
  const totalMinPayment = liabilities.reduce((sum, card) => sum + (card.minimumPayment || 0), 0)

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="px-6 md:px-8 h-20 flex items-center">
          <h1 className="text-2xl font-black tracking-tight text-black">Payments</h1>
        </div>
      </header>

      <main className="px-6 md:px-8 py-8 max-w-5xl">
        {liabilities.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-black text-black mb-2">No credit card liabilities found</h2>
            <p className="text-sm text-gray-400 font-medium max-w-md mx-auto">
              {error ? `Plaid Status: ${error}` : 'No credit card account data was returned by your linked bank accounts.'}
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Owed</p>
                <p className="text-2xl font-black text-black">${totalOwed.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Statement Balance</p>
                <p className="text-2xl font-black text-black">${totalStatementBalance.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Min Payment Due</p>
                <p className="text-2xl font-black text-black">${totalMinPayment.toFixed(2)}</p>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              {liabilities.map((card, i) => {
                const status = getDueStatus(card.nextPaymentDueDate)
                const StatusIcon = status.icon
                const utilization = card.creditLimit ? (card.currentBalance / card.creditLimit) * 100 : null

                return (
                  <div key={i} className={`bg-white rounded-2xl border p-6 ${status.urgent ? 'border-amber-200 shadow-sm' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.urgent ? 'bg-amber-50' : 'bg-gray-50'}`}>
                          <CreditCard className={`w-5 h-5 ${status.urgent ? 'text-amber-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-black">{card.accountName}</h3>
                          {card.creditLimit && (
                            <p className="text-[11px] text-gray-400 font-medium">
                              ${card.creditLimit.toLocaleString()} limit
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Balance</p>
                        <p className="text-lg font-black text-black">${card.currentBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statement Bal.</p>
                        <p className="text-lg font-black text-black">
                          {card.lastStatementBalance != null ? `$${card.lastStatementBalance.toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min. Payment</p>
                        <p className="text-lg font-black text-black">
                          {card.minimumPayment != null ? `$${card.minimumPayment.toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</p>
                        <p className="text-lg font-black text-black">
                          {card.nextPaymentDueDate ? format(new Date(card.nextPaymentDueDate + 'T00:00:00'), 'MMM dd') : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Credit utilization bar */}
                    {utilization !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilization</p>
                          <p className={`text-[10px] font-black ${utilization > 70 ? 'text-red-500' : utilization > 30 ? 'text-amber-500' : 'text-green-500'}`}>
                            {utilization.toFixed(0)}%
                          </p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${utilization > 70 ? 'bg-red-400' : utilization > 30 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Last payment info */}
                    {card.lastPaymentAmount != null && card.lastPaymentDate && (
                      <p className="text-[11px] text-gray-400 font-medium mt-3">
                        Last payment: ${card.lastPaymentAmount.toFixed(2)} on {format(new Date(card.lastPaymentDate + 'T00:00:00'), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
