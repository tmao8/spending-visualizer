'use client'

import { useRouter } from 'next/navigation'
import { SpendingBarChart } from './SpendingBarChart'

interface OverviewSpendingChartProps {
  data: any[]
}

export function OverviewSpendingChart({ data }: OverviewSpendingChartProps) {
  const router = useRouter()

  const handleBarClick = ({ start, end }: { start: string, end: string }) => {
    // Navigate to the trends page and zoom into this specific date range
    router.push(`/dashboard/trends?timeframe=weekly&start=${start}&end=${end}`)
  }

  return <SpendingBarChart data={data} onBarClick={handleBarClick} />
}
