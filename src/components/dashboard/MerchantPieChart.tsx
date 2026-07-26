'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CATEGORY_COLORS, DEFAULT_COLORS } from '@/lib/constants'

interface MerchantPieChartProps {
  data: { name: string; value: number }[]
  onCategoryClick?: (category: string) => void
}

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
    <div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
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
              formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getColor(entry.name, index) }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (onCategoryClick) return content

  return (
    <Link href="/dashboard/trends" className="block hover:opacity-80 transition-opacity">
      {content}
    </Link>
  )
}
