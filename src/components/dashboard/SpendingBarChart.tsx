'use client'

import {
  AreaChart,
  Area,
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
    const dataObj = payload[0].payload;
    const total = dataObj.amount;
    const fullDateLabel = dataObj.fullDate || label;
    
    const categories = Object.keys(dataObj)
      .filter(k => k !== 'date' && k !== 'fullDate' && k !== 'amount' && k !== 'rangeStart' && k !== 'rangeEnd' && dataObj[k] > 0)
      .sort((a, b) => dataObj[b] - dataObj[a]);
    
    return (
      <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 min-w-[200px]">
        <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest mb-3">{fullDateLabel}</p>
        <div className="space-y-2 mb-3">
          {categories.map((cat: string, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#8338EC' }} />
                <span className="text-[12px] font-bold text-black dark:text-white/70">{cat}</span>
              </div>
              <span className="text-[12px] font-bold text-black dark:text-white">${Number(dataObj[cat]).toFixed(2)}</span>
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
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
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
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8338EC" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8338EC" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.1, strokeDasharray: '4 4' }}
            content={<CustomTooltip />}
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#8338EC" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorAmount)" 
            activeDot={{ r: 6, fill: '#8338EC', stroke: '#fff', strokeWidth: 2, cursor: onBarClick ? 'pointer' : 'default' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
