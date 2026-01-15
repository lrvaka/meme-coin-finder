import type { TokenPair } from '@/types/token';

export interface SafetyScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  risks: string[];
  positives: string[];
}

export function calculateSafetyScore(token: TokenPair): SafetyScore {
  const risks: string[] = [];
  const positives: string[] = [];
  let score = 50; // Start neutral

  // 1. Liquidity Check (max +20 / -20)
  const liquidity = token.liquidity?.usd || 0;
  if (liquidity >= 100000) {
    score += 20;
    positives.push('Strong liquidity (>$100K)');
  } else if (liquidity >= 50000) {
    score += 15;
    positives.push('Good liquidity (>$50K)');
  } else if (liquidity >= 20000) {
    score += 10;
    positives.push('Moderate liquidity (>$20K)');
  } else if (liquidity >= 10000) {
    score += 5;
  } else if (liquidity < 5000) {
    score -= 20;
    risks.push('Very low liquidity (<$5K) - easy to manipulate');
  } else {
    score -= 10;
    risks.push('Low liquidity (<$10K)');
  }

  // 2. Volume to Liquidity Ratio (max +10 / -10)
  const volume24h = token.volume?.h24 || 0;
  const volLiqRatio = liquidity > 0 ? volume24h / liquidity : 0;
  if (volLiqRatio > 10) {
    score += 10;
    positives.push('High trading activity');
  } else if (volLiqRatio > 3) {
    score += 5;
    positives.push('Active trading');
  } else if (volLiqRatio < 0.1 && volume24h < 10000) {
    score -= 10;
    risks.push('Very low trading activity');
  }

  // 3. Buy/Sell Ratio (max +10 / -15)
  const buys24h = token.txns?.h24?.buys || 0;
  const sells24h = token.txns?.h24?.sells || 0;
  const totalTxns = buys24h + sells24h;

  if (totalTxns > 0) {
    const buyRatio = buys24h / totalTxns;
    if (buyRatio >= 0.6) {
      score += 10;
      positives.push('More buyers than sellers');
    } else if (buyRatio >= 0.45) {
      score += 5;
      positives.push('Balanced buy/sell ratio');
    } else if (buyRatio < 0.3) {
      score -= 15;
      risks.push('Heavy selling pressure');
    } else if (buyRatio < 0.4) {
      score -= 5;
      risks.push('More sellers than buyers');
    }
  }

  // 4. Token Age (max +10 / -5)
  const ageHours = token.pairCreatedAt
    ? (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
    : 0;

  if (ageHours > 168) { // > 7 days
    score += 10;
    positives.push('Established token (>7 days)');
  } else if (ageHours > 48) {
    score += 5;
    positives.push('Survived initial volatility');
  } else if (ageHours < 6) {
    score -= 5;
    risks.push('Very new token (<6 hours)');
  }

  // 5. Price stability (max +5 / -10)
  const priceChange1h = Math.abs(token.priceChange?.h1 || 0);
  const priceChange24h = Math.abs(token.priceChange?.h24 || 0);

  if (priceChange1h > 50) {
    score -= 10;
    risks.push('Extreme volatility (>50% in 1h)');
  } else if (priceChange24h > 200) {
    score -= 5;
    risks.push('Very high volatility');
  } else if (priceChange1h < 10 && priceChange24h < 30) {
    score += 5;
    positives.push('Relatively stable price');
  }

  // 6. Market Cap vs Liquidity (max +5 / -10)
  const marketCap = token.marketCap || token.fdv || 0;
  const mcLiqRatio = liquidity > 0 ? marketCap / liquidity : 0;

  if (mcLiqRatio > 100) {
    score -= 10;
    risks.push('Very low liquidity vs market cap - hard to exit');
  } else if (mcLiqRatio > 50) {
    score -= 5;
    risks.push('Low liquidity relative to market cap');
  } else if (mcLiqRatio > 0 && mcLiqRatio < 20) {
    score += 5;
    positives.push('Good liquidity depth');
  }

  // 7. Has social presence (max +5)
  const hasSocials = token.info?.socials && token.info.socials.length > 0;
  const hasWebsite = token.info?.websites && token.info.websites.length > 0;

  if (hasSocials && hasWebsite) {
    score += 5;
    positives.push('Has website and socials');
  } else if (hasSocials || hasWebsite) {
    score += 2;
  } else {
    risks.push('No social links');
  }

  // 8. Boosted status (informational)
  if (token.boosts?.active && token.boosts.active > 0) {
    positives.push(`Boosted on DexScreener (${token.boosts.active})`);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: SafetyScore['grade'];
  let color: string;

  if (score >= 80) {
    grade = 'A';
    color = 'text-green-500';
  } else if (score >= 65) {
    grade = 'B';
    color = 'text-lime-500';
  } else if (score >= 50) {
    grade = 'C';
    color = 'text-yellow-500';
  } else if (score >= 35) {
    grade = 'D';
    color = 'text-orange-500';
  } else {
    grade = 'F';
    color = 'text-red-500';
  }

  return { score, grade, color, risks, positives };
}

export function getGradeEmoji(grade: SafetyScore['grade']): string {
  switch (grade) {
    case 'A': return '';
    case 'B': return '';
    case 'C': return '';
    case 'D': return '';
    case 'F': return '';
  }
}
