'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SpendingBarChartProps {
  data: any[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': '#10b981',      // Green
  'Food & Drink': '#f59e0b',   // Amber
  'Transportation': '#3b82f6', // Blue
  'Shopping': '#ef4444',       // Red
  'Entertainment': '#8b5cf6',  // Purple
  'Services': '#06b6d4',       // Cyan
  'Health': '#ec4899',         // Pink
  'Travel': '#f97316',         // Orange
  'Other': '#64748b',          // Slate
  'General': '#94a3b8',        // Gray
}

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
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value, name) => {
              if (name === 'amount') return null // Don't show the total 'amount' in tooltip list
              return [`$${Number(value).toFixed(2)}`, name]
            }}
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
          {/* Transparent total bar just to ensure the y-axis and hover area are correct if needed */}
          <Bar dataKey="amount" stackId="a" fill="transparent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
