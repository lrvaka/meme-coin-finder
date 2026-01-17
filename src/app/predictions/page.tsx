'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useRecentPredictions,
  useTopPerformers,
  usePredictionAnalysis,
  useAutoTracker,
  usePredictionStats,
} from '@/lib/hooks/usePredictions';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  RefreshCw,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercent, formatUsd, formatAge } from '@/lib/utils/format';

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: recentPredictions, isLoading: recentLoading } = useRecentPredictions(50);
  const { data: topPerformers, isLoading: topLoading } = useTopPerformers(10);
  const { data: analysisData, isLoading: analysisLoading } = usePredictionAnalysis();
  const { isChecking, lastCheck, checkNow } = useAutoTracker(true);
  const stats = usePredictionStats();

  const analysis = analysisData?.analysis;
  const weights = analysisData?.newWeights;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            Prediction Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track algorithm performance and learn from results
          </p>
        </div>
        <Button
          variant="outline"
          onClick={checkNow}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
          {isChecking ? 'Checking...' : 'Check Outcomes'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm">Total Tracked</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalTracked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Evaluated</span>
            </div>
            <p className="text-2xl font-bold">{stats.evaluated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Successful</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.successful}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Accuracy</span>
            </div>
            <p className={cn(
              'text-2xl font-bold',
              stats.accuracy >= 60 ? 'text-green-500' :
              stats.accuracy >= 40 ? 'text-yellow-500' :
              'text-red-500'
            )}>
              {stats.accuracy.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.needsMoreData && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Need More Data</p>
              <p className="text-sm text-muted-foreground">
                Track at least 10 predictions with 24h+ outcomes to see meaningful analysis.
                Keep browsing tokens to build your dataset.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2">
            <Clock className="h-4 w-4" />
            All Predictions
          </TabsTrigger>
          <TabsTrigger value="winners" className="gap-2">
            <Award className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-2">
            <Zap className="h-4 w-4" />
            Signal Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analysisLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : analysis && !analysis.needsMoreData ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Grade Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Grade</CardTitle>
                  <CardDescription>
                    How well each run potential grade performed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.gradePerformance)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([grade, perf]) => (
                      <div key={grade} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Grade {grade}</span>
                          <span className="text-muted-foreground">
                            {perf.count} predictions
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress
                            value={perf.successRate}
                            className={cn(
                              'flex-1 h-2',
                              perf.successRate >= 60 ? '[&>div]:bg-green-500' :
                              perf.successRate >= 40 ? '[&>div]:bg-yellow-500' :
                              '[&>div]:bg-red-500'
                            )}
                          />
                          <span className={cn(
                            'text-sm font-medium w-16 text-right',
                            perf.successRate >= 60 ? 'text-green-500' :
                            perf.successRate >= 40 ? 'text-yellow-500' :
                            'text-red-500'
                          )}>
                            {perf.successRate.toFixed(0)}%
                          </span>
                          <span className={cn(
                            'text-sm w-20 text-right',
                            perf.avgGain >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {perf.avgGain >= 0 ? '+' : ''}{perf.avgGain.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Phase Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Phase</CardTitle>
                  <CardDescription>
                    Which market phases had the best outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.phasePerformance).map(([phase, perf]) => (
                    <div key={phase} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{phase.replace('-', ' ')}</span>
                        <span className="text-muted-foreground">
                          {perf.count} predictions
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress
                          value={perf.successRate}
                          className={cn(
                            'flex-1 h-2',
                            perf.successRate >= 60 ? '[&>div]:bg-green-500' :
                            perf.successRate >= 40 ? '[&>div]:bg-yellow-500' :
                            '[&>div]:bg-red-500'
                          )}
                        />
                        <span className={cn(
                          'text-sm font-medium w-16 text-right',
                          perf.successRate >= 60 ? 'text-green-500' :
                          perf.successRate >= 40 ? 'text-yellow-500' :
                          'text-red-500'
                        )}>
                          {perf.successRate.toFixed(0)}%
                        </span>
                        <span className={cn(
                          'text-sm w-20 text-right',
                          perf.avgGain >= 0 ? 'text-green-500' : 'text-red-500'
                        )}>
                          {perf.avgGain >= 0 ? '+' : ''}{perf.avgGain.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Algorithm Weights */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Current Algorithm Weights
                  </CardTitle>
                  <CardDescription>
                    Weights are automatically adjusted based on what signals lead to successful runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {weights && Object.entries({
                      'Buy Pressure': weights.buyPressureWeight,
                      'Volume Acceleration': weights.volumeAccelerationWeight,
                      'Price Compression': weights.priceCompressionWeight,
                      'Market Cap Range': weights.marketCapRangeWeight,
                      'Token Age': weights.ageWeight,
                      'Liquidity Ratio': weights.liquidityRatioWeight,
                      'Social Presence': weights.socialPresenceWeight,
                    }).map(([name, weight]) => (
                      <div key={name} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{name}</p>
                        <p className={cn(
                          'text-lg font-bold',
                          weight > 1.1 ? 'text-green-500' :
                          weight < 0.9 ? 'text-red-500' :
                          ''
                        )}>
                          {(weight * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Building Intelligence</p>
                <p className="text-muted-foreground mt-1">
                  Browse tokens to start tracking predictions. The algorithm will learn from outcomes over time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {recentLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentPredictions && recentPredictions.length > 0 ? (
            <div className="space-y-2">
              {recentPredictions.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No Predictions Yet</p>
                <p className="text-muted-foreground mt-1">
                  Tokens with high run potential (A or B grade) will be automatically tracked.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="winners" className="space-y-4">
          {topLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : topPerformers && topPerformers.length > 0 ? (
            <div className="space-y-2">
              {topPerformers.map((prediction, index) => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No Winners Yet</p>
                <p className="text-muted-foreground mt-1">
                  Check back after predictions have had time to play out.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Signal Analysis Tab */}
        <TabsContent value="signals" className="space-y-4">
          {analysisLoading ? (
            <Skeleton className="h-64" />
          ) : analysis && !analysis.needsMoreData && Object.keys(analysis.signalPerformance).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signal Performance</CardTitle>
                <CardDescription>
                  Which signals best predicted successful runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.signalPerformance)
                    .sort(([, a], [, b]) => b.successRate - a.successRate)
                    .map(([signal, perf]) => (
                      <div key={signal} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{signal}</span>
                          <span className="text-muted-foreground">
                            {perf.count} occurrences
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress
                            value={perf.successRate}
                            className={cn(
                              'flex-1 h-2',
                              perf.successRate >= 60 ? '[&>div]:bg-green-500' :
                              perf.successRate >= 40 ? '[&>div]:bg-yellow-500' :
                              '[&>div]:bg-red-500'
                            )}
                          />
                          <span className={cn(
                            'text-sm font-medium w-20 text-right',
                            perf.successRate >= 60 ? 'text-green-500' :
                            perf.successRate >= 40 ? 'text-yellow-500' :
                            'text-red-500'
                          )}>
                            {perf.successRate.toFixed(0)}% success
                          </span>
                          <span className={cn(
                            'text-sm w-24 text-right',
                            perf.avgGain >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            avg {perf.avgGain >= 0 ? '+' : ''}{perf.avgGain.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Need More Data</p>
                <p className="text-muted-foreground mt-1">
                  Signal analysis requires at least 10 evaluated predictions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {lastCheck && (
        <p className="text-xs text-muted-foreground text-center">
          Last outcome check: {formatAge(lastCheck)} ago
        </p>
      )}
    </div>
  );
}

function PredictionCard({
  prediction,
  rank,
}: {
  prediction: Prediction;
  rank?: number;
}) {
  const latestOutcome = prediction.outcomes[prediction.outcomes.length - 1];
  const currentChange = latestOutcome?.priceChangePercent || 0;
  const maxGain = prediction.maxGainPercent || 0;

  return (
    <Link href={`/token/${prediction.tokenAddress}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {rank && (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                  rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                  rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                  rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-muted text-muted-foreground'
                )}>
                  {rank}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{prediction.tokenSymbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {prediction.runPotentialGrade}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {prediction.phase.replace('-', ' ')}
                  </Badge>
                  {prediction.isSuccess !== undefined && (
                    prediction.isSuccess ? (
                      <Badge className="bg-green-500/20 text-green-500 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Miss
                      </Badge>
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tracked {formatAge(prediction.predictedAt)} ago at {formatUsd(prediction.priceAtPrediction, 6)}
                </p>
              </div>
            </div>

            <div className="text-right">
              {prediction.outcomes.length > 0 ? (
                <>
                  <div className={cn(
                    'flex items-center justify-end gap-1 text-lg font-bold',
                    currentChange >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {currentChange >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max: <span className={cn(maxGain >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {maxGain >= 0 ? '+' : ''}{maxGain.toFixed(0)}%
                    </span>
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Pending</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface Prediction {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  predictedAt: number;
  priceAtPrediction: number;
  marketCapAtPrediction: number;
  runPotentialScore: number;
  runPotentialGrade: string;
  phase: string;
  signals: string[];
  outcomes: Array<{
    checkedAt: number;
    hoursAfterPrediction: number;
    priceChangePercent: number;
  }>;
  isSuccess?: boolean;
  maxGainPercent?: number;
  maxDrawdownPercent?: number;
}
