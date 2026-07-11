'use client'

import { Target, Pencil, X, Check, Trash2, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { saveBudget, deleteBudget } from '@/app/dashboard/actions'

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
  
  // Local state for editing
  const [editCategory, setEditCategory] = useState('')
  const [editAmount, setEditAmount] = useState('')

  const handleSave = async () => {
    if (!editCategory || !editAmount || isNaN(Number(editAmount))) return
    
    startTransition(async () => {
      await saveBudget(editCategory, Number(editAmount))
      setEditCategory('')
      setEditAmount('')
    })
  }

  const handleDelete = async (category: string) => {
    startTransition(async () => {
      await deleteBudget(category)
    })
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Budgets</h4>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            {isEditing ? <X className="w-4 h-4 text-gray-400" /> : <Pencil className="w-4 h-4 text-gray-400" />}
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {budgets.map(budget => {
          const spent = categorySpending.find(c => c.name === budget.category)?.value || 0;
          const percentage = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;
          
          return (
            <div key={budget.category} className="group relative">
              {isEditing && (
                <button 
                  onClick={() => handleDelete(budget.category)}
                  disabled={isPending}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-black">{budget.category}</span>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-black'}`}>
                    ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-gray-400 font-medium ml-1">
                    / ${budget.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-black'} ${isPending ? 'opacity-50' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
        
        {budgets.length === 0 && !isEditing && (
          <p className="text-sm text-gray-400 text-center py-4">No budgets set. Click edit to add one.</p>
        )}
      </div>

      {isEditing && (
        <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h5 className="text-xs font-bold text-black uppercase tracking-widest mb-3">Add / Update Budget</h5>
          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Category (e.g. Food & Drink)" 
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-black/5"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={isPending || !editCategory || !editAmount}
                className="px-4 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
