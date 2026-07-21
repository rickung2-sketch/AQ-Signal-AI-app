export interface TradeLog {
  id: string;
  timestamp: string;
  ticker: string;
  direction: 'BUY' | 'SELL';
  size: number;
  leverage: number;
  entryPrice: number;
  exitPrice?: number;
  conviction: number; // 1 to 5
  status: 'OPEN' | 'WIN' | 'LOSS';
  notes: string;
  guardianRiskScore: number; // 0 to 100
  guardianFeedback: string;
}

export interface PlaybookItem {
  id: string;
  title: string;
  category: 'Bullish Setup' | 'Bearish Setup' | 'Risk Protocol' | 'Trading Psychology';
  description: string;
  rules: string[];
}

export interface AQPlugin {
  id: string;
  name: string;
  category: 'Scanner' | 'Analytics' | 'Execution' | 'Risk';
  description: string;
  isActive: boolean;
  version: string;
  author: string;
  performanceScore: number; // 0-100
}

export interface MarketMetrics {
  volatility: number; // 0-100
  liquidity: number; // 0-100
  sentiment: number; // 0-100 (bearish to bullish)
  volumeTrend: 'ASCENDING' | 'DESCENDING' | 'FLAT';
  healthScore: number; // 0-100
}

export interface ReadinessMetrics {
  marketFit: number; // 0-100
  emotionalBalance: number; // 0-100
  riskCompliance: number; // 0-100
  overallScore: number; // 0-100
}
