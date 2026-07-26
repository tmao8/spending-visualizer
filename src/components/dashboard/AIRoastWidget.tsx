"use client"

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { generateFinancialRoast } from '@/app/dashboard/actions/ai'

export function AIRoastWidget() {
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-indigo-950 dark:text-indigo-50">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  const [roast, setRoast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRoast = async () => {
    setLoading(true)
    try {
      const result = await generateFinancialRoast()
      setRoast(result || null)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-transform hover:scale-[1.01] duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          AI Financial Coach
        </h3>
        <button 
          onClick={fetchRoast}
          disabled={loading}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
          {roast ? 'Roast Me Again' : 'Roast Me'}
        </button>
      </div>

      <div className="text-sm font-medium text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed space-y-4">
        {roast ? (
          roast.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
            <p key={i}>{renderFormattedText(paragraph)}</p>
          ))
        ) : (
          <p>Click "Roast Me" to let our AI analyze your recent spending. Warning: It holds nothing back.</p>
        )}
      </div>
    </div>
  )
}
