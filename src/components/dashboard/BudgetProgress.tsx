import { Target } from 'lucide-react'

interface Budget {
  category: string;
  amount: number;
}

interface BudgetProgressProps {
  budgets: Budget[];
  categorySpending: { name: string; value: number }[];
}

export function BudgetProgress({ budgets, categorySpending }: BudgetProgressProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Budgets</h4>
        <Target className="w-5 h-5 text-gray-300" />
      </div>
      
      <div className="space-y-6">
        {budgets.map(budget => {
          const spent = categorySpending.find(c => c.name === budget.category)?.value || 0;
          const percentage = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;
          
          return (
            <div key={budget.category}>
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
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-black'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
