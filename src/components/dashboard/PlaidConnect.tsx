"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PlaidConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch link token on mount
    const fetchLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setLinkToken(data.linkToken);
        }
      } catch (e) {
        console.error("Failed to create link token", e);
      }
    };
    fetchLinkToken();
  }, []);

  const onSuccess = useCallback(async (public_token: string) => {
    setSyncing(true);
    setError(null);
    setStatusMessage('Exchanging bank authorization...');

    try {
      const exchangeRes = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken: public_token }),
      });
      const exchangeData = await exchangeRes.json();
      if (!exchangeRes.ok) {
        throw new Error(exchangeData.error || 'Failed to exchange Plaid token');
      }

      setStatusMessage('Syncing transactions from your bank...');
      const syncRes = await fetch('/api/plaid/sync', { method: 'POST' });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || 'Failed to sync transactions');
      }

      setStatusMessage('✓ Bank connected & transactions synced!');
      router.refresh();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Plaid connect error:', err);
      setError(err.message || 'Failed to connect bank');
    } finally {
      setSyncing(false);
    }
  }, [router]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => open()}
          disabled={!ready || !linkToken || syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Landmark className="w-4 h-4" />
          <span>{syncing ? 'Connecting...' : 'Connect Bank'}</span>
        </button>

        {statusMessage && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
            {statusMessage}
          </span>
        )}
      </div>

      {error && (
        <div className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/30 max-w-md">
          {error}
        </div>
      )}
    </div>
  );
}
