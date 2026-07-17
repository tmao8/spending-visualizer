'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { forceResync } from '@/app/dashboard/settings/actions'
import { useRouter } from 'next/navigation'

export function ForceResyncButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleResync = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      // 1. Reset the cursor in the database
      await forceResync()

      // 2. Trigger the Plaid sync route to rebuild history
      await fetch('/api/plaid/sync', { method: 'POST' })
      
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to force resync', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleResync}
        disabled={loading}
        className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-colors flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Rebuilding History...' : success ? 'Sync Complete!' : 'Force Full Resync'}
      </button>
      <p className="text-[12px] text-gray-400 font-medium mt-3 max-w-sm leading-relaxed">
        This will wipe your Plaid sync memory and refetch all historical transactions from scratch. Use this if your dashboard is missing refunds or showing duplicate pending transactions.
      </p>
    </div>
  )
}
