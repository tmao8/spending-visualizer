'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MerchantPieChartProps {
  data: { name: string; value: number }[]
  onCategoryClick?: (category: string) => void
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

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function MerchantPieChart({ data, onCategoryClick }: MerchantPieChartProps) {
  const router = useRouter()

  const handleSliceClick = (entry: any) => {
    if (onCategoryClick) {
      onCategoryClick(entry.name)
    } else {
      router.push(`/dashboard/trends?category=${encodeURIComponent(entry.name)}`)
    }
  }

  const getColor = (name: string, index: number) => {
    return CATEGORY_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }

  const content = (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={data.length === 1 ? 0 : 5}
            dataKey="value"
            onClick={handleSliceClick}
            className="cursor-pointer focus:outline-none"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#000', fontWeight: 'bold' }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spent']}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  if (onCategoryClick) return content

  return (
    <Link href="/dashboard/trends" className="block hover:opacity-80 transition-opacity">
      {content}
    </Link>
  )
}
