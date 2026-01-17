'use client';

import type { TokenPair } from '@/types/token';

export interface Prediction {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;

  // State at prediction time
  predictedAt: number;
  priceAtPrediction: number;
  marketCapAtPrediction: number;
  liquidityAtPrediction: number;
  volumeAtPrediction: number;

  // Scores at prediction time
  runPotentialScore: number;
  runPotentialGrade: string;
  phase: string;
  safetyScore: number;
  socialScore: number;

  // Signals that triggered the prediction
  signals: string[];

  // Outcome tracking
  outcomes: PredictionOutcome[];

  // Final evaluation
  isSuccess?: boolean;
  maxGainPercent?: number;
  maxDrawdownPercent?: number;
}

export interface PredictionOutcome {
  checkedAt: number;
  hoursAfterPrediction: number;
  price: number;
  priceChangePercent: number;
  marketCap: number;
  volume24h: number;
}

export interface AlgorithmWeights {
  // Run Potential weights
  buyPressureWeight: number;
  volumeAccelerationWeight: number;
  priceCompressionWeight: number;
  marketCapRangeWeight: number;
  ageWeight: number;
  liquidityRatioWeight: number;
  socialPresenceWeight: number;

  // Thresholds
  alreadyRanThreshold: number; // % gain that means "already ran"
  successThreshold: number; // % gain to consider prediction successful

  // Last updated
  updatedAt: number;
  totalPredictions: number;
  successfulPredictions: number;
  accuracy: number;
}

const STORAGE_KEY = 'meme-finder-predictions';
const WEIGHTS_KEY = 'meme-finder-algorithm-weights';

// Default weights (starting point)
const DEFAULT_WEIGHTS: AlgorithmWeights = {
  buyPressureWeight: 1.0,
  volumeAccelerationWeight: 1.0,
  priceCompressionWeight: 1.0,
  marketCapRangeWeight: 1.0,
  ageWeight: 1.0,
  liquidityRatioWeight: 1.0,
  socialPresenceWeight: 1.0,
  alreadyRanThreshold: 200, // 200% = 3x
  successThreshold: 50, // 50% gain = success
  updatedAt: Date.now(),
  totalPredictions: 0,
  successfulPredictions: 0,
  accuracy: 0,
};

/**
 * Get all stored predictions
 */
export function getPredictions(): Prediction[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save predictions to storage
 */
function savePredictions(predictions: Prediction[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Keep only last 500 predictions to prevent storage bloat
    const trimmed = predictions.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save predictions:', error);
  }
}

/**
 * Record a new prediction
 */
export function recordPrediction(
  token: TokenPair,
  runPotentialScore: number,
  runPotentialGrade: string,
  phase: string,
  signals: string[],
  safetyScore: number,
  socialScore: number
): Prediction {
  const prediction: Prediction = {
    id: `${token.baseToken.address}-${Date.now()}`,
    tokenAddress: token.baseToken.address,
    tokenSymbol: token.baseToken.symbol,
    tokenName: token.baseToken.name,
    predictedAt: Date.now(),
    priceAtPrediction: parseFloat(token.priceUsd),
    marketCapAtPrediction: token.marketCap || 0,
    liquidityAtPrediction: token.liquidity?.usd || 0,
    volumeAtPrediction: token.volume?.h24 || 0,
    runPotentialScore,
    runPotentialGrade,
    phase,
    safetyScore,
    socialScore,
    signals,
    outcomes: [],
  };

  const predictions = getPredictions();

  // Check if we already have a recent prediction for this token (within 6 hours)
  const existingIndex = predictions.findIndex(
    p => p.tokenAddress === token.baseToken.address &&
         Date.now() - p.predictedAt < 6 * 60 * 60 * 1000
  );

  if (existingIndex >= 0) {
    // Update existing prediction
    predictions[existingIndex] = prediction;
  } else {
    predictions.push(prediction);
  }

  savePredictions(predictions);
  return prediction;
}

/**
 * Record an outcome check for a prediction
 */
export function recordOutcome(
  predictionId: string,
  currentToken: TokenPair
): PredictionOutcome | null {
  const predictions = getPredictions();
  const predictionIndex = predictions.findIndex(p => p.id === predictionId);

  if (predictionIndex < 0) return null;

  const prediction = predictions[predictionIndex];
  const currentPrice = parseFloat(currentToken.priceUsd);
  const priceChangePercent = ((currentPrice - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100;
  const hoursAfterPrediction = (Date.now() - prediction.predictedAt) / (1000 * 60 * 60);

  const outcome: PredictionOutcome = {
    checkedAt: Date.now(),
    hoursAfterPrediction,
    price: currentPrice,
    priceChangePercent,
    marketCap: currentToken.marketCap || 0,
    volume24h: currentToken.volume?.h24 || 0,
  };

  prediction.outcomes.push(outcome);

  // Update max gain/drawdown
  const allPriceChanges = prediction.outcomes.map(o => o.priceChangePercent);
  prediction.maxGainPercent = Math.max(...allPriceChanges, 0);
  prediction.maxDrawdownPercent = Math.min(...allPriceChanges, 0);

  // Evaluate success after 24+ hours
  if (hoursAfterPrediction >= 24 && prediction.isSuccess === undefined) {
    const weights = getAlgorithmWeights();
    prediction.isSuccess = prediction.maxGainPercent >= weights.successThreshold;
  }

  predictions[predictionIndex] = prediction;
  savePredictions(predictions);

  return outcome;
}

/**
 * Get predictions that need outcome checking
 */
export function getPredictionsToCheck(): Prediction[] {
  const predictions = getPredictions();
  const now = Date.now();

  // Check intervals: 1h, 6h, 24h, 48h, 7d
  const checkIntervals = [1, 6, 24, 48, 168]; // hours

  return predictions.filter(p => {
    // Don't check predictions older than 7 days
    const ageHours = (now - p.predictedAt) / (1000 * 60 * 60);
    if (ageHours > 168) return false;

    // Find which interval we should be at
    const lastCheck = p.outcomes.length > 0
      ? p.outcomes[p.outcomes.length - 1].checkedAt
      : p.predictedAt;
    const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);

    // Check if any interval has been missed
    for (const interval of checkIntervals) {
      if (ageHours >= interval) {
        const hasCheckAtInterval = p.outcomes.some(
          o => Math.abs(o.hoursAfterPrediction - interval) < 0.5
        );
        if (!hasCheckAtInterval && hoursSinceLastCheck >= 1) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Get algorithm weights
 */
export function getAlgorithmWeights(): AlgorithmWeights {
  if (typeof window === 'undefined') return DEFAULT_WEIGHTS;

  try {
    const stored = localStorage.getItem(WEIGHTS_KEY);
    return stored ? { ...DEFAULT_WEIGHTS, ...JSON.parse(stored) } : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Save algorithm weights
 */
export function saveAlgorithmWeights(weights: AlgorithmWeights): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  } catch (error) {
    console.error('Failed to save weights:', error);
  }
}

/**
 * Analyze prediction performance and calculate new weights
 */
export function analyzeAndAdjustWeights(): {
  analysis: PredictionAnalysis;
  newWeights: AlgorithmWeights;
} {
  const predictions = getPredictions();
  const weights = getAlgorithmWeights();

  // Filter to evaluated predictions (with outcomes after 24h)
  const evaluatedPredictions = predictions.filter(
    p => p.outcomes.some(o => o.hoursAfterPrediction >= 24)
  );

  if (evaluatedPredictions.length < 10) {
    return {
      analysis: {
        totalPredictions: predictions.length,
        evaluatedPredictions: evaluatedPredictions.length,
        successfulPredictions: 0,
        accuracy: 0,
        avgGain: 0,
        avgMaxGain: 0,
        avgMaxDrawdown: 0,
        signalPerformance: {},
        phasePerformance: {},
        gradePerformance: {},
        needsMoreData: true,
      },
      newWeights: weights,
    };
  }

  // Calculate success metrics
  const successfulPredictions = evaluatedPredictions.filter(p => p.isSuccess);
  const accuracy = (successfulPredictions.length / evaluatedPredictions.length) * 100;

  // Calculate average gains
  const avgMaxGain = evaluatedPredictions.reduce((sum, p) => sum + (p.maxGainPercent || 0), 0) / evaluatedPredictions.length;
  const avgMaxDrawdown = evaluatedPredictions.reduce((sum, p) => sum + (p.maxDrawdownPercent || 0), 0) / evaluatedPredictions.length;

  // Analyze signal performance
  const signalPerformance: Record<string, { count: number; successRate: number; avgGain: number }> = {};

  for (const p of evaluatedPredictions) {
    for (const signal of p.signals) {
      if (!signalPerformance[signal]) {
        signalPerformance[signal] = { count: 0, successRate: 0, avgGain: 0 };
      }
      signalPerformance[signal].count++;
      if (p.isSuccess) {
        signalPerformance[signal].successRate++;
      }
      signalPerformance[signal].avgGain += p.maxGainPercent || 0;
    }
  }

  // Convert to rates
  for (const signal of Object.keys(signalPerformance)) {
    const s = signalPerformance[signal];
    s.successRate = (s.successRate / s.count) * 100;
    s.avgGain = s.avgGain / s.count;
  }

  // Analyze phase performance
  const phasePerformance: Record<string, { count: number; successRate: number; avgGain: number }> = {};

  for (const p of evaluatedPredictions) {
    if (!phasePerformance[p.phase]) {
      phasePerformance[p.phase] = { count: 0, successRate: 0, avgGain: 0 };
    }
    phasePerformance[p.phase].count++;
    if (p.isSuccess) {
      phasePerformance[p.phase].successRate++;
    }
    phasePerformance[p.phase].avgGain += p.maxGainPercent || 0;
  }

  for (const phase of Object.keys(phasePerformance)) {
    const ph = phasePerformance[phase];
    ph.successRate = (ph.successRate / ph.count) * 100;
    ph.avgGain = ph.avgGain / ph.count;
  }

  // Analyze grade performance
  const gradePerformance: Record<string, { count: number; successRate: number; avgGain: number }> = {};

  for (const p of evaluatedPredictions) {
    if (!gradePerformance[p.runPotentialGrade]) {
      gradePerformance[p.runPotentialGrade] = { count: 0, successRate: 0, avgGain: 0 };
    }
    gradePerformance[p.runPotentialGrade].count++;
    if (p.isSuccess) {
      gradePerformance[p.runPotentialGrade].successRate++;
    }
    gradePerformance[p.runPotentialGrade].avgGain += p.maxGainPercent || 0;
  }

  for (const grade of Object.keys(gradePerformance)) {
    const g = gradePerformance[grade];
    g.successRate = (g.successRate / g.count) * 100;
    g.avgGain = g.avgGain / g.count;
  }

  // Calculate new weights based on signal performance
  const newWeights = { ...weights };

  // Adjust weights based on which signals performed best
  const signalToWeight: Record<string, keyof AlgorithmWeights> = {
    'Strong accumulation': 'buyPressureWeight',
    'Healthy buy pressure': 'buyPressureWeight',
    'Buy pressure accelerating': 'volumeAccelerationWeight',
    'High volume with stable price': 'priceCompressionWeight',
    'Volume spike with price lagging': 'priceCompressionWeight',
    'Sweet spot market cap': 'marketCapRangeWeight',
    'Ideal age': 'ageWeight',
    'Healthy MC/Liquidity ratio': 'liquidityRatioWeight',
    'Has social presence': 'socialPresenceWeight',
  };

  for (const [signal, performance] of Object.entries(signalPerformance)) {
    const weightKey = signalToWeight[signal];
    if (weightKey && performance.count >= 5) {
      // Adjust weight based on success rate vs overall accuracy
      const relativePerformance = performance.successRate / (accuracy || 1);

      // Gradual adjustment: move 10% toward the relative performance
      const currentWeight = newWeights[weightKey] as number;
      const adjustment = (relativePerformance - 1) * 0.1;
      newWeights[weightKey] = Math.max(0.5, Math.min(2.0, currentWeight + adjustment)) as never;
    }
  }

  // Update stats
  newWeights.updatedAt = Date.now();
  newWeights.totalPredictions = evaluatedPredictions.length;
  newWeights.successfulPredictions = successfulPredictions.length;
  newWeights.accuracy = accuracy;

  // Save new weights
  saveAlgorithmWeights(newWeights);

  const analysis: PredictionAnalysis = {
    totalPredictions: predictions.length,
    evaluatedPredictions: evaluatedPredictions.length,
    successfulPredictions: successfulPredictions.length,
    accuracy,
    avgGain: evaluatedPredictions.reduce((sum, p) => {
      const finalOutcome = p.outcomes.find(o => o.hoursAfterPrediction >= 24);
      return sum + (finalOutcome?.priceChangePercent || 0);
    }, 0) / evaluatedPredictions.length,
    avgMaxGain,
    avgMaxDrawdown,
    signalPerformance,
    phasePerformance,
    gradePerformance,
    needsMoreData: false,
  };

  return { analysis, newWeights };
}

export interface PredictionAnalysis {
  totalPredictions: number;
  evaluatedPredictions: number;
  successfulPredictions: number;
  accuracy: number;
  avgGain: number;
  avgMaxGain: number;
  avgMaxDrawdown: number;
  signalPerformance: Record<string, { count: number; successRate: number; avgGain: number }>;
  phasePerformance: Record<string, { count: number; successRate: number; avgGain: number }>;
  gradePerformance: Record<string, { count: number; successRate: number; avgGain: number }>;
  needsMoreData: boolean;
}

/**
 * Get recent predictions for display
 */
export function getRecentPredictions(limit: number = 50): Prediction[] {
  const predictions = getPredictions();
  return predictions
    .sort((a, b) => b.predictedAt - a.predictedAt)
    .slice(0, limit);
}

/**
 * Get top performing predictions
 */
export function getTopPerformers(limit: number = 10): Prediction[] {
  const predictions = getPredictions();
  return predictions
    .filter(p => p.maxGainPercent !== undefined)
    .sort((a, b) => (b.maxGainPercent || 0) - (a.maxGainPercent || 0))
    .slice(0, limit);
}

/**
 * Clear all predictions (for testing)
 */
export function clearPredictions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Reset weights to defaults
 */
export function resetWeights(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WEIGHTS_KEY);
}
