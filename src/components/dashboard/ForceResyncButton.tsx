'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { forceResync } from '@/app/dashboard/settings/actions'
import { useRouter } from 'next/navigation'

export function ForceResyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const router = useRouter()

  const handleResync = async () => {
    setLoading(true)
    setStatus('Clearing old data...')
    setIsError(false)

    try {
      // Step 1: Reset cursor and delete all transactions
      const result = await forceResync()
      if (!result.success) {
        setStatus(`Error: ${result.message}`)
        setIsError(true)
        return
      }
      setStatus(result.message + ' Syncing from Plaid...')

      // Step 2: Trigger the Plaid sync to rebuild all history
      const syncResponse = await fetch('/api/plaid/sync', { method: 'POST' })
      const syncData = await syncResponse.json()

      if (!syncResponse.ok) {
        setStatus(`Sync failed: ${syncData.error || syncResponse.statusText}`)
        setIsError(true)
        return
      }

      setStatus('✓ Full resync complete! Refreshing...')
      router.refresh()
      setTimeout(() => setStatus(null), 5000)
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
      setIsError(true)
      console.error('Force resync failed:', err)
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
        {loading ? 'Rebuilding...' : 'Force Full Resync'}
      </button>
      {status && (
        <p className={`text-[12px] font-bold mt-3 max-w-sm leading-relaxed ${isError ? 'text-red-500' : 'text-green-600'}`}>
          {status}
        </p>
      )}
      <p className="text-[12px] text-gray-400 font-medium mt-2 max-w-sm leading-relaxed">
        Resets the sync pointer and re-downloads history from Plaid. Your existing transactions are preserved and updated via upsert.
      </p>
    </div>
  )
}
