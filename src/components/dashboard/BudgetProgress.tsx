'use client'

import { Target, Pencil, X, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useTransition, useEffect, useMemo } from 'react'
import { saveBudgetsBulk } from '@/app/dashboard/actions'
import { STATIC_CATEGORIES } from '@/lib/services/transactions'

interface Budget {
  category: string;
  amount: number;
}

interface BudgetProgressProps {
  budgets: Budget[];
  categorySpending: { name: string; value: number }[];
}

export function BudgetProgress({ budgets, categorySpending }: BudgetProgressProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  
  // Create an initial full list of budgets based on STATIC_CATEGORIES and defaults
  const fullBudgets = useMemo(() => {
    return STATIC_CATEGORIES.map(cat => {
      const existing = budgets.find(b => b.category === cat)
      return { category: cat, amount: existing ? existing.amount : 100 }
    })
  }, [budgets])

  // Ordered and editable budgets state
  const [orderedBudgets, setOrderedBudgets] = useState<Budget[]>([])

  // Load saved order from localStorage and apply it to fullBudgets
  useEffect(() => {
    const savedOrder = localStorage.getItem('budgetOrder')
    if (savedOrder) {
      try {
        const orderArray: string[] = JSON.parse(savedOrder)
        // Sort fullBudgets based on the saved order array
        const sorted = [...fullBudgets].sort((a, b) => {
          const idxA = orderArray.indexOf(a.category)
          const idxB = orderArray.indexOf(b.category)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
        setOrderedBudgets(sorted)
      } catch (e) {
        setOrderedBudgets(fullBudgets)
      }
    } else {
      setOrderedBudgets(fullBudgets)
    }
  }, [fullBudgets])

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...orderedBudgets]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    setOrderedBudgets(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === orderedBudgets.length - 1) return
    const newOrder = [...orderedBudgets]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    setOrderedBudgets(newOrder)
  }

  const handleAmountChange = (index: number, newAmount: string) => {
    const newOrder = [...orderedBudgets]
    newOrder[index] = { ...newOrder[index], amount: Number(newAmount) || 0 }
    setOrderedBudgets(newOrder)
  }

  const handleSave = async () => {
    startTransition(async () => {
      setErrorMsg('')
      // Save order locally
      const orderArray = orderedBudgets.map(b => b.category)
      localStorage.setItem('budgetOrder', JSON.stringify(orderArray))

      // Bulk save to DB
      const res = await saveBudgetsBulk(orderedBudgets)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  const toggleEdit = () => {
    if (isEditing) {
      // Revert edits if cancelling
      const savedOrder = localStorage.getItem('budgetOrder')
      let restored = [...fullBudgets]
      if (savedOrder) {
        try {
          const orderArray: string[] = JSON.parse(savedOrder)
          restored = restored.sort((a, b) => {
            const idxA = orderArray.indexOf(a.category)
            const idxB = orderArray.indexOf(b.category)
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
          })
        } catch (e) {}
      }
      setOrderedBudgets(restored)
      setErrorMsg('')
    }
    setIsEditing(!isEditing)
  }

  return (
    <div className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm relative">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Budgets</h4>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={toggleEdit}
                disabled={isPending}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <button 
                onClick={handleSave}
                disabled={isPending}
                className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-white dark:text-black" />
              </button>
            </>
          ) : (
            <button 
              onClick={toggleEdit}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
          {errorMsg}
        </div>
      )}
      
      <div className="space-y-6">
        {orderedBudgets.map((budget, index) => {
          const spent = categorySpending.find(c => c.name === budget.category)?.value || 0;
          const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
          const isOver = spent > budget.amount;
          
          return (
            <div key={budget.category} className="group relative flex items-center gap-3">
              {isEditing && (
                <div className="flex flex-col gap-1 -ml-4 pr-1 animate-in fade-in slide-in-from-left-2">
                  <button 
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || isPending}
                    className="p-1 text-gray-300 hover:text-black dark:hover:text-white transition-colors disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => moveDown(index)}
                    disabled={index === orderedBudgets.length - 1 || isPending}
                    className="p-1 text-gray-300 hover:text-black dark:hover:text-white transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-black dark:text-white truncate pr-2">{budget.category}</span>
                  
                  <div className="flex items-center text-right shrink-0">
                    <span className={`text-sm font-bold ${isOver && !isEditing ? 'text-red-500' : 'text-black dark:text-white'}`}>
                      ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-gray-400 font-medium ml-1 flex items-center">
                      / 
                      {isEditing ? (
                        <div className="relative ml-1 w-20 inline-block">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input 
                            type="number"
                            value={budget.amount}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
                            className="w-full pl-5 pr-2 py-1 text-xs font-bold bg-gray-50 dark:bg-neutral-900 rounded-md border-none outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white"
                          />
                        </div>
                      ) : (
                        <span className="ml-1">${budget.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isOver && !isEditing ? 'bg-red-500' : percentage >= 80 && !isEditing ? 'bg-amber-500' : 'bg-black dark:bg-white'} ${isPending ? 'opacity-50' : ''}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
