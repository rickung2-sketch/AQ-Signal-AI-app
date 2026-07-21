export type MarketScannerEventType =
  | 'Trend Change'
  | 'EMA Cross'
  | 'Breakout'
  | 'Retest'
  | 'Bullish Engulfing'
  | 'Bearish Engulfing'
  | 'Support Test'
  | 'Resistance Test'
  | 'Session Change'
  | 'Guardian Status';

export type ScannerPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScannerEvent {
  id: string;
  type: MarketScannerEventType;
  ticker: string;
  priority: ScannerPriority;
  confidence: number; // 0 to 100
  timestamp: string;
  reason: string;
  price: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  // Opportunity Ranking Engine Score metrics
  overallScore: number;
  trendScore: number;
  structureScore: number;
  confirmationScore: number;
  riskScore: number;
  guardianScore: number;
  marketHealthScore: number;
  readinessScore: number;
  rankingLevel: 'Elite' | 'Good' | 'Watch' | 'No Trade';
}

export interface ScannerFilter {
  type: MarketScannerEventType | 'ALL';
  priority: ScannerPriority | 'ALL';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'ALL';
  ticker: string; // empty means all
}
