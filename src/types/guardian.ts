export interface GuardianConfig {
  marketOpen: boolean;
  activeSession: string; // 'London', 'New York', 'Tokyo', 'Sydney', 'Off-Hours'
  spreadBps: number; // in basis points (e.g., 15)
  maxSpreadBps: number; // maximum allowed spread (e.g., 40)
  volatilityIndex: number; // 0 to 100 (e.g., 45)
  maxVolatilityIndex: number; // max allowed volatility (e.g., 85)
  minConfidenceScore: number; // 0 to 100 (e.g., 70)
  riskRewardRatio: number; // e.g. 2.5
  minRiskRewardRatio: number; // e.g. 2.0
  dailyLoss: number; // current loss (e.g., 120)
  maxDailyLossLimit: number; // maximum allowed loss (e.g., 500)
  currentOpenTrades: number; // e.g. 1
  maxOpenTradesLimit: number; // maximum allowed trades (e.g., 3)
  tradeRiskPercent: number; // risk per trade (e.g., 1.5%)
  maxRiskPercentLimit: number; // max risk allowed per trade (e.g., 2.0%)
  accountEquityCushion: number; // remaining cushion % (e.g., 95%)
  minAccountEquityCushion: number; // protective margin % (e.g., 85%)
  emergencyKillSwitch: boolean; // active = blocked
}

export interface VerificationCheck {
  id: string;
  name: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  value: string | number;
  limit: string | number;
  explanation: string;
}

export interface GuardianEvaluation {
  status: 'APPROVED' | 'WARNING' | 'BLOCKED';
  overallReason: string;
  canTrade: boolean;
  verifications: VerificationCheck[];
  timestamp: string;
}
