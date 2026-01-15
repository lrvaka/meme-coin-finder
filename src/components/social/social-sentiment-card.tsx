'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Twitter,
  Send,
  Globe,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CombinedSentiment } from '@/lib/utils/social-sentiment';
import { getSentimentLabel } from '@/lib/utils/social-sentiment';
import { formatNumber } from '@/lib/utils/format';

interface SocialSentimentCardProps {
  sentiment: CombinedSentiment | null;
  isLoading?: boolean;
  showReddit?: boolean;
}

export function SocialSentimentCard({
  sentiment,
  isLoading,
  showReddit = true,
}: SocialSentimentCardProps) {
  if (isLoading) {
    return <SocialSentimentSkeleton />;
  }

  if (!sentiment) {
    return null;
  }

  const { social, reddit, overallScore, overallSentiment, grade, color } = sentiment;

  return (
    <Card className={cn(
      'border-2',
      grade === 'A' ? 'border-green-500/50' :
      grade === 'B' ? 'border-lime-500/50' :
      grade === 'C' ? 'border-yellow-500/50' :
      grade === 'D' ? 'border-orange-500/50' :
      'border-red-500/50'
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className={cn('h-5 w-5', color)} />
          Social Sentiment
          <Badge variant="outline" className={cn('ml-2', color)}>
            Grade {grade} - {overallScore}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment Banner */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-lg',
          overallSentiment === 'very_bullish' ? 'bg-green-500/10' :
          overallSentiment === 'bullish' ? 'bg-lime-500/10' :
          overallSentiment === 'neutral' ? 'bg-yellow-500/10' :
          overallSentiment === 'bearish' ? 'bg-orange-500/10' :
          'bg-red-500/10'
        )}>
          <div className="flex items-center gap-3">
            {overallSentiment === 'very_bullish' || overallSentiment === 'bullish' ? (
              <TrendingUp className={cn('h-8 w-8', color)} />
            ) : overallSentiment === 'neutral' ? (
              <Activity className={cn('h-8 w-8', color)} />
            ) : (
              <TrendingDown className={cn('h-8 w-8', color)} />
            )}
            <div>
              <p className={cn('text-lg font-bold', color)}>
                {getSentimentLabel(overallSentiment)}
              </p>
              <p className="text-sm text-muted-foreground">
                Based on on-chain activity{reddit && reddit.totalMentions > 0 ? ' & Reddit' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-3xl font-bold', color)}>{overallScore}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Activity Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-4 w-4" />
                Activity
              </span>
              <span className="font-medium">{social.activityScore}/100</span>
            </div>
            <Progress value={social.activityScore} className="h-2" />
          </div>

          {/* Buy Pressure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                Buy Pressure
              </span>
              <span className={cn(
                'font-medium',
                social.buyPressure > 55 ? 'text-green-400' :
                social.buyPressure < 45 ? 'text-red-400' :
                'text-yellow-400'
              )}>
                {social.buyPressure}%
              </span>
            </div>
            <Progress
              value={social.buyPressure}
              className={cn(
                'h-2',
                social.buyPressure > 55 ? '[&>div]:bg-green-500' :
                social.buyPressure < 45 ? '[&>div]:bg-red-500' :
                '[&>div]:bg-yellow-500'
              )}
            />
          </div>

          {/* Buzz Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                Buzz
              </span>
              <span className="font-medium">{social.buzzScore}/100</span>
            </div>
            <Progress value={social.buzzScore} className="h-2" />
          </div>
        </div>

        {/* Social Presence */}
        <div>
          <h4 className="font-semibold mb-3 text-sm">Social Presence</h4>
          <div className="flex flex-wrap gap-2">
            {social.hasTwitter && (
              <Badge variant="secondary" className="gap-1">
                <Twitter className="h-3 w-3" />
                Twitter
              </Badge>
            )}
            {social.hasTelegram && (
              <Badge variant="secondary" className="gap-1">
                <Send className="h-3 w-3" />
                Telegram
              </Badge>
            )}
            {social.hasDiscord && (
              <Badge variant="secondary" className="gap-1">
                <MessageCircle className="h-3 w-3" />
                Discord
              </Badge>
            )}
            {social.hasWebsite && (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Website
              </Badge>
            )}
            {social.socialLinksCount === 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                No socials found
              </Badge>
            )}
          </div>
        </div>

        {/* Reddit Section */}
        {showReddit && reddit && reddit.totalMentions > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-500" />
              Reddit Mentions ({reddit.totalMentions})
            </h4>

            {/* Reddit Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold text-green-400">
                  {reddit.sentimentBreakdown.bullish}
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  Bullish
                </p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold text-yellow-400">
                  {reddit.sentimentBreakdown.neutral}
                </p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold text-red-400">
                  {reddit.sentimentBreakdown.bearish}
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ThumbsDown className="h-3 w-3" />
                  Bearish
                </p>
              </div>
            </div>

            {/* Recent Mentions */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Recent Mentions</h5>
              {reddit.mentions.slice(0, 3).map((mention) => (
                <a
                  key={mention.id}
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{mention.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>r/{mention.subreddit}</span>
                        <span>·</span>
                        <span>{formatNumber(mention.score, 0)} points</span>
                        <span>·</span>
                        <span>{mention.comments} comments</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'shrink-0',
                        mention.sentiment === 'bullish' ? 'text-green-400' :
                        mention.sentiment === 'bearish' ? 'text-red-400' :
                        'text-yellow-400'
                      )}
                    >
                      {mention.sentiment}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>

            {/* Subreddit Breakdown */}
            {Object.keys(reddit.subredditBreakdown).length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Active Subreddits</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reddit.subredditBreakdown).map(([sub, count]) => (
                    <Badge key={sub} variant="outline" className="text-xs">
                      r/{sub} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Signals and Warnings */}
        <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
          {/* Bullish Signals */}
          <div>
            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              Bullish Signals
            </h4>
            {social.signals.length > 0 ? (
              <ul className="space-y-1">
                {social.signals.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No strong bullish signals</p>
            )}
          </div>

          {/* Warnings */}
          <div>
            <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </h4>
            {social.warnings.length > 0 ? (
              <ul className="space-y-1">
                {social.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No warnings</p>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          Social sentiment is calculated from on-chain activity (buy/sell ratio, transaction velocity, volume)
          {showReddit && ' and Reddit mentions'}. This is not financial advice.
        </div>
      </CardContent>
    </Card>
  );
}

function SocialSentimentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}
