'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPredictions,
  getRecentPredictions,
  getTopPerformers,
  recordPrediction,
  recordOutcome,
  getPredictionsToCheck,
  analyzeAndAdjustWeights,
  getAlgorithmWeights,
  type Prediction,
  type PredictionAnalysis,
  type AlgorithmWeights,
} from '@/lib/tracking/predictions';
import { getTokenByAddress } from '@/lib/api/dexscreener';
import type { TokenPair } from '@/types/token';

/**
 * Hook to get all predictions
 */
export function usePredictions() {
  return useQuery({
    queryKey: ['predictions'],
    queryFn: getPredictions,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get recent predictions
 */
export function useRecentPredictions(limit: number = 50) {
  return useQuery({
    queryKey: ['predictions', 'recent', limit],
    queryFn: () => getRecentPredictions(limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get top performers
 */
export function useTopPerformers(limit: number = 10) {
  return useQuery({
    queryKey: ['predictions', 'top', limit],
    queryFn: () => getTopPerformers(limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get algorithm weights
 */
export function useAlgorithmWeights() {
  return useQuery({
    queryKey: ['algorithm-weights'],
    queryFn: getAlgorithmWeights,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to record a prediction
 */
export function useRecordPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      token,
      runPotentialScore,
      runPotentialGrade,
      phase,
      signals,
      safetyScore,
      socialScore,
    }: {
      token: TokenPair;
      runPotentialScore: number;
      runPotentialGrade: string;
      phase: string;
      signals: string[];
      safetyScore: number;
      socialScore: number;
    }) => {
      const prediction = recordPrediction(
        token,
        runPotentialScore,
        runPotentialGrade,
        phase,
        signals,
        safetyScore,
        socialScore
      );
      return Promise.resolve(prediction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
}

/**
 * Hook to analyze predictions and get insights
 */
export function usePredictionAnalysis() {
  return useQuery({
    queryKey: ['prediction-analysis'],
    queryFn: () => analyzeAndAdjustWeights(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook that automatically tracks high-potential tokens and checks outcomes
 */
export function useAutoTracker(enabled: boolean = true) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const checkOutcomes = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const predictionsToCheck = getPredictionsToCheck();

      for (const prediction of predictionsToCheck.slice(0, 5)) {
        // Rate limit: check max 5 at a time
        try {
          const token = await getTokenByAddress(prediction.tokenAddress);
          if (token) {
            recordOutcome(prediction.id, token);
          }
        } catch {
          // Skip failed fetches
          continue;
        }

        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setLastCheck(Date.now());
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, queryClient]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkOutcomes();

    // Check every 30 minutes
    const interval = setInterval(checkOutcomes, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, checkOutcomes]);

  return {
    isChecking,
    lastCheck,
    checkNow: checkOutcomes,
  };
}

/**
 * Hook to track a specific token when viewed
 */
export function useTrackToken(
  token: TokenPair | null | undefined,
  runPotentialScore: number,
  runPotentialGrade: string,
  phase: string,
  signals: string[],
  safetyScore: number,
  socialScore: number
) {
  const { mutate: recordPredictionMutate } = useRecordPrediction();
  const [isTracked, setIsTracked] = useState(false);

  useEffect(() => {
    // Only track tokens with high run potential (B grade or better)
    if (
      token &&
      !isTracked &&
      (runPotentialGrade === 'A' || runPotentialGrade === 'B') &&
      (phase === 'accumulation' || phase === 'early-momentum')
    ) {
      recordPredictionMutate({
        token,
        runPotentialScore,
        runPotentialGrade,
        phase,
        signals,
        safetyScore,
        socialScore,
      });
      setIsTracked(true);
    }
  }, [
    token,
    runPotentialScore,
    runPotentialGrade,
    phase,
    signals,
    safetyScore,
    socialScore,
    isTracked,
    recordPredictionMutate,
  ]);

  return isTracked;
}

/**
 * Get prediction stats summary
 */
export function usePredictionStats() {
  const { data: analysis } = usePredictionAnalysis();
  const { data: weights } = useAlgorithmWeights();

  return {
    totalTracked: analysis?.analysis.totalPredictions || 0,
    evaluated: analysis?.analysis.evaluatedPredictions || 0,
    successful: analysis?.analysis.successfulPredictions || 0,
    accuracy: analysis?.analysis.accuracy || 0,
    avgGain: analysis?.analysis.avgMaxGain || 0,
    needsMoreData: analysis?.analysis.needsMoreData ?? true,
    weights,
  };
}
