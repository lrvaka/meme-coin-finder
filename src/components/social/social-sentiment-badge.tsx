'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Twitter,
  Send,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialMetrics } from '@/lib/utils/social-sentiment';
import { getSentimentLabel } from '@/lib/utils/social-sentiment';

interface SocialSentimentBadgeProps {
  metrics: SocialMetrics;
  showTooltip?: boolean;
}

export function SocialSentimentBadge({ metrics, showTooltip = true }: SocialSentimentBadgeProps) {
  const { overallSentiment, sentimentScore, buzzScore } = metrics;

  const color =
    sentimentScore >= 70 ? 'text-green-400' :
    sentimentScore >= 55 ? 'text-lime-400' :
    sentimentScore >= 45 ? 'text-yellow-400' :
    sentimentScore >= 30 ? 'text-orange-400' :
    'text-red-400';

  const bgColor =
    sentimentScore >= 70 ? 'bg-green-500/10' :
    sentimentScore >= 55 ? 'bg-lime-500/10' :
    sentimentScore >= 45 ? 'bg-yellow-500/10' :
    sentimentScore >= 30 ? 'bg-orange-500/10' :
    'bg-red-500/10';

  const Icon =
    overallSentiment === 'very_bullish' || overallSentiment === 'bullish' ? TrendingUp :
    overallSentiment === 'neutral' ? Activity :
    TrendingDown;

  const badge = (
    <Badge
      variant="secondary"
      className={cn('text-xs gap-1', color, bgColor)}
    >
      <MessageCircle className="h-3 w-3" />
      {sentimentScore}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              {getSentimentLabel(overallSentiment)} ({sentimentScore}/100)
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Activity:</span>{' '}
                <span className="font-medium">{metrics.activityScore}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Buy Pressure:</span>{' '}
                <span className={cn(
                  'font-medium',
                  metrics.buyPressure > 55 ? 'text-green-400' :
                  metrics.buyPressure < 45 ? 'text-red-400' :
                  ''
                )}>
                  {metrics.buyPressure}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Buzz:</span>{' '}
                <span className="font-medium">{buzzScore}</span>
              </div>
              <div className="flex items-center gap-1">
                {metrics.hasTwitter && <Twitter className="h-3 w-3" />}
                {metrics.hasTelegram && <Send className="h-3 w-3" />}
                {!metrics.hasTwitter && !metrics.hasTelegram && (
                  <span className="text-muted-foreground text-xs">No socials</span>
                )}
              </div>
            </div>

            {metrics.signals.length > 0 && (
              <div className="text-xs">
                <span className="text-green-400 font-medium">Signals: </span>
                {metrics.signals.slice(0, 2).join(', ')}
              </div>
            )}

            {metrics.warnings.length > 0 && (
              <div className="text-xs">
                <span className="text-red-400 font-medium">Warnings: </span>
                {metrics.warnings.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
