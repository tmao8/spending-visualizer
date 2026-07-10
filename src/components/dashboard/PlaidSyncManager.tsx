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

  return (
    <div className={`flex items-center text-xs font-semibold text-gray-500 transition-opacity duration-300 ${syncing ? 'opacity-100' : 'opacity-0'}`}>
      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
      Syncing...
    </div>
  );
}
