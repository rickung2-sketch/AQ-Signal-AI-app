export interface Strategy {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  isEnabled: boolean;
  isDefault: boolean;
  
  // Market & Timing parameters
  markets: string[];
  timeframes: ('4H' | '1H' | '15M')[];
  
  // Rule sets from Rule Engine
  entryRules: string[]; // List of rule IDs (e.g., 'rule-ema-200')
  exitRules: string[];  // List of rule IDs (e.g., 'rule-min-rr')
  
  // Risk & Sizing configurations
  riskSettings: {
    maxRiskPerTradePercent: number; // 0.1 to 10
    maxOpenPositions: number;
    dailyDrawdownCapPercent: number;
  };
  positionSizing: 'Fixed Fractional' | 'Fixed Lot Size' | 'Kelly Criterion' | 'Martingale (Pro)';
  
  // Profit & Loss thresholds
  takeProfitRules: {
    type: 'Fixed R:R' | 'ATR Multiplier' | 'S/R Level Lock' | 'Trailing Threshold';
    value: number; // e.g. 2.5 R:R
  };
  stopLossRules: {
    type: 'Hard Stop' | 'Structure Low/High' | 'ATR Based' | 'Indicator Exit';
    value: number; // e.g. 1.0% or 1.5 ATR
  };
  trailingStopRules: {
    isEnabled: boolean;
    activationThresholdRR: number; // e.g. 1.0 R:R
    stepRR: number; // e.g. 0.5 R:R
  };

  // Performance analytics (placeholders as requested)
  performance: {
    cumulativeReturnPercent: number;
    winRatePercent: number;
    totalTradesCount: number;
    profitFactor: number;
    maxDrawdownPercent: number;
  };

  // Evaluation status
  strategyHealth: 'Optimal' | 'Degraded' | 'Critical';
  strategyScore: number; // 0 to 100
}
