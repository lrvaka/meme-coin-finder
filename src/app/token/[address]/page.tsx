'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useToken } from '@/lib/hooks/useTokens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PriceChart } from '@/components/charts/price-chart';
import { formatUsd, formatPercent, formatPrice, formatAge, formatNumber, shortenAddress, copyToClipboard } from '@/lib/utils/format';
import { calculateSafetyScore } from '@/lib/utils/safety';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Droplets,
  BarChart3,
  Users,
  Clock,
  Globe,
  Twitter,
  Send,
  MessageCircle,
  Shield,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { data: token, isLoading } = useToken(address);

  const safety = useMemo(() => {
    if (!token) return null;
    return calculateSafetyScore(token);
  }, [token]);

  if (isLoading) {
    return <TokenDetailSkeleton />;
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Token not found</p>
        </div>
      </div>
    );
  }

  const priceChange24h = token.priceChange?.h24 || 0;
  const isPositive = priceChange24h >= 0;

  const socials = token.info?.socials || [];
  const websites = token.info?.websites || [];

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Token Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={token.info?.imageUrl} alt={token.baseToken.symbol} />
            <AvatarFallback className="text-xl font-bold">
              {token.baseToken.symbol.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{token.baseToken.symbol}</h1>
              {safety && (
                <Badge
                  variant={safety.grade === 'F' ? 'destructive' : 'secondary'}
                  className={cn('text-sm font-bold', safety.color)}
                >
                  {safety.grade} ({safety.score})
                </Badge>
              )}
              {token.boosts?.active && token.boosts.active > 0 && (
                <Badge variant="outline">Boosted</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{token.baseToken.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {shortenAddress(address, 6)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(address)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <a
                href={`https://solscan.io/token/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-4xl font-mono font-bold">
            {formatPrice(parseFloat(token.priceUsd))}
          </p>
          <div
            className={cn(
              'flex items-center justify-end gap-2 text-lg',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            <span>{formatPercent(priceChange24h)}</span>
            <span className="text-muted-foreground text-sm">24h</span>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {(socials.length > 0 || websites.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {websites.map((site, i) => (
            <a
              key={i}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground bg-muted px-3 py-1 rounded-full"
            >
              <Globe className="h-3 w-3" />
              Website
            </a>
          ))}
          {socials.map((social, i) => {
            const Icon = social.type === 'twitter' ? Twitter : social.type === 'telegram' ? Send : MessageCircle;
            return (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground bg-muted px-3 py-1 rounded-full capitalize"
              >
                <Icon className="h-3 w-3" />
                {social.type}
              </a>
            );
          })}
        </div>
      )}

      {/* Safety Score Card */}
      {safety && (
        <Card className={cn(
          'border-2',
          safety.grade === 'A' ? 'border-green-500/50' :
          safety.grade === 'B' ? 'border-lime-500/50' :
          safety.grade === 'C' ? 'border-yellow-500/50' :
          safety.grade === 'D' ? 'border-orange-500/50' :
          'border-red-500/50'
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className={cn('h-5 w-5', safety.color)} />
              Safety Analysis
              <Badge variant="outline" className={cn('ml-2', safety.color)}>
                Grade {safety.grade} - {safety.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Risks */}
              <div>
                <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors ({safety.risks.length})
                </h4>
                {safety.risks.length > 0 ? (
                  <ul className="space-y-2">
                    {safety.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No major risks detected</p>
                )}
              </div>

              {/* Positives */}
              <div>
                <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Positive Signals ({safety.positives.length})
                </h4>
                {safety.positives.length > 0 ? (
                  <ul className="space-y-2">
                    {safety.positives.map((pos, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{pos}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No positive signals yet</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Note: This score is based on publicly available data and should not be considered financial advice.
              Always DYOR (Do Your Own Research) before investing.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Market Cap"
          value={formatUsd(token.marketCap, 1)}
          icon={BarChart3}
        />
        <MetricCard
          title="Liquidity"
          value={formatUsd(token.liquidity?.usd, 1)}
          icon={Droplets}
        />
        <MetricCard
          title="Volume 24h"
          value={formatUsd(token.volume?.h24, 1)}
          icon={Users}
        />
        <MetricCard
          title="Age"
          value={formatAge(token.pairCreatedAt)}
          icon={Clock}
        />
      </div>

      {/* Price Chart */}
      <PriceChart
        tokenAddress={token.baseToken.address}
        pairAddress={token.pairAddress}
        symbol={token.baseToken.symbol}
      />

      {/* Transaction Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Stats (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Buys</p>
              <p className="text-2xl font-bold text-green-500">
                {formatNumber(token.txns?.h24?.buys, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sells</p>
              <p className="text-2xl font-bold text-red-500">
                {formatNumber(token.txns?.h24?.sells, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Buy/Sell Ratio</p>
              <p className="text-2xl font-bold">
                {token.txns?.h24
                  ? ((token.txns.h24.buys / (token.txns.h24.sells || 1))).toFixed(2)
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">DEX</p>
              <p className="text-2xl font-bold capitalize">{token.dexId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: '5m', value: token.priceChange?.m5 },
              { label: '1h', value: token.priceChange?.h1 },
              { label: '6h', value: token.priceChange?.h6 },
              { label: '24h', value: token.priceChange?.h24 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    (value || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {formatPercent(value)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm">{title}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function TokenDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-6 w-24 ml-auto" />
        </div>
      </div>
      <Skeleton className="h-40" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[450px]" />
    </div>
  );
}
