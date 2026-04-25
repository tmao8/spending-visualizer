import { LucideIcon } from 'lucide-react'

interface KPIProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function KPI({ title, value, icon: Icon, description }: KPIProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
    </div>
  )
}
