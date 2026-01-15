'use client';

import { TokenCard } from './token-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TokenPair } from '@/types/token';

interface TokenGridProps {
  tokens: TokenPair[];
  isLoading?: boolean;
}

export function TokenGrid({ tokens, isLoading }: TokenGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <TokenCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tokens found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <TokenCard key={token.pairAddress} token={token} />
      ))}
    </div>
  );
}

function TokenCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-3 w-8 mx-auto mb-1" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
