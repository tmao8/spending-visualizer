"use client";

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';

export function CardBalances() {
  const [balances, setBalances] = useState<{ name: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('/api/plaid/balances');
        const data = await res.json();
        if (data.balances) {
          setBalances(data.balances);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load balances');
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, []);

  if (loading) return <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse h-48"></div>;
  
  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Current Balances</h4>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="bg-black text-white rounded-3xl p-8 shadow-sm">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Current Balances</h4>
        <p className="text-sm font-medium text-gray-400">No balances available</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white rounded-3xl p-8 shadow-sm">
      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Current Balances</h4>
      <div className="space-y-6">
        {balances.map((acc, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-gray-300" />
              </div>
              <span className="text-sm font-bold">{acc.name}</span>
            </div>
            <span className="text-sm font-medium">
              ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
