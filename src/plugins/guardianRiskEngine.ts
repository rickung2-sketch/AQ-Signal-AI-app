import { GuardianConfig, GuardianEvaluation, VerificationCheck } from '../types/guardian';

export const DEFAULT_GUARDIAN_CONFIG: GuardianConfig = {
  marketOpen: true,
  activeSession: 'London',
  spreadBps: 15,
  maxSpreadBps: 30,
  volatilityIndex: 45,
  maxVolatilityIndex: 80,
  minConfidenceScore: 70,
  riskRewardRatio: 2.5,
  minRiskRewardRatio: 2.0,
  dailyLoss: 120,
  maxDailyLossLimit: 500,
  currentOpenTrades: 1,
  maxOpenTradesLimit: 3,
  tradeRiskPercent: 1.5,
  maxRiskPercentLimit: 2.0,
  accountEquityCushion: 95,
  minAccountEquityCushion: 85,
  emergencyKillSwitch: false,
};

export const STORAGE_KEY_GUARDIAN = 'aq_guardian_config_v22';

export function loadGuardianConfig(): GuardianConfig {
  const saved = localStorage.getItem(STORAGE_KEY_GUARDIAN);
  if (saved) {
    try {
      return { ...DEFAULT_GUARDIAN_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      // fallback
    }
  }
  return DEFAULT_GUARDIAN_CONFIG;
}

export function saveGuardianConfig(config: GuardianConfig): void {
  localStorage.setItem(STORAGE_KEY_GUARDIAN, JSON.stringify(config));
}

/**
 * Guardian Risk Engine (V2.2)
 * Verifies 11 core systemic, mental, and capital risk parameters.
 * Produces APPROVED, WARNING, or BLOCKED output with precise diagnostic feedback.
 */
export function evaluateGuardianRisk(config: GuardianConfig): GuardianEvaluation {
  const verifications: VerificationCheck[] = [];
  const blockedReasons: string[] = [];
  const warningReasons: string[] = [];

  // 1. Emergency Kill Switch
  if (config.emergencyKillSwitch) {
    verifications.push({
      id: 'kill_switch',
      name: 'Emergency Kill Switch',
      status: 'FAILED',
      value: 'ACTIVE',
      limit: 'INACTIVE',
      explanation: 'CRITICAL SHUTDOWN: Hard manual override active. All algorithmic pipeline execution is blocked by command.'
    });
    blockedReasons.push('Emergency Kill Switch is actively deployed.');
  } else {
    verifications.push({
      id: 'kill_switch',
      name: 'Emergency Kill Switch',
      status: 'PASSED',
      value: 'OFF',
      limit: 'OFF',
      explanation: 'SECURE: No hard manual execution override is engaged.'
    });
  }

  // 2. Market Open Status
  if (!config.marketOpen) {
    verifications.push({
      id: 'market_open',
      name: 'Market Open Status',
      status: 'FAILED',
      value: 'CLOSED',
      limit: 'OPEN',
      explanation: 'BLOCKED: Target exchange is currently closed or in pre-opening clearance. Liquidations only.'
    });
    blockedReasons.push('Market is currently closed.');
  } else {
    verifications.push({
      id: 'market_open',
      name: 'Market Open Status',
      status: 'PASSED',
      value: 'OPEN',
      limit: 'OPEN',
      explanation: 'SECURE: Live feed exchange connections active.'
    });
  }

  // 3. Trading Session
  if (config.activeSession === 'Off-Hours') {
    verifications.push({
      id: 'trading_session',
      name: 'Active Session Filter',
      status: 'FAILED',
      value: config.activeSession,
      limit: 'Active Sessions Only',
      explanation: 'BLOCKED: Current timing corresponds to low-liquidity institutional bank rolls. High slippage vulnerability.'
    });
    blockedReasons.push('Trading during Off-Hours is barred.');
  } else if (config.activeSession === 'Tokyo' || config.activeSession === 'Sydney') {
    verifications.push({
      id: 'trading_session',
      name: 'Active Session Filter',
      status: 'WARNING',
      value: config.activeSession,
      limit: 'High Volume Only',
      explanation: 'WARNING: Sub-optimal Asian-Pacific session block. Expect thinner depth levels.'
    });
    warningReasons.push(`Session [${config.activeSession}] has reduced order book thickness.`);
  } else {
    verifications.push({
      id: 'trading_session',
      name: 'Active Session Filter',
      status: 'PASSED',
      value: config.activeSession,
      limit: 'Active Overlap',
      explanation: 'SECURE: Active New York/London desks are processing heavy order flow.'
    });
  }

  // 4. Spread Checks (Bps)
  if (config.spreadBps > config.maxSpreadBps) {
    verifications.push({
      id: 'spread',
      name: 'Bid-Ask Spread Margin',
      status: 'FAILED',
      value: `${config.spreadBps} bps`,
      limit: `< ${config.maxSpreadBps} bps`,
      explanation: `BLOCKED: Order book spread of ${config.spreadBps} bps exceeds maximum tolerance of ${config.maxSpreadBps} bps. toxic flow risk.`
    });
    blockedReasons.push(`Execution spread (${config.spreadBps} bps) is too wide.`);
  } else if (config.spreadBps >= config.maxSpreadBps * 0.8) {
    verifications.push({
      id: 'spread',
      name: 'Bid-Ask Spread Margin',
      status: 'WARNING',
      value: `${config.spreadBps} bps`,
      limit: `< ${config.maxSpreadBps} bps`,
      explanation: 'WARNING: Spread is swelling due to brief liquidity imbalances. Moderate slippage expected.'
    });
    warningReasons.push(`Spread (${config.spreadBps} bps) is approaching tolerance thresholds.`);
  } else {
    verifications.push({
      id: 'spread',
      name: 'Bid-Ask Spread Margin',
      status: 'PASSED',
      value: `${config.spreadBps} bps`,
      limit: `< ${config.maxSpreadBps} bps`,
      explanation: 'SECURE: Narrow execution corridor ensures minimum cost of entry.'
    });
  }

  // 5. Volatility Limits
  if (config.volatilityIndex > config.maxVolatilityIndex) {
    verifications.push({
      id: 'volatility',
      name: 'Dynamic Volatility Index',
      status: 'FAILED',
      value: `${config.volatilityIndex}/100`,
      limit: `< ${config.maxVolatilityIndex}/100`,
      explanation: `BLOCKED: High hazard volatility level (${config.volatilityIndex}/100). Flash spikes could run stop orders instantly.`
    });
    blockedReasons.push('Volatility index exceeds risk limits.');
  } else if (config.volatilityIndex >= config.maxVolatilityIndex * 0.8) {
    verifications.push({
      id: 'volatility',
      name: 'Dynamic Volatility Index',
      status: 'WARNING',
      value: `${config.volatilityIndex}/100`,
      limit: `< ${config.maxVolatilityIndex}/100`,
      explanation: 'WARNING: Elevated volatility. Wider than average stop limits are highly recommended.'
    });
    warningReasons.push('Elevated systemic volatility index.');
  } else {
    verifications.push({
      id: 'volatility',
      name: 'Dynamic Volatility Index',
      status: 'PASSED',
      value: `${config.volatilityIndex}/100`,
      limit: `< ${config.maxVolatilityIndex}/100`,
      explanation: 'SECURE: Volatility range supports high-probability structure patterns.'
    });
  }

  // 6. Confidence Score Constraints
  if (config.minConfidenceScore < 40) {
    // protect against zero or extreme low config
    verifications.push({
      id: 'confidence',
      name: 'Confidence Level Threshold',
      status: 'PASSED',
      value: `${config.minConfidenceScore}%`,
      limit: 'N/A',
      explanation: 'SECURE: Minimal threshold configured.'
    });
  } else {
    // Load calibrated confidence weight (adjusted dynamically by Version 7.5 Calibration)
    const savedWeight = typeof window !== 'undefined' ? localStorage.getItem('aq_confidence_weight_v75') : null;
    const confidenceWeight = savedWeight ? parseFloat(savedWeight) : 1.0;
    const baseConfidence = (config as any).setupConfidence || 85;
    const calibratedConfidence = Math.max(0, Math.min(100, Math.round(baseConfidence * confidenceWeight)));

    if (calibratedConfidence < config.minConfidenceScore) {
      verifications.push({
        id: 'confidence',
        name: 'Confidence Level Threshold',
        status: 'FAILED',
        value: `${calibratedConfidence}%`,
        limit: `>= ${config.minConfidenceScore}%`,
        explanation: `BLOCKED: Calibrated confidence (${calibratedConfidence}%, weight ${Math.round(confidenceWeight * 100)}% of base ${baseConfidence}%) is below the configured threshold of ${config.minConfidenceScore}%.`
      });
      blockedReasons.push('Calibrated confidence score is below safe minimum.');
    } else if (calibratedConfidence <= config.minConfidenceScore + 5) {
      verifications.push({
        id: 'confidence',
        name: 'Confidence Level Threshold',
        status: 'WARNING',
        value: `${calibratedConfidence}%`,
        limit: `>= ${config.minConfidenceScore}%`,
        explanation: `WARNING: Calibrated confidence (${calibratedConfidence}%, weight ${Math.round(confidenceWeight * 100)}% of base ${baseConfidence}%) is near the borderline threshold.`
      });
      warningReasons.push('Calibrated setup confidence is near marginal levels.');
    } else {
      verifications.push({
        id: 'confidence',
        name: 'Confidence Level Threshold',
        status: 'PASSED',
        value: `${calibratedConfidence}%`,
        limit: `>= ${config.minConfidenceScore}%`,
        explanation: `SECURE: Calibrated confidence is approved (${calibratedConfidence}%, weight ${Math.round(confidenceWeight * 100)}% of base ${baseConfidence}%).`
      });
    }
  }

  // 7. Risk-Reward Ratio
  if (config.riskRewardRatio < config.minRiskRewardRatio) {
    verifications.push({
      id: 'risk_reward',
      name: 'Asymmetric Return Profile',
      status: 'FAILED',
      value: `${config.riskRewardRatio.toFixed(1)}:1`,
      limit: `>= ${config.minRiskRewardRatio.toFixed(1)}:1`,
      explanation: `BLOCKED: Risk Reward of ${config.riskRewardRatio.toFixed(1)}:1 fails to meet the safety limit of ${config.minRiskRewardRatio.toFixed(1)}:1.`
    });
    blockedReasons.push('Setup lacks positive math expectancy (low Risk-Reward).');
  } else {
    verifications.push({
      id: 'risk_reward',
      name: 'Asymmetric Return Profile',
      status: 'PASSED',
      value: `${config.riskRewardRatio.toFixed(1)}:1`,
      limit: `>= ${config.minRiskRewardRatio.toFixed(1)}:1`,
      explanation: 'SECURE: Long-term portfolio expectancy is supported by asymmetric payout potential.'
    });
  }

  // 8. Daily Loss Limit Checks
  if (config.dailyLoss >= config.maxDailyLossLimit) {
    verifications.push({
      id: 'daily_loss',
      name: 'Intraday Drawdown Guard',
      status: 'FAILED',
      value: `$${config.dailyLoss}`,
      limit: `< $${config.maxDailyLossLimit}`,
      explanation: `BLOCKED: Daily accumulated loss ($${config.dailyLoss}) has reached the protective hard limit of $${config.maxDailyLossLimit}.`
    });
    blockedReasons.push('Intraday session loss cap has been fully breached.');
  } else if (config.dailyLoss >= config.maxDailyLossLimit * 0.8) {
    verifications.push({
      id: 'daily_loss',
      name: 'Intraday Drawdown Guard',
      status: 'WARNING',
      value: `$${config.dailyLoss}`,
      limit: `< $${config.maxDailyLossLimit}`,
      explanation: 'WARNING: Loss is nearing the daily circuit breaker. Leverage reduction recommended.'
    });
    warningReasons.push('Intraday loss has entered the warning zone (80%+ of cap).');
  } else {
    verifications.push({
      id: 'daily_loss',
      name: 'Intraday Drawdown Guard',
      status: 'PASSED',
      value: `$${config.dailyLoss}`,
      limit: `< $${config.maxDailyLossLimit}`,
      explanation: 'SECURE: Drawdown levels remain well within normal statistical noise bounds.'
    });
  }

  // 9. Maximum Open Trades
  if (config.currentOpenTrades >= config.maxOpenTradesLimit) {
    verifications.push({
      id: 'open_trades',
      name: 'Open Position Count',
      status: 'FAILED',
      value: config.currentOpenTrades,
      limit: `< ${config.maxOpenTradesLimit}`,
      explanation: `BLOCKED: Active open trades (${config.currentOpenTrades}) have reached the maximum allowed limit of ${config.maxOpenTradesLimit}.`
    });
    blockedReasons.push('Maximum concurrent position allocation reached.');
  } else if (config.currentOpenTrades === config.maxOpenTradesLimit - 1 && config.maxOpenTradesLimit > 1) {
    verifications.push({
      id: 'open_trades',
      name: 'Open Position Count',
      status: 'WARNING',
      value: config.currentOpenTrades,
      limit: `< ${config.maxOpenTradesLimit}`,
      explanation: 'WARNING: Only one free allocation slot remains. Prioritize high-grade setups only.'
    });
    warningReasons.push('Position capacity is nearing maximum density.');
  } else {
    verifications.push({
      id: 'open_trades',
      name: 'Open Position Count',
      status: 'PASSED',
      value: config.currentOpenTrades,
      limit: `< ${config.maxOpenTradesLimit}`,
      explanation: 'SECURE: Adequate margin buffer is available to absorb new open positions.'
    });
  }

  // 10. Maximum Risk %
  if (config.tradeRiskPercent > config.maxRiskPercentLimit) {
    verifications.push({
      id: 'trade_risk_pct',
      name: 'Position Sizing Margin',
      status: 'FAILED',
      value: `${config.tradeRiskPercent}%`,
      limit: `<= ${config.maxRiskPercentLimit}%`,
      explanation: `BLOCKED: Sizing model risk of ${config.tradeRiskPercent}% per trade exceeds maximum leverage threshold of ${config.maxRiskPercentLimit}%.`
    });
    blockedReasons.push('Allocated position risk per trade exceeds capital safety boundaries.');
  } else {
    verifications.push({
      id: 'trade_risk_pct',
      name: 'Position Sizing Margin',
      status: 'PASSED',
      value: `${config.tradeRiskPercent}%`,
      limit: `<= ${config.maxRiskPercentLimit}%`,
      explanation: 'SECURE: Leverage size aligns with risk-of-ruin elimination rules.'
    });
  }

  // 11. Account Protection (Equity Cushion)
  if (config.accountEquityCushion < config.minAccountEquityCushion) {
    verifications.push({
      id: 'equity_cushion',
      name: 'Account Protection Index',
      status: 'FAILED',
      value: `${config.accountEquityCushion}%`,
      limit: `>= ${config.minAccountEquityCushion}%`,
      explanation: `BLOCKED: Equity cushion of ${config.accountEquityCushion}% is below the required safety threshold of ${config.minAccountEquityCushion}%.`
    });
    blockedReasons.push('Equity cushion safety index has been breached.');
  } else if (config.accountEquityCushion <= config.minAccountEquityCushion + 5) {
    verifications.push({
      id: 'equity_cushion',
      name: 'Account Protection Index',
      status: 'WARNING',
      value: `${config.accountEquityCushion}%`,
      limit: `>= ${config.minAccountEquityCushion}%`,
      explanation: 'WARNING: Cushion level is low. High systemic correlation risk if multiple trades drop.'
    });
    warningReasons.push('Equity protective margin is near threshold levels.');
  } else {
    verifications.push({
      id: 'equity_cushion',
      name: 'Account Protection Index',
      status: 'PASSED',
      value: `${config.accountEquityCushion}%`,
      limit: `>= ${config.minAccountEquityCushion}%`,
      explanation: 'SECURE: Adequate cash reserves and unrealized equity cushions are preserved.'
    });
  }

  // Synthesize Overall Status
  let status: 'APPROVED' | 'WARNING' | 'BLOCKED' = 'APPROVED';
  let overallReason = 'All 11 premium risk safeguards passed. Order pipeline cleared for routing.';

  if (blockedReasons.length > 0) {
    status = 'BLOCKED';
    overallReason = `BLOCKED (${blockedReasons.length} breach${blockedReasons.length > 1 ? 'es' : ''}): ${blockedReasons.join(' | ')}`;
  } else if (warningReasons.length > 0) {
    status = 'WARNING';
    overallReason = `WARNING (${warningReasons.length} notice${warningReasons.length > 1 ? 's' : ''}): ${warningReasons.join(' | ')}`;
  }

  return {
    status,
    overallReason,
    canTrade: status !== 'BLOCKED',
    verifications,
    timestamp: new Date().toISOString()
  };
}
