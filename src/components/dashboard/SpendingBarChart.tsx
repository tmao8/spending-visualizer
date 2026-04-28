'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SpendingBarChartProps {
  data: any[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': '#10b981',      // Green
  'Food & Drink': '#f59e0b',   // Amber
  'Food & Drinks': '#f59e0b',  // Amber (match edge function)
  'Transportation': '#3b82f6', // Blue
  'Shopping': '#ef4444',       // Red
  'Entertainment': '#8b5cf6',  // Purple
  'Services': '#06b6d4',       // Cyan
  'Health': '#ec4899',         // Pink
  'Travel': '#f97316',         // Orange
  'Other': '#64748b',          // Slate
  'General': '#94a3b8',        // Gray
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload[0].payload.amount;
    const items = payload.filter((entry: any) => entry.name !== 'amount' && entry.value > 0);
    
    return (
      <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 min-w-[200px]">
        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-2 mb-3">
          {items.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[12px] font-bold text-black/70">{entry.name}</span>
              </div>
              <span className="text-[12px] font-bold text-black">${Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-black uppercase tracking-widest">Total</span>
          <span className="text-sm font-black text-black">${Number(total).toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function SpendingBarChart({ data }: SpendingBarChartProps) {
  // Find all unique categories present in the data for stacking
  const categories = Array.from(
    new Set(
      data.flatMap((d) => 
        Object.keys(d).filter(key => key !== 'date' && key !== 'amount')
      )
    )
  )

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
            minTickGap={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            content={<CustomTooltip />}
          />
          {categories.map((cat) => (
            <Bar 
              key={cat}
              dataKey={cat} 
              stackId="a" 
              fill={CATEGORY_COLORS[cat] || '#e5e7eb'} 
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
