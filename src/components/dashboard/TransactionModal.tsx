'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { STATIC_CATEGORIES } from '@/lib/services/transactions'
import { createManualTransaction } from '@/app/dashboard/actions'

interface TransactionModalProps {
  cards: string[]
}

export function TransactionModal({ cards }: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    try {
      const result = await createManualTransaction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    } catch (err: any) {
      console.error(err)
      setError('An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => {
          setIsOpen(true)
          setError(null)
        }}
        className="px-4 py-2 flex items-center gap-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all font-bold text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Add</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
          {/* Header area - leave transparent and clickable */}
          <div className="h-16 w-full" />
          
          {/* Lower area - backdrop and centered modal */}
          <div className="flex-1 relative flex items-center justify-center p-4 pointer-events-auto">
            {/* Transparent backdrop strictly below header */}
            <div 
              className="absolute inset-0 bg-transparent" 
              onClick={() => !isPending && setIsOpen(false)} 
            />
            
            {/* Modal - Truly centered in the content area */}
            <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-gray-100 flex flex-col max-h-[90%] overflow-hidden">
              <div className="p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-black">New Entry</h2>
                  <button 
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Merchant</label>
                    <input 
                      name="merchant"
                      required
                      autoFocus
                      placeholder="e.g. Starbucks"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:border-black focus:ring-0 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount ($)</label>
                    <input 
                      name="amount"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      required
                      placeholder="0.00"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:border-black focus:ring-0 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
                    <input 
                      name="date"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:border-black focus:ring-0 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                    <select 
                      name="category"
                      required
                      defaultValue=""
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:border-black focus:ring-0 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Select Category</option>
                      {STATIC_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Card</label>
                    <input 
                      name="card"
                      list="card-options"
                      required
                      placeholder="e.g. Visa 1234"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:border-black focus:ring-0 outline-none transition-all"
                    />
                    <datalist id="card-options">
                      {cards.map(card => (
                        <option key={card} value={card} />
                      ))}
                    </datalist>
                  </div>

                  <button 
                    type="submit"
                    disabled={isPending}
                    className="w-full py-5 bg-black text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Add Transaction'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
