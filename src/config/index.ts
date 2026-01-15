export const config = {
  dexscreener: {
    baseUrl: 'https://api.dexscreener.com',
  },
  birdeye: {
    baseUrl: 'https://public-api.birdeye.so',
    apiKey: process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
  },
  helius: {
    baseUrl: 'https://api.helius.xyz',
    apiKey: process.env.HELIUS_API_KEY || '',
  },
  solana: {
    chainId: 'solana',
  },
  defaults: {
    minLiquidity: 10000, // $10k
    maxAge: 24, // hours
    minVolume24h: 50000, // $50k
  },
} as const;
