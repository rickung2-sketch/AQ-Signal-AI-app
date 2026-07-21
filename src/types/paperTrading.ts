export type PaperTradeStatus = 'OPEN' | 'CLOSED';
export type PaperExitReason = 'HIT_TP' | 'HIT_SL' | 'MANUAL' | 'FORCE_CLOSE';

export interface PaperTrade {
  id: string;
  ticker: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number; // e.g. 1.5 for 1.5%
  positionSize: number;
  entryTime: string;
  exitTime?: string;
  exitReason?: PaperExitReason;
  tradeDuration?: number; // duration in seconds
  maxFavorableExcursion: number; // max favorable price deviation (positive deviation)
  maxAdverseExcursion: number; // max adverse price deviation (negative deviation)
  profitAndLoss: number; // net P/L in currency
  rMultiple: number; // Profit relative to original risk amount
  leverage: number;
  status: PaperTradeStatus;
  pipelineContext?: any; // To store pipeline state at entry
}

export interface PaperTradingSettings {
  commission: number; // fixed dollar cost per trade, e.g. 5.00
  slippage: number; // percentage slippage per trade, e.g. 0.05%
  spreadBps: number; // average spread in basis points, e.g. 10
  minConfidence: number; // minimum confidence threshold for auto-execution, e.g. 70
  riskPerTradePercent: number; // default risk % per trade, e.g. 1.5
  leverage: number; // default leverage, e.g. 10
}

export interface PaperTradingAccount {
  balance: number;
  equity: number;
  margin: number;
  positions: PaperTrade[];
  history: PaperTrade[];
  settings: PaperTradingSettings;
}

export interface JournalEntry {
  id: string; // Journal Entry ID (usually JRN-XXXX)
  tradeId: string; // Linked PaperTrade ID
  ticker: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  profitAndLoss: number;
  rMultiple: number;
  exitReason: string;
  confidence: number;
  screenshotSeed: string; // Seed or indicator code for mockup screenshot chart
  entryReasoning: string;
  guardianReasoning: string;
  aiDebateSummary: string;
  passedRules: { id: string; name: string; explanation: string }[];
  failedRules: { id: string; name: string; explanation: string }[];
  marketHealth: {
    volatility: number;
    liquidity: number;
    sentiment: number;
    healthScore: number;
  };
  readinessScore: number;
  lessonsLearned: string;
}

