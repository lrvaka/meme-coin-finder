'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { searchRedditMentions, getQuickRedditSentiment } from '@/lib/api/reddit';
import {
  calculateSocialMetrics,
  combineSentiment,
  type CombinedSentiment,
  type SocialMetrics,
} from '@/lib/utils/social-sentiment';
import type { TokenPair } from '@/types/token';

/**
 * Hook to get full Reddit sentiment for a token
 */
export function useRedditSentiment(
  tokenSymbol: string,
  tokenName: string,
  tokenAddress?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['reddit', 'sentiment', tokenSymbol, tokenName],
    queryFn: () => searchRedditMentions(tokenSymbol, tokenName, tokenAddress),
    enabled: enabled && !!tokenSymbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to get quick Reddit check (lightweight)
 */
export function useQuickRedditSentiment(tokenSymbol: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['reddit', 'quick', tokenSymbol],
    queryFn: () => getQuickRedditSentiment(tokenSymbol),
    enabled: enabled && !!tokenSymbol,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get combined social sentiment for a token
 * Uses on-chain data + optional Reddit data
 */
export function useSocialSentiment(
  token: TokenPair | null | undefined,
  includeReddit: boolean = false
): {
  data: CombinedSentiment | null;
  isLoading: boolean;
  socialMetrics: SocialMetrics | null;
} {
  // Calculate on-chain social metrics (instant, no fetch needed)
  const socialMetrics = useMemo(() => {
    if (!token) return null;
    return calculateSocialMetrics(token);
  }, [token]);

  // Optionally fetch Reddit sentiment
  const {
    data: redditData,
    isLoading: redditLoading,
  } = useRedditSentiment(
    token?.baseToken.symbol || '',
    token?.baseToken.name || '',
    token?.baseToken.address,
    includeReddit && !!token
  );

  // Combine all sentiment data
  const combinedData = useMemo(() => {
    if (!socialMetrics) return null;
    return combineSentiment(socialMetrics, redditData);
  }, [socialMetrics, redditData]);

  return {
    data: combinedData,
    isLoading: includeReddit && redditLoading,
    socialMetrics,
  };
}

/**
 * Hook to get social sentiment for multiple tokens (for grid view)
 * Only uses on-chain metrics (no Reddit to avoid rate limits)
 */
export function useBatchSocialMetrics(tokens: TokenPair[]): Map<string, SocialMetrics> {
  return useMemo(() => {
    const metricsMap = new Map<string, SocialMetrics>();
    for (const token of tokens) {
      metricsMap.set(token.baseToken.address, calculateSocialMetrics(token));
    }
    return metricsMap;
  }, [tokens]);
}
