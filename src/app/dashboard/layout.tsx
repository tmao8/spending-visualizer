import { ReactNode } from 'react'
import { PlaidSyncManager } from '@/components/dashboard/PlaidSyncManager'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <PlaidSyncManager />
      <Sidebar />

      {/* Main Content Area — md:ml-56 matches sidebar w-56 */}
      <main className="min-w-0 relative pb-24 md:pb-0 md:ml-56">
        {children}
      </main>
    </div>
  )
}
