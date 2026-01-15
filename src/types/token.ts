export interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
  boosts?: {
    active: number;
  };
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: TokenPair[];
}

export interface TokenFilter {
  minLiquidity?: number;
  maxAge?: number; // hours
  minVolume24h?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
}

export interface WatchedWallet {
  address: string;
  label: string;
  addedAt: number;
}

export interface WalletTransaction {
  signature: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
}
