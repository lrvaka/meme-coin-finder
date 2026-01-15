'use client';

import type { TokenPair } from '@/types/token';

export interface RunPotentialScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  signals: string[];
  warnings: string[];
  phase: 'accumulation' | 'early-momentum' | 'breakout' | 'already-ran' | 'declining' | 'unknown';
}

/**
 * Calculates "Run Potential" - likelihood a coin is primed to pump
 * rather than having already completed its run.
 *
 * Key principles:
 * 1. Look for accumulation (buys > sells, volume building, price stable)
 * 2. Avoid coins that already pumped (huge price gains, declining volume)
 * 3. Find early momentum (volume accelerating, slight price uptick)
 * 4. Prefer good liquidity-to-mcap ratio (room to grow)
 */
export function calculateRunPotential(token: TokenPair): RunPotentialScore {
  let score = 50;
  const signals: string[] = [];
  const warnings: string[] = [];

  const priceChange5m = token.priceChange?.m5 || 0;
  const priceChange1h = token.priceChange?.h1 || 0;
  const priceChange6h = token.priceChange?.h6 || 0;
  const priceChange24h = token.priceChange?.h24 || 0;

  const volume24h = token.volume?.h24 || 0;
  const liquidity = token.liquidity?.usd || 0;
  const marketCap = token.marketCap || 0;

  const buys24h = token.txns?.h24?.buys || 0;
  const sells24h = token.txns?.h24?.sells || 0;
  const totalTxns = buys24h + sells24h;
  const buyRatio = totalTxns > 0 ? buys24h / totalTxns : 0.5;

  const buys1h = token.txns?.h1?.buys || 0;
  const sells1h = token.txns?.h1?.sells || 0;
  const totalTxns1h = buys1h + sells1h;
  const buyRatio1h = totalTxns1h > 0 ? buys1h / totalTxns1h : 0.5;

  const buys5m = token.txns?.m5?.buys || 0;
  const sells5m = token.txns?.m5?.sells || 0;
  const totalTxns5m = buys5m + sells5m;

  const ageHours = token.pairCreatedAt
    ? (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
    : 999;

  // ============================================
  // PENALTY: Already pumped (major red flags)
  // ============================================

  // Huge 24h gain = already ran
  if (priceChange24h > 500) {
    score -= 30;
    warnings.push(`Already up ${priceChange24h.toFixed(0)}% in 24h - likely topped`);
  } else if (priceChange24h > 200) {
    score -= 20;
    warnings.push(`Up ${priceChange24h.toFixed(0)}% in 24h - may have already ran`);
  } else if (priceChange24h > 100) {
    score -= 10;
    warnings.push(`Up ${priceChange24h.toFixed(0)}% in 24h - monitor for pullback`);
  }

  // Price declining from recent high (dumping)
  if (priceChange1h < -10 && priceChange24h > 50) {
    score -= 15;
    warnings.push('Price dropping after pump - distribution phase');
  }

  // More sells than buys recently = distribution
  if (buyRatio1h < 0.35) {
    score -= 15;
    warnings.push('Heavy selling pressure in last hour');
  } else if (buyRatio1h < 0.45) {
    score -= 8;
    warnings.push('More sells than buys recently');
  }

  // Very high market cap = less room to run
  if (marketCap > 100_000_000) {
    score -= 20;
    warnings.push('High market cap ($100M+) - limited upside');
  } else if (marketCap > 50_000_000) {
    score -= 10;
    warnings.push('Medium-high market cap ($50M+)');
  }

  // ============================================
  // BONUS: Accumulation signals
  // ============================================

  // Strong buy pressure = accumulation
  if (buyRatio > 0.65) {
    score += 15;
    signals.push(`Strong accumulation (${(buyRatio * 100).toFixed(0)}% buys)`);
  } else if (buyRatio > 0.55) {
    score += 8;
    signals.push(`Healthy buy pressure (${(buyRatio * 100).toFixed(0)}% buys)`);
  }

  // Recent buy acceleration (1h buy ratio > 24h)
  if (buyRatio1h > buyRatio + 0.1 && buyRatio1h > 0.55) {
    score += 10;
    signals.push('Buy pressure accelerating');
  }

  // Volume without massive price move = accumulation
  const volumeToMcap = marketCap > 0 ? volume24h / marketCap : 0;
  if (volumeToMcap > 0.3 && priceChange24h < 50 && priceChange24h > -20) {
    score += 12;
    signals.push('High volume with stable price - accumulation phase');
  }

  // Good liquidity ratio (healthy, not overleveraged)
  const mcapToLiq = liquidity > 0 ? marketCap / liquidity : 999;
  if (mcapToLiq >= 3 && mcapToLiq <= 15) {
    score += 10;
    signals.push('Healthy MC/Liquidity ratio');
  } else if (mcapToLiq > 50) {
    score -= 10;
    warnings.push('Low liquidity relative to market cap');
  }

  // ============================================
  // BONUS: Early momentum signals
  // ============================================

  // Slight uptrend without explosion (coiling)
  if (priceChange24h > 10 && priceChange24h < 80) {
    score += 8;
    signals.push('Moderate gains - room to run');
  }

  // Recent momentum pickup (5m or 1h positive, accelerating)
  if (priceChange5m > 2 && priceChange5m < 20 && priceChange1h > 0 && priceChange1h < 50) {
    score += 10;
    signals.push('Fresh momentum building');
  }

  // Increasing transaction count (activity picking up)
  if (totalTxns5m > 10 && totalTxns1h > 50) {
    score += 8;
    signals.push('Transaction activity increasing');
  }

  // Volume spike starting (early signal)
  if (volume24h > liquidity * 2 && priceChange24h < 100) {
    score += 10;
    signals.push('Volume spike with price lagging - potential breakout');
  }

  // ============================================
  // BONUS: Sweet spot metrics
  // ============================================

  // Ideal market cap range (small enough to run, not micro)
  if (marketCap >= 500_000 && marketCap <= 10_000_000) {
    score += 12;
    signals.push('Sweet spot market cap ($500K-$10M)');
  } else if (marketCap >= 100_000 && marketCap < 500_000) {
    score += 5;
    signals.push('Micro cap - high risk/reward');
  }

  // Ideal age (established but not stale)
  if (ageHours >= 12 && ageHours <= 72) {
    score += 8;
    signals.push('Ideal age (12-72 hours) - past initial dump risk');
  } else if (ageHours < 6) {
    score -= 5;
    warnings.push('Very new - high rug risk');
  } else if (ageHours > 168) {
    score -= 5;
    warnings.push('Older token - may need catalyst');
  }

  // Good liquidity floor
  if (liquidity >= 50_000 && liquidity <= 500_000) {
    score += 8;
    signals.push('Solid liquidity base');
  } else if (liquidity < 10_000) {
    score -= 10;
    warnings.push('Very low liquidity - high slippage risk');
  }

  // Has social presence (from token info)
  const hasSocials = token.info?.socials && token.info.socials.length > 0;
  const hasWebsite = token.info?.websites && token.info.websites.length > 0;
  if (hasSocials && hasWebsite) {
    score += 5;
    signals.push('Has social presence');
  }

  // ============================================
  // Determine phase
  // ============================================
  let phase: RunPotentialScore['phase'] = 'unknown';

  if (priceChange24h > 200 || (priceChange24h > 100 && buyRatio1h < 0.4)) {
    phase = 'already-ran';
  } else if (priceChange1h < -15 && priceChange24h > 30) {
    phase = 'declining';
  } else if (priceChange5m > 5 && priceChange1h > 10 && buyRatio1h > 0.55) {
    phase = 'breakout';
  } else if (priceChange24h > 20 && priceChange24h < 100 && buyRatio > 0.5) {
    phase = 'early-momentum';
  } else if (volumeToMcap > 0.2 && Math.abs(priceChange24h) < 30 && buyRatio > 0.5) {
    phase = 'accumulation';
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Grade
  let grade: RunPotentialScore['grade'];
  let color: string;
  if (score >= 75) {
    grade = 'A';
    color = 'text-green-400';
  } else if (score >= 60) {
    grade = 'B';
    color = 'text-lime-400';
  } else if (score >= 45) {
    grade = 'C';
    color = 'text-yellow-400';
  } else if (score >= 30) {
    grade = 'D';
    color = 'text-orange-400';
  } else {
    grade = 'F';
    color = 'text-red-400';
  }

  return { score, grade, color, signals, warnings, phase };
}

/**
 * Sort tokens by run potential, prioritizing accumulation and early-momentum phases
 */
export function sortByRunPotential(tokens: TokenPair[]): TokenPair[] {
  return [...tokens].sort((a, b) => {
    const aScore = calculateRunPotential(a);
    const bScore = calculateRunPotential(b);

    // Prioritize phases
    const phaseOrder = {
      'accumulation': 0,
      'early-momentum': 1,
      'breakout': 2,
      'unknown': 3,
      'declining': 4,
      'already-ran': 5,
    };

    const phaseDiff = phaseOrder[aScore.phase] - phaseOrder[bScore.phase];
    if (phaseDiff !== 0) return phaseDiff;

    return bScore.score - aScore.score;
  });
}
