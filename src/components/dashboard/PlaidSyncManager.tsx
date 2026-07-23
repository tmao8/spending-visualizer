"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function PlaidSyncManager() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const sync = async () => {
      setSyncing(true);
      try {
        await fetch('/api/plaid/sync', { method: 'POST' });
        router.refresh();
      } catch (e) {
        console.error("Sync failed", e);
      } finally {
        setSyncing(false);
      }
    };
    sync();
  }, [router]);

  if (!syncing) return null;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-full shadow-lg text-xs font-bold tracking-wide animate-pulse">
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      Syncing...
    </div>
  );
}
