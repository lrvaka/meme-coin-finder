import { config } from '@/config';
import type { DexScreenerResponse, TokenPair } from '@/types/token';

const BASE_URL = config.dexscreener.baseUrl;

interface BoostToken {
  chainId: string;
  tokenAddress: string;
  url: string;
  icon?: string;
  description?: string;
  links?: { type?: string; url: string }[];
}

export async function getTrendingTokens(): Promise<TokenPair[]> {
  // First get boosted token addresses
  const boostResponse = await fetch(
    `${BASE_URL}/token-boosts/top/v1`,
    { next: { revalidate: 30 } }
  );

  if (!boostResponse.ok) {
    throw new Error('Failed to fetch trending tokens');
  }

  const boostData: BoostToken[] = await boostResponse.json();

  // Filter for Solana tokens and get first 20
  const solanaTokens = boostData
    .filter(t => t.chainId === 'solana')
    .slice(0, 20);

  if (solanaTokens.length === 0) {
    return [];
  }

  // Fetch full token data for each address (batch up to 30 addresses)
  const addresses = solanaTokens.map(t => t.tokenAddress).join(',');
  const tokensResponse = await fetch(
    `${BASE_URL}/tokens/v1/solana/${addresses}`,
    { next: { revalidate: 30 } }
  );

  if (!tokensResponse.ok) {
    // Fallback: fetch individually
    const results = await Promise.all(
      solanaTokens.slice(0, 10).map(t => getTokenByAddress(t.tokenAddress))
    );
    return results.filter((t): t is TokenPair => t !== null);
  }

  const tokensData: TokenPair[] = await tokensResponse.json();
  return tokensData || [];
}

export async function getLatestTokens(): Promise<TokenPair[]> {
  const response = await fetch(
    `${BASE_URL}/token-profiles/latest/v1`,
    { next: { revalidate: 30 } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch latest tokens');
  }

  const profileData: BoostToken[] = await response.json();

  // Filter for Solana tokens
  const solanaTokens = profileData
    .filter(t => t.chainId === 'solana')
    .slice(0, 20);

  if (solanaTokens.length === 0) {
    return [];
  }

  // Fetch full token data
  const addresses = solanaTokens.map(t => t.tokenAddress).join(',');
  const tokensResponse = await fetch(
    `${BASE_URL}/tokens/v1/solana/${addresses}`,
    { next: { revalidate: 30 } }
  );

  if (!tokensResponse.ok) {
    return [];
  }

  const tokensData: TokenPair[] = await tokensResponse.json();
  return tokensData || [];
}

export async function searchTokens(query: string): Promise<TokenPair[]> {
  const response = await fetch(
    `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`,
    { next: { revalidate: 60 } }
  );

  if (!response.ok) {
    throw new Error('Failed to search tokens');
  }

  const data: DexScreenerResponse = await response.json();
  // Filter for Solana only
  return (data.pairs || []).filter(pair => pair.chainId === 'solana');
}

export async function getTokenByAddress(address: string): Promise<TokenPair | null> {
  const response = await fetch(
    `${BASE_URL}/tokens/v1/solana/${address}`,
    { next: { revalidate: 30 } }
  );

  if (!response.ok) {
    // Fallback to old endpoint
    const fallbackResponse = await fetch(
      `${BASE_URL}/latest/dex/tokens/${address}`,
      { next: { revalidate: 30 } }
    );

    if (!fallbackResponse.ok) {
      return null;
    }

    const data: DexScreenerResponse = await fallbackResponse.json();
    const solanaPairs = (data.pairs || []).filter(pair => pair.chainId === 'solana');
    return solanaPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
  }

  const data: TokenPair[] = await response.json();
  if (!data || data.length === 0) return null;

  // Return the pair with highest liquidity
  return data.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
}

export async function getTokenPairs(address: string): Promise<TokenPair[]> {
  const response = await fetch(
    `${BASE_URL}/tokens/v1/solana/${address}`,
    { next: { revalidate: 30 } }
  );

  if (!response.ok) {
    return [];
  }

  const data: TokenPair[] = await response.json();
  return data || [];
}
