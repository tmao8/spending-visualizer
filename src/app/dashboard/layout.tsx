import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, ReceiptText, TrendingUp, Settings, Sparkles } from 'lucide-react'
import { PlaidSyncManager } from '@/components/dashboard/PlaidSyncManager'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <PlaidSyncManager />
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 bg-gray-50/30 p-6 sticky top-0 h-screen shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 mb-12 px-2">
          <Sparkles className="w-8 h-8 text-black" />
          <h1 className="text-2xl font-black tracking-tight text-black">Clarity.</h1>
        </Link>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-black hover:bg-white hover:shadow-sm transition-all group">
            <LayoutDashboard className="w-5 h-5 group-hover:text-black transition-colors" />
            Overview
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-black hover:bg-white hover:shadow-sm transition-all group">
            <ReceiptText className="w-5 h-5 group-hover:text-black transition-colors" />
            Transactions
          </Link>
          <Link href="/dashboard/trends" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-black hover:bg-white hover:shadow-sm transition-all group">
            <TrendingUp className="w-5 h-5 group-hover:text-black transition-colors" />
            Trends
          </Link>
        </nav>

        <div className="mt-auto">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-black hover:bg-white hover:shadow-sm transition-all group">
            <Settings className="w-5 h-5 group-hover:text-black transition-colors" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 relative pb-24 md:pb-0">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-8 flex items-center justify-around z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">Overview</span>
        </Link>
        <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors">
          <ReceiptText className="w-6 h-6" />
          <span className="text-[10px] font-bold">Transactions</span>
        </Link>
        <Link href="/dashboard/trends" className="flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors">
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold">Trends</span>
        </Link>
        <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Settings</span>
        </Link>
      </nav>
    </div>
  )
}
