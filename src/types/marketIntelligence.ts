export interface EngineOutput {
  status: 'OPTIMAL' | 'WARN' | 'CRITICAL' | 'STABLE' | 'STANDBY';
  confidence: number; // 0 to 100
  reason: string;
  timestamp: string;
}

export interface MarketStructureData extends EngineOutput {
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  rangeDetected: boolean;
  regime: string;
}

export interface TrendData extends EngineOutput {
  ema50: number;
  ema200: number;
  trendStrength: number; // 0 to 100
  trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'SIDEWAYS';
}

export interface VolatilityData extends EngineOutput {
  atr: number;
  spreadAnalysis: number; // in points
  volatilityScore: number; // 0 to 100
}

export interface SessionData extends EngineOutput {
  asianActive: boolean;
  londonActive: boolean;
  newYorkActive: boolean;
  sessionOverlap: boolean;
  activeSessionName: string;
}

export interface SupportResistanceData extends EngineOutput {
  supportLevels: number[];
  resistanceLevels: number[];
  nearestSupport: number;
  nearestResistance: number;
}

export interface MarketIntelligenceState {
  structure: MarketStructureData;
  trend: TrendData;
  volatility: VolatilityData;
  session: SessionData;
  supportResistance: SupportResistanceData;
}

export interface MarketDataPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  validateCredentials: (creds: Record<string, string>) => { isValid: boolean; error?: string };
  fetchLatestState: (creds: Record<string, string>) => Promise<Partial<MarketIntelligenceState>>;
}
