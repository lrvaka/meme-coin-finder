'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ExternalLink } from 'lucide-react';

interface PriceChartProps {
  tokenAddress: string;
  pairAddress?: string;
  symbol: string;
}

export function PriceChart({ tokenAddress, pairAddress, symbol }: PriceChartProps) {
  const embedUrl = pairAddress
    ? `https://dexscreener.com/solana/${pairAddress}?embed=1&theme=dark&trades=0&info=0`
    : `https://dexscreener.com/solana/${tokenAddress}?embed=1&theme=dark&trades=0&info=0`;

  const dexscreenerUrl = pairAddress
    ? `https://dexscreener.com/solana/${pairAddress}`
    : `https://dexscreener.com/solana/${tokenAddress}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          {symbol} Price Chart
        </CardTitle>
        <a href={dexscreenerUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[500px]">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0 rounded-b-lg"
            title={`${symbol} Chart`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
