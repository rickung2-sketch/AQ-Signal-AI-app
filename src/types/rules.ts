export type RuleResultStatus = 'PASS' | 'FAIL' | 'SKIPPED';

export interface RuleEvaluation {
  id: string;
  name: string;
  description: string;
  status: RuleResultStatus;
  explanation: string;
  isEnabled: boolean;
  category: 'TREND' | 'STRUCTURE' | 'TIMING' | 'TRIGGER' | 'RISK' | 'SAFETY';
}

export interface RuleEngineInput {
  marketPreset: 'Bullish' | 'Bearish' | 'Sideways' | 'Extreme';
  activeSession: string;
  guardianRiskScore: number; // 0 to 100
  marketHealthScore: number; // 0 to 100
  selectedDirection: 'BUY' | 'SELL';
  riskRewardRatio: number;
  setupConfidence?: number; // v7.4 Uncalibrated setup confidence
}
