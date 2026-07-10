"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PlaidConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
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
    await fetch('/api/plaid/exchange-public-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken: public_token }),
    });
    
    // After exchanging, sync transactions
    await fetch('/api/plaid/sync', { method: 'POST' });
    router.refresh();
  }, [router]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <Landmark className="w-4 h-4" />
      <span className="hidden sm:inline">Connect Bank</span>
    </button>
  );
}
