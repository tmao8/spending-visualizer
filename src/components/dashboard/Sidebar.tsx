'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, TrendingUp, Settings, Sparkles, PiggyBank, CalendarClock } from 'lucide-react'
import { ThemeToggle } from '../ThemeToggle'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/dashboard/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/dashboard/trends', label: 'Trends', icon: TrendingUp },
  { href: '/dashboard/payments', label: 'Payments', icon: CalendarClock },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-100 dark:border-white/10 bg-gray-50/30 dark:bg-black/30 p-5 fixed top-0 bottom-0 left-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 mb-10 px-1">
          <Sparkles className="w-7 h-7 text-black dark:text-white" />
          <h1 className="text-xl font-black tracking-tight text-black dark:text-white">Clarity.</h1>
        </Link>
        
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'text-black bg-white dark:text-white dark:bg-neutral-800 shadow-sm'
                    : 'text-gray-400 hover:text-black hover:bg-white/60 dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-black dark:text-white' : ''}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between">
          <Link
            href="/dashboard/settings"
            className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/dashboard/settings')
                ? 'text-black bg-white dark:text-white dark:bg-neutral-800 shadow-sm'
                : 'text-gray-400 hover:text-black hover:bg-white/60 dark:hover:text-white dark:hover:bg-white/10'
            }`}
          >
            <Settings className={`w-[18px] h-[18px] ${isActive('/dashboard/settings') ? 'text-black dark:text-white' : ''}`} />
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-t border-gray-100 dark:border-white/10 px-4 pt-3 pb-7 flex items-center justify-around z-50">
        {[...NAV_ITEMS, { href: '/dashboard/settings', label: 'Settings', icon: Settings }].map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact as boolean | undefined)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-black dark:text-white' : 'text-gray-400'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
