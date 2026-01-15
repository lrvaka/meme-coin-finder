'use client';

import type { TokenPair } from '@/types/token';
import type { RedditSentiment } from '@/lib/api/reddit';

export interface SocialMetrics {
  // On-chain activity as sentiment proxy
  activityScore: number; // 0-100
  buyPressure: number; // 0-100 (% buys vs sells)
  velocityScore: number; // 0-100 (transaction frequency)

  // Social presence
  hasTwitter: boolean;
  hasTelegram: boolean;
  hasDiscord: boolean;
  hasWebsite: boolean;
  socialLinksCount: number;

  // Combined scores
  overallSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  sentimentScore: number; // 0-100
  buzzScore: number; // 0-100 (overall social buzz)

  // Signals
  signals: string[];
  warnings: string[];
}

export interface CombinedSentiment {
  social: SocialMetrics;
  reddit?: RedditSentiment;
  overallScore: number; // 0-100
  overallSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
}

/**
 * Calculate social metrics from on-chain and social data
 */
export function calculateSocialMetrics(token: TokenPair): SocialMetrics {
  const signals: string[] = [];
  const warnings: string[] = [];

  // === Activity Score (based on transaction counts) ===
  const txns24h = (token.txns?.h24?.buys || 0) + (token.txns?.h24?.sells || 0);
  const txns1h = (token.txns?.h1?.buys || 0) + (token.txns?.h1?.sells || 0);
  const txns5m = (token.txns?.m5?.buys || 0) + (token.txns?.m5?.sells || 0);

  let activityScore = 0;

  // 24h transactions
  if (txns24h > 5000) {
    activityScore += 40;
    signals.push('Very high transaction activity (5K+ txns/24h)');
  } else if (txns24h > 1000) {
    activityScore += 30;
    signals.push('High transaction activity (1K+ txns/24h)');
  } else if (txns24h > 200) {
    activityScore += 20;
  } else if (txns24h < 50) {
    warnings.push('Low transaction activity');
  }

  // Recent activity boost
  if (txns1h > txns24h / 12) {
    activityScore += 15;
    signals.push('Activity accelerating in last hour');
  }
  if (txns5m > txns1h / 6) {
    activityScore += 10;
    signals.push('Activity spiking in last 5 minutes');
  }

  // Volume factor
  const volume24h = token.volume?.h24 || 0;
  if (volume24h > 1000000) {
    activityScore += 20;
    signals.push('High volume ($1M+ daily)');
  } else if (volume24h > 100000) {
    activityScore += 10;
  }

  activityScore = Math.min(activityScore, 100);

  // === Buy Pressure ===
  const buys24h = token.txns?.h24?.buys || 0;
  const sells24h = token.txns?.h24?.sells || 0;
  const totalTxns24h = buys24h + sells24h;
  const buyPressure = totalTxns24h > 0 ? Math.round((buys24h / totalTxns24h) * 100) : 50;

  if (buyPressure > 65) {
    signals.push(`Strong buy pressure (${buyPressure}% buys)`);
  } else if (buyPressure < 35) {
    warnings.push(`Heavy selling pressure (${100 - buyPressure}% sells)`);
  }

  // === Velocity Score (how fast is it being traded) ===
  const liquidity = token.liquidity?.usd || 1;
  const volumeToLiq = volume24h / liquidity;
  let velocityScore = Math.min(Math.round(volumeToLiq * 20), 100);

  if (volumeToLiq > 5) {
    signals.push('Very high trading velocity');
  } else if (volumeToLiq > 2) {
    signals.push('Active trading');
  } else if (volumeToLiq < 0.5) {
    warnings.push('Low trading velocity');
  }

  // === Social Presence ===
  const socials = token.info?.socials || [];
  const websites = token.info?.websites || [];

  const hasTwitter = socials.some(s => s.type === 'twitter');
  const hasTelegram = socials.some(s => s.type === 'telegram');
  const hasDiscord = socials.some(s => s.type === 'discord');
  const hasWebsite = websites.length > 0;
  const socialLinksCount = socials.length + websites.length;

  if (hasTwitter && hasTelegram) {
    signals.push('Active on Twitter and Telegram');
  }
  if (hasWebsite) {
    signals.push('Has official website');
  }
  if (socialLinksCount === 0) {
    warnings.push('No social links found');
  }

  // === Buzz Score (social presence + activity) ===
  let buzzScore = 0;

  // Social links factor (max 30)
  buzzScore += Math.min(socialLinksCount * 8, 30);

  // Activity factor (max 40)
  buzzScore += Math.round(activityScore * 0.4);

  // Buy pressure factor (max 30)
  if (buyPressure > 50) {
    buzzScore += Math.round((buyPressure - 50) * 0.6);
  }

  buzzScore = Math.min(buzzScore, 100);

  // === Sentiment Score ===
  let sentimentScore = 50;

  // Activity impact
  sentimentScore += Math.round((activityScore - 50) * 0.3);

  // Buy pressure impact
  sentimentScore += Math.round((buyPressure - 50) * 0.4);

  // Velocity impact
  sentimentScore += Math.round((velocityScore - 50) * 0.2);

  // Social presence bonus
  sentimentScore += socialLinksCount * 2;

  sentimentScore = Math.max(0, Math.min(100, sentimentScore));

  // === Overall Sentiment ===
  let overallSentiment: SocialMetrics['overallSentiment'];
  if (sentimentScore >= 75) {
    overallSentiment = 'very_bullish';
  } else if (sentimentScore >= 60) {
    overallSentiment = 'bullish';
  } else if (sentimentScore >= 40) {
    overallSentiment = 'neutral';
  } else if (sentimentScore >= 25) {
    overallSentiment = 'bearish';
  } else {
    overallSentiment = 'very_bearish';
  }

  return {
    activityScore,
    buyPressure,
    velocityScore,
    hasTwitter,
    hasTelegram,
    hasDiscord,
    hasWebsite,
    socialLinksCount,
    overallSentiment,
    sentimentScore,
    buzzScore,
    signals,
    warnings,
  };
}

/**
 * Combine on-chain social metrics with Reddit sentiment
 */
export function combineSentiment(
  socialMetrics: SocialMetrics,
  redditSentiment?: RedditSentiment
): CombinedSentiment {
  let overallScore = socialMetrics.sentimentScore;

  // If we have Reddit data, factor it in
  if (redditSentiment && redditSentiment.totalMentions > 0) {
    const redditScore = redditSentiment.trendingScore;

    // Weight: 60% on-chain, 40% Reddit
    overallScore = Math.round(socialMetrics.sentimentScore * 0.6 + redditScore * 0.4);

    // Bonus for Reddit mentions
    if (redditSentiment.totalMentions > 10) {
      overallScore += 5;
    }

    // Penalty for bearish Reddit sentiment
    if (redditSentiment.sentimentBreakdown.bearish > redditSentiment.sentimentBreakdown.bullish * 2) {
      overallScore -= 10;
    }
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  // Determine overall sentiment
  let overallSentiment: CombinedSentiment['overallSentiment'];
  if (overallScore >= 75) {
    overallSentiment = 'very_bullish';
  } else if (overallScore >= 60) {
    overallSentiment = 'bullish';
  } else if (overallScore >= 40) {
    overallSentiment = 'neutral';
  } else if (overallScore >= 25) {
    overallSentiment = 'bearish';
  } else {
    overallSentiment = 'very_bearish';
  }

  // Grade
  let grade: CombinedSentiment['grade'];
  let color: string;
  if (overallScore >= 75) {
    grade = 'A';
    color = 'text-green-400';
  } else if (overallScore >= 60) {
    grade = 'B';
    color = 'text-lime-400';
  } else if (overallScore >= 45) {
    grade = 'C';
    color = 'text-yellow-400';
  } else if (overallScore >= 30) {
    grade = 'D';
    color = 'text-orange-400';
  } else {
    grade = 'F';
    color = 'text-red-400';
  }

  return {
    social: socialMetrics,
    reddit: redditSentiment,
    overallScore,
    overallSentiment,
    grade,
    color,
  };
}

/**
 * Get sentiment label for display
 */
export function getSentimentLabel(sentiment: CombinedSentiment['overallSentiment']): string {
  switch (sentiment) {
    case 'very_bullish':
      return 'Very Bullish';
    case 'bullish':
      return 'Bullish';
    case 'neutral':
      return 'Neutral';
    case 'bearish':
      return 'Bearish';
    case 'very_bearish':
      return 'Very Bearish';
  }
}

/**
 * Get sentiment emoji for display
 */
export function getSentimentEmoji(sentiment: CombinedSentiment['overallSentiment']): string {
  switch (sentiment) {
    case 'very_bullish':
      return '🚀';
    case 'bullish':
      return '📈';
    case 'neutral':
      return '➡️';
    case 'bearish':
      return '📉';
    case 'very_bearish':
      return '💀';
  }
}
