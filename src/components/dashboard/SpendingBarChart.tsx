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
import { CATEGORY_COLORS } from '@/lib/constants'

interface SpendingBarChartProps {
  data: any[]
  onBarClick?: (data: { start: string, end: string, originalData: any }) => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload[0].payload.amount;
    const fullDateLabel = payload[0].payload.fullDate || label;
    const items = payload.filter((entry: any) => entry.name !== 'amount' && entry.value > 0);
    
    return (
      <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 min-w-[200px]">
        <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest mb-3">{fullDateLabel}</p>
        <div className="space-y-2 mb-3">
          {items.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[12px] font-bold text-black dark:text-white/70">{entry.name}</span>
              </div>
              <span className="text-[12px] font-bold text-black dark:text-white">${Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
          <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Total</span>
          <span className="text-sm font-black text-black dark:text-white">${Number(total).toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function SpendingBarChart({ data, onBarClick }: SpendingBarChartProps) {
  // Find all unique categories present in the data for stacking
  const categories = Array.from(
    new Set(
      data.flatMap((d) => 
        Object.keys(d).filter(key => key !== 'date' && key !== 'amount' && key !== 'fullDate' && key !== 'rangeStart' && key !== 'rangeEnd')
      )
    )
  )

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          onClick={(state) => {
            if (state && state.activePayload && state.activePayload.length > 0 && onBarClick) {
              const payload = state.activePayload[0].payload;
              if (payload.rangeStart && payload.rangeEnd) {
                onBarClick({
                  start: payload.rangeStart,
                  end: payload.rangeEnd,
                  originalData: payload
                });
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.05} />
          <XAxis className="text-gray-400 dark:text-gray-500" 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }}
            minTickGap={10}
          />
          <YAxis className="text-gray-400 dark:text-gray-500" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            cursor={false}
            content={<CustomTooltip />}
          />
          {categories.map((cat) => (
            <Bar 
              key={cat}
              dataKey={cat} 
              stackId="a" 
              fill={CATEGORY_COLORS[cat] || 'transparent'} 
              radius={[4, 4, 4, 4]} stroke="transparent" strokeWidth={1}
              
              cursor={onBarClick ? 'pointer' : 'default'}
              activeBar={{ fillOpacity: 0.8 }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
