'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Droplets, BarChart3, Users, Clock, ExternalLink, Shield, AlertTriangle, Rocket, Flame, ArrowDown, Coins } from 'lucide-react';
import { formatUsd, formatPercent, formatPrice, formatAge, formatNumber } from '@/lib/utils/format';
import { calculateSafetyScore } from '@/lib/utils/safety';
import { calculateRunPotential } from '@/lib/utils/run-potential';
import type { TokenPair } from '@/types/token';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface TokenCardProps {
  token: TokenPair;
}

const PHASE_CONFIG = {
  'accumulation': { label: 'Accumulating', icon: Coins, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'early-momentum': { label: 'Early Momentum', icon: TrendingUp, color: 'text-lime-400', bg: 'bg-lime-500/10' },
  'breakout': { label: 'Breaking Out', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'already-ran': { label: 'Already Ran', icon: ArrowDown, color: 'text-red-400', bg: 'bg-red-500/10' },
  'declining': { label: 'Declining', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
  'unknown': { label: 'Unknown', icon: BarChart3, color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export function TokenCard({ token }: TokenCardProps) {
  const priceChange24h = token.priceChange?.h24 || 0;
  const isPositive = priceChange24h >= 0;

  const safety = useMemo(() => calculateSafetyScore(token), [token]);
  const runPotential = useMemo(() => calculateRunPotential(token), [token]);
  const phaseConfig = PHASE_CONFIG[runPotential.phase];

  return (
    <Link href={`/token/${token.baseToken.address}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Token Info */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={token.info?.imageUrl} alt={token.baseToken.symbol} />
                <AvatarFallback className="text-xs font-bold">
                  {token.baseToken.symbol.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{token.baseToken.symbol}</h3>
                  {/* Run Potential Badge */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className={cn('text-xs font-bold gap-1', runPotential.color, phaseConfig.bg)}
                        >
                          <Rocket className="h-3 w-3" />
                          {runPotential.grade}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-semibold flex items-center gap-2">
                            <phaseConfig.icon className={cn('h-4 w-4', phaseConfig.color)} />
                            {phaseConfig.label} ({runPotential.score}/100)
                          </div>
                          {runPotential.signals.length > 0 && (
                            <div>
                              <div className="text-green-400 text-xs font-medium mb-1">Bullish Signals:</div>
                              <ul className="text-xs space-y-0.5">
                                {runPotential.signals.slice(0, 3).map((signal, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <TrendingUp className="h-3 w-3 shrink-0 mt-0.5 text-green-400" />
                                    {signal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {runPotential.warnings.length > 0 && (
                            <div>
                              <div className="text-red-400 text-xs font-medium mb-1">Warnings:</div>
                              <ul className="text-xs space-y-0.5">
                                {runPotential.warnings.slice(0, 3).map((warning, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-red-400" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* Safety Badge */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={safety.grade === 'F' ? 'destructive' : 'outline'}
                          className={cn('text-xs', safety.color)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {safety.grade}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-semibold">Safety Score: {safety.score}/100</div>
                          {safety.risks.length > 0 && (
                            <div>
                              <div className="text-red-400 text-xs font-medium mb-1">Risks:</div>
                              <ul className="text-xs space-y-0.5">
                                {safety.risks.slice(0, 3).map((risk, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                    {risk}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {safety.positives.length > 0 && (
                            <div>
                              <div className="text-green-400 text-xs font-medium mb-1">Positives:</div>
                              <ul className="text-xs space-y-0.5">
                                {safety.positives.slice(0, 3).map((pos, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <Shield className="h-3 w-3 shrink-0 mt-0.5" />
                                    {pos}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {token.boosts?.active && token.boosts.active > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Boosted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {token.baseToken.name}
                </p>
              </div>
            </div>

            {/* Price & Change */}
            <div className="text-right shrink-0">
              <p className="font-mono font-medium">
                {formatPrice(parseFloat(token.priceUsd))}
              </p>
              <div
                className={cn(
                  'flex items-center justify-end gap-1 text-sm',
                  isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercent(priceChange24h)}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <BarChart3 className="h-3 w-3" />
                <span className="text-xs">MC</span>
              </div>
              <p className="text-sm font-medium">{formatUsd(token.marketCap, 1)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Droplets className="h-3 w-3" />
                <span className="text-xs">Liq</span>
              </div>
              <p className="text-sm font-medium">{formatUsd(token.liquidity?.usd, 1)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">Vol 24h</span>
              </div>
              <p className="text-sm font-medium">{formatUsd(token.volume?.h24, 1)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Age</span>
              </div>
              <p className="text-sm font-medium">{formatAge(token.pairCreatedAt)}</p>
            </div>
          </div>

          {/* Txns & Phase */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span className="text-green-500">
                {formatNumber(token.txns?.h24?.buys, 0)} buys
              </span>
              <span className="text-red-500">
                {formatNumber(token.txns?.h24?.sells, 0)} sells
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn('flex items-center gap-1', phaseConfig.color)}>
                <phaseConfig.icon className="h-3 w-3" />
                <span>{phaseConfig.label}</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1">
                <span>{token.dexId}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
