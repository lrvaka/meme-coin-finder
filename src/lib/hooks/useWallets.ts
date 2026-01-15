'use client';

import { useState, useEffect } from 'react';
import type { WatchedWallet } from '@/types/token';

const STORAGE_KEY = 'memeradar_watched_wallets';

export function useWatchedWallets() {
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWallets(JSON.parse(stored));
      } catch {
        setWallets([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    }
  }, [wallets, isLoaded]);

  const addWallet = (address: string, label: string) => {
    if (wallets.some((w) => w.address === address)) {
      return false;
    }
    setWallets((prev) => [
      ...prev,
      { address, label, addedAt: Date.now() },
    ]);
    return true;
  };

  const removeWallet = (address: string) => {
    setWallets((prev) => prev.filter((w) => w.address !== address));
  };

  const updateLabel = (address: string, label: string) => {
    setWallets((prev) =>
      prev.map((w) => (w.address === address ? { ...w, label } : w))
    );
  };

  return {
    wallets,
    isLoaded,
    addWallet,
    removeWallet,
    updateLabel,
  };
}

// Known smart money wallets (example addresses - these would be real whale/influencer wallets)
export const KNOWN_WALLETS: WatchedWallet[] = [
  {
    address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    label: 'Raydium Authority',
    addedAt: 0,
  },
  {
    address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    label: 'Jupiter Aggregator',
    addedAt: 0,
  },
];
