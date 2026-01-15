import type { TokenPair } from '@/types/token';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  upvote_ratio: number;
}

interface RedditSearchResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export interface RedditMention {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  score: number;
  comments: number;
  timestamp: number;
  url: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  upvoteRatio: number;
}

export interface RedditSentiment {
  mentions: RedditMention[];
  totalMentions: number;
  avgScore: number;
  avgComments: number;
  sentimentBreakdown: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trendingScore: number; // 0-100
  subredditBreakdown: Record<string, number>;
}

// Crypto-related subreddits to search
const CRYPTO_SUBREDDITS = [
  'CryptoMoonShots',
  'solana',
  'SolanaMemeCoins',
  'memecoin',
  'CryptoCurrency',
  'altcoin',
  'SatoshiStreetBets',
  'defi',
];

// Keywords that indicate bullish sentiment
const BULLISH_KEYWORDS = [
  'moon', 'bullish', 'pump', 'gem', 'rocket', '100x', '1000x',
  'buy', 'buying', 'accumulate', 'load', 'bags', 'lfg', 'wagmi',
  'early', 'undervalued', 'potential', 'next', 'huge', 'massive',
  'breakout', 'green', 'up', 'gains', 'profit', 'winner',
];

// Keywords that indicate bearish sentiment
const BEARISH_KEYWORDS = [
  'rug', 'scam', 'dump', 'sell', 'selling', 'bearish', 'dead',
  'avoid', 'warning', 'honeypot', 'fake', 'fraud', 'loss',
  'down', 'crash', 'plummet', 'exit', 'rugpull', 'ponzi',
  'careful', 'suspicious', 'red flag', 'ngmi',
];

/**
 * Analyze text sentiment based on keyword presence
 */
function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();

  let bullishScore = 0;
  let bearishScore = 0;

  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bullishScore++;
    }
  }

  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bearishScore++;
    }
  }

  if (bullishScore > bearishScore + 1) return 'bullish';
  if (bearishScore > bullishScore + 1) return 'bearish';
  return 'neutral';
}

/**
 * Search Reddit for mentions of a token
 */
export async function searchRedditMentions(
  tokenSymbol: string,
  tokenName: string,
  tokenAddress?: string
): Promise<RedditSentiment> {
  const mentions: RedditMention[] = [];
  const subredditCounts: Record<string, number> = {};

  // Build search queries
  const queries = [
    tokenSymbol,
    tokenName,
    tokenAddress?.slice(0, 12), // First part of address
  ].filter(Boolean);

  try {
    // Search across crypto subreddits
    for (const subreddit of CRYPTO_SUBREDDITS.slice(0, 4)) { // Limit to avoid rate limits
      for (const query of queries.slice(0, 2)) { // Limit queries
        try {
          const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query!)}&restrict_sr=on&sort=new&limit=10&t=week`,
            {
              headers: {
                'User-Agent': 'MemeFinderBot/1.0',
              },
              next: { revalidate: 300 }, // Cache for 5 minutes
            }
          );

          if (!response.ok) continue;

          const data: RedditSearchResponse = await response.json();

          for (const child of data.data.children) {
            const post = child.data;

            // Skip if already added
            if (mentions.find(m => m.id === post.id)) continue;

            // Check if it actually mentions our token
            const fullText = `${post.title} ${post.selftext}`.toLowerCase();
            const symbolLower = tokenSymbol.toLowerCase();
            const nameLower = tokenName.toLowerCase();

            if (!fullText.includes(symbolLower) && !fullText.includes(nameLower)) {
              continue;
            }

            const sentiment = analyzeSentiment(fullText);

            mentions.push({
              id: post.id,
              title: post.title,
              content: post.selftext.slice(0, 200),
              subreddit: post.subreddit,
              author: post.author,
              score: post.score,
              comments: post.num_comments,
              timestamp: post.created_utc * 1000,
              url: `https://reddit.com${post.permalink}`,
              sentiment,
              upvoteRatio: post.upvote_ratio,
            });

            subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
          }
        } catch {
          // Skip failed requests
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Reddit search error:', error);
  }

  // Sort by timestamp (newest first)
  mentions.sort((a, b) => b.timestamp - a.timestamp);

  // Calculate sentiment breakdown
  const sentimentBreakdown = {
    bullish: mentions.filter(m => m.sentiment === 'bullish').length,
    bearish: mentions.filter(m => m.sentiment === 'bearish').length,
    neutral: mentions.filter(m => m.sentiment === 'neutral').length,
  };

  // Calculate averages
  const avgScore = mentions.length > 0
    ? mentions.reduce((sum, m) => sum + m.score, 0) / mentions.length
    : 0;
  const avgComments = mentions.length > 0
    ? mentions.reduce((sum, m) => sum + m.comments, 0) / mentions.length
    : 0;

  // Calculate trending score (0-100)
  // Based on: mention count, recency, sentiment ratio, engagement
  let trendingScore = 0;

  // Mention count factor (max 30 points)
  trendingScore += Math.min(mentions.length * 3, 30);

  // Recency factor (max 25 points) - more points for recent mentions
  const recentMentions = mentions.filter(
    m => Date.now() - m.timestamp < 24 * 60 * 60 * 1000
  ).length;
  trendingScore += Math.min(recentMentions * 5, 25);

  // Sentiment factor (max 25 points)
  const totalSentiment = sentimentBreakdown.bullish + sentimentBreakdown.bearish + sentimentBreakdown.neutral;
  if (totalSentiment > 0) {
    const bullishRatio = sentimentBreakdown.bullish / totalSentiment;
    trendingScore += Math.round(bullishRatio * 25);
  }

  // Engagement factor (max 20 points)
  trendingScore += Math.min(Math.round(avgScore / 10) + Math.round(avgComments / 5), 20);

  return {
    mentions: mentions.slice(0, 20), // Limit to 20 most recent
    totalMentions: mentions.length,
    avgScore,
    avgComments,
    sentimentBreakdown,
    trendingScore: Math.min(trendingScore, 100),
    subredditBreakdown: subredditCounts,
  };
}

/**
 * Get a quick sentiment check without full search
 */
export async function getQuickRedditSentiment(tokenSymbol: string): Promise<{
  hasMentions: boolean;
  recentMentions: number;
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'unknown';
}> {
  try {
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(tokenSymbol)}&sort=new&limit=5&t=day`,
      {
        headers: {
          'User-Agent': 'MemeFinderBot/1.0',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      return { hasMentions: false, recentMentions: 0, sentiment: 'unknown' };
    }

    const data: RedditSearchResponse = await response.json();
    const posts = data.data.children;

    if (posts.length === 0) {
      return { hasMentions: false, recentMentions: 0, sentiment: 'unknown' };
    }

    let bullish = 0;
    let bearish = 0;

    for (const child of posts) {
      const text = `${child.data.title} ${child.data.selftext}`;
      const sentiment = analyzeSentiment(text);
      if (sentiment === 'bullish') bullish++;
      if (sentiment === 'bearish') bearish++;
    }

    return {
      hasMentions: true,
      recentMentions: posts.length,
      sentiment: bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral',
    };
  } catch {
    return { hasMentions: false, recentMentions: 0, sentiment: 'unknown' };
  }
}
