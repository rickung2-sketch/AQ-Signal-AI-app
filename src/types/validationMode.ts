export type RecommendationType = 'BUY' | 'SELL' | 'NO_TRADE';
export type RecommendationStatus = 'TRACKING' | 'HIT_TP' | 'HIT_SL' | 'COMPLETED_NO_TRADE';

export interface RecommendationIndicators {
  ema200: number;
  ema50: number;
  rsi: number;
  atr: number;
}

export interface RecommendationMarketStructure {
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  regime: string;
}

export interface RecommendationGuardianResult {
  verdict: string;
  riskScore: number;
  blockedReasons: string[];
}

export interface Recommendation {
  id: string;
  timestamp: string; // Time
  ticker: string;
  recommendationType: RecommendationType; // Decision
  rankingLevel: 'Elite' | 'Good' | 'Watch' | 'No Trade';
  entryPrice: number; // Market Price
  currentPrice: number;
  tpPrice: number; // Take Profit
  slPrice: number; // Stop Loss
  status: RecommendationStatus;
  mfe: number; // Maximum Favorable Excursion in %
  mae: number; // Maximum Adverse Excursion in %
  pnlPercent: number; // Current/final P&L in %
  rAchieved: number; // Risk-to-reward achieved (e.g., +2.5, -1.0)
  timeToOutcomeSeconds: number;
  maxExcursionValue: number; // highest price reached for buy, lowest for sell
  minExcursionValue: number; // lowest price reached for buy, highest for sell
  ticks: number[]; // Price series tracking
  overallScore: number;
  
  // v7.2 Enhanced properties
  indicators: RecommendationIndicators;
  marketStructure: RecommendationMarketStructure;
  session: 'Asian' | 'London' | 'New York' | 'Unknown';
  guardianResult: RecommendationGuardianResult;
  confidence: number;
  risk: number; // risk score / percentage (e.g., 1.0%)

  // v7.4 Live Validation Campaign properties
  timeframe?: string; // e.g. "15m", "1H"
  trend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  support?: number;
  resistance?: number;
  breakoutStatus?: 'CONFIRMED' | 'FAILED' | 'PENDING';
  retestStatus?: 'SUCCESSFUL' | 'UNTESTED' | 'FAILED';
  candlestickConfirmation?: 'Engulfing' | 'Pin Bar' | 'Doji' | 'None';
  expectedRR?: number; // expected R:R (e.g., 2.5)
  tpHit?: boolean;
  slHit?: boolean;
  noTrigger?: boolean;
  tradeCancelled?: boolean;
}

export interface ValidationStats {
  winRate: number;
  lossRate: number;
  averageR: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number; // Real calculation based on standard deviation of returns
  averageHoldTimeSeconds: number;
  totalRecommendations: number;
  buyCount: number;
  sellCount: number;
  noTradeCount: number;
  avoidedLossesCount: number; // No trades that would have hit SL
  savedDrawdownPercent: number; // Drawdown avoided by 'No Trade' recommendation
  
  // v7.2 Enhanced stats
  averageMFE: number; // Average MFE across completed active trades
  averageMAE: number; // Average MAE across completed active trades

  // v7.4 Confidence Calibration stats
  predictionAccuracy: number;
  calibrationScore: number;
  confidenceReliability: string;
  confidenceWeight: number;
  historicalAccuracy: { id: string; ticker: string; date: string; baseConfidence: number; calibratedConfidence: number; outcome: string; solvedCalibration: number }[];

  // v7.4 Live Validation Campaign stats
  guardianAccuracy: number;
  confidenceAccuracy: number;
  decisionAccuracy: number;
}

