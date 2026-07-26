import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PlaidConnect } from '@/components/dashboard/PlaidConnect'
import { LogOut } from 'lucide-react'
import { signOut } from '@/app/login/actions'
import { ForceResyncButton } from '@/components/dashboard/ForceResyncButton'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-white/10">
        <div className="px-6 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">Settings</h1>
        </div>
      </header>

      <main className="px-6 md:px-8 py-12 space-y-8 max-w-3xl">
        
        <section className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 p-10 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-black dark:text-white mb-2">Connected Banks</h2>
          <p className="text-sm font-medium text-gray-500 mb-8">Link your financial institutions via Plaid to automatically sync transactions securely.</p>
          <div className="flex items-center gap-4">
            <PlaidConnect />
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-white/10 p-10">
          <h2 className="text-xl font-black tracking-tight text-black dark:text-white mb-2">Account</h2>
          <p className="text-sm font-medium text-gray-500 mb-8">Manage your active session.</p>
          <form action={signOut}>
            <button className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </section>

        <section className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 p-10 shadow-sm border-red-100">
          <h2 className="text-xl font-black tracking-tight text-black dark:text-white mb-2 text-red-600">Troubleshooting</h2>
          <p className="text-sm font-medium text-gray-500 mb-8">Fix duplicate pending transactions or missing historical refunds.</p>
          <ForceResyncButton />
        </section>
        
      </main>
    </div>
  )
}
