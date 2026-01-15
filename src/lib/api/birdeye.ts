import { config } from '@/config';

const BASE_URL = config.birdeye.baseUrl;

interface BirdeyeTokenOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  logoURI?: string;
  liquidity: number;
  price: number;
  priceChange24hPercent: number;
  volume24h: number;
  mc: number;
  holder: number;
  trade24h: number;
  trade24hChangePercent: number;
  buy24h: number;
  sell24h: number;
}

interface BirdeyeOHLCV {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  unixTime: number;
}

const headers = {
  'X-API-KEY': config.birdeye.apiKey,
  'x-chain': 'solana',
};

export async function getTokenOverview(address: string): Promise<BirdeyeTokenOverview | null> {
  if (!config.birdeye.apiKey) {
    console.warn('Birdeye API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/defi/token_overview?address=${address}`,
      { headers, next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function getTokenPrice(address: string): Promise<number | null> {
  if (!config.birdeye.apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/defi/price?address=${address}`,
      { headers, next: { revalidate: 30 } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.value || null;
  } catch {
    return null;
  }
}

export async function getTokenOHLCV(
  address: string,
  timeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' = '15m',
  limit: number = 100
): Promise<BirdeyeOHLCV[]> {
  if (!config.birdeye.apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/defi/ohlcv?address=${address}&type=${timeframe}&limit=${limit}`,
      { headers, next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data?.items || [];
  } catch {
    return [];
  }
}

export async function getTrendingTokens(
  sortBy: 'rank' | 'volume24hUSD' | 'liquidity' = 'volume24hUSD',
  limit: number = 50
): Promise<BirdeyeTokenOverview[]> {
  if (!config.birdeye.apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/defi/tokenlist?sort_by=${sortBy}&sort_type=desc&limit=${limit}`,
      { headers, next: { revalidate: 120 } }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data?.tokens || [];
  } catch {
    return [];
  }
}

export async function getTokenHolders(address: string): Promise<number | null> {
  if (!config.birdeye.apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/defi/token_overview?address=${address}`,
      { headers, next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.holder || null;
  } catch {
    return null;
  }
}
