'use client';

import { useQuery } from '@tanstack/react-query';
import { searchTokens, getTrendingTokens, getTokenByAddress, getTokenPairs } from '@/lib/api/dexscreener';
import { calculateSafetyScore } from '@/lib/utils/safety';
import { calculateRunPotential } from '@/lib/utils/run-potential';
import type { TokenPair, TokenFilter } from '@/types/token';

export function useSearchTokens(query: string) {
  return useQuery({
    queryKey: ['tokens', 'search', query],
    queryFn: () => searchTokens(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['tokens', 'trending'],
    queryFn: getTrendingTokens,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useToken(address: string) {
  return useQuery({
    queryKey: ['token', address],
    queryFn: () => getTokenByAddress(address),
    enabled: !!address,
    staleTime: 30 * 1000,
  });
}

export function useTokenPairs(address: string) {
  return useQuery({
    queryKey: ['token', 'pairs', address],
    queryFn: () => getTokenPairs(address),
    enabled: !!address,
    staleTime: 30 * 1000,
  });
}

export function filterTokens(tokens: TokenPair[], filter: TokenFilter): TokenPair[] {
  return tokens.filter((token) => {
    if (filter.minLiquidity && (token.liquidity?.usd || 0) < filter.minLiquidity) {
      return false;
    }
    if (filter.maxAge) {
      const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60);
      if (ageHours > filter.maxAge) {
        return false;
      }
    }
    if (filter.minVolume24h && (token.volume?.h24 || 0) < filter.minVolume24h) {
      return false;
    }
    if (filter.minMarketCap && (token.marketCap || 0) < filter.minMarketCap) {
      return false;
    }
    if (filter.maxMarketCap && (token.marketCap || 0) > filter.maxMarketCap) {
      return false;
    }
    return true;
  });
}

export function sortTokens(
  tokens: TokenPair[],
  sortBy: 'volume' | 'liquidity' | 'priceChange' | 'marketCap' | 'age' | 'safety' | 'runPotential',
  direction: 'asc' | 'desc' = 'desc'
): TokenPair[] {
  const sorted = [...tokens].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'volume':
        aValue = a.volume?.h24 || 0;
        bValue = b.volume?.h24 || 0;
        break;
      case 'liquidity':
        aValue = a.liquidity?.usd || 0;
        bValue = b.liquidity?.usd || 0;
        break;
      case 'priceChange':
        aValue = a.priceChange?.h24 || 0;
        bValue = b.priceChange?.h24 || 0;
        break;
      case 'marketCap':
        aValue = a.marketCap || 0;
        bValue = b.marketCap || 0;
        break;
      case 'age':
        aValue = a.pairCreatedAt || 0;
        bValue = b.pairCreatedAt || 0;
        break;
      case 'safety':
        aValue = calculateSafetyScore(a).score;
        bValue = calculateSafetyScore(b).score;
        break;
      case 'runPotential':
        aValue = calculateRunPotential(a).score;
        bValue = calculateRunPotential(b).score;
        break;
      default:
        return 0;
    }

    return direction === 'desc' ? bValue - aValue : aValue - bValue;
  });

  return sorted;
}
