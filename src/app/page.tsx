'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenGrid } from '@/components/token/token-grid';
import { Filters } from '@/components/dashboard/filters';
import { useSearchTokens, useTrendingTokens, filterTokens, sortTokens } from '@/lib/hooks/useTokens';
import type { TokenFilter } from '@/types/token';
import { TrendingUp, Sparkles, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<string>(searchQuery ? 'search' : 'trending');
  const [filter, setFilter] = useState<TokenFilter>({});
  const [sortBy, setSortBy] = useState<string>('runPotential');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: trendingTokens, isLoading: trendingLoading } = useTrendingTokens();
  const { data: searchResults, isLoading: searchLoading } = useSearchTokens(searchQuery);

  const tokens = useMemo(() => {
    let tokenList = activeTab === 'search' && searchQuery ? searchResults || [] : trendingTokens || [];
    tokenList = filterTokens(tokenList, filter);
    tokenList = sortTokens(tokenList, sortBy as 'volume' | 'liquidity' | 'priceChange' | 'marketCap' | 'age' | 'safety' | 'runPotential', sortDirection);
    return tokenList;
  }, [activeTab, searchQuery, searchResults, trendingTokens, filter, sortBy, sortDirection]);

  const isLoading = activeTab === 'search' ? searchLoading : trendingLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover Meme Coins</h1>
        <p className="text-muted-foreground mt-1">
          Find trending Solana meme coins before they moon
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Sparkles className="h-4 w-4" />
            New Launches
          </TabsTrigger>
          {searchQuery && (
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search: {searchQuery}
            </TabsTrigger>
          )}
        </TabsList>

        <Filters
          filter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
        />

        <TabsContent value="trending" className="mt-0">
          <TokenGrid tokens={tokens} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="new" className="mt-0">
          <TokenGrid tokens={tokens} isLoading={isLoading} />
        </TabsContent>

        {searchQuery && (
          <TabsContent value="search" className="mt-0">
            <TokenGrid tokens={tokens} isLoading={isLoading} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
