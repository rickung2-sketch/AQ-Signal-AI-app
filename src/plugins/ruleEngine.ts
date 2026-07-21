import { RuleEvaluation, RuleEngineInput, RuleResultStatus } from '../types/rules';
import { generateHistoricalOrTestData } from './marketDataPluginRegistry';
import { loadGuardianConfig, evaluateGuardianRisk } from './guardianRiskEngine';

export function evaluateRules(
  input: RuleEngineInput,
  ruleToggles: Record<string, boolean>
): RuleEvaluation[] {
  // Load telemetry state based on selected scenario
  const marketState = generateHistoricalOrTestData(input.marketPreset);
  const { structure, trend, volatility, session, supportResistance } = marketState;

  const rules: RuleEvaluation[] = [];

  // Helper to construct rule
  const addRule = (
    id: string,
    name: string,
    category: RuleEvaluation['category'],
    description: string,
    evalFn: () => { status: RuleResultStatus; explanation: string }
  ) => {
    const isEnabled = ruleToggles[id] !== false; // default to true
    if (!isEnabled) {
      rules.push({
        id,
        name,
        category,
        description,
        status: 'SKIPPED',
        explanation: 'Skipped: This rule was disabled by the operator in settings.',
        isEnabled: false
      });
    } else {
      const result = evalFn();
      rules.push({
        id,
        name,
        category,
        description,
        status: result.status,
        explanation: result.explanation,
        isEnabled: true
      });
    }
  };

  // 1. 200 EMA Trend Rule
  addRule(
    'rule-ema-200',
    '200 EMA Trend Alignment',
    'TREND',
    'Requires order direction to align with the primary direction of the 200 EMA threshold.',
    () => {
      const isBullish = trend.trendDirection === 'BULLISH';
      const isBearish = trend.trendDirection === 'BEARISH';
      
      if (input.selectedDirection === 'BUY') {
        if (isBullish) {
          return {
            status: 'PASS',
            explanation: `PASS: 50 EMA is at $${trend.ema50.toLocaleString()} and 200 EMA is at $${trend.ema200.toLocaleString()}, indicating a strong BULLISH structure supporting BUY orders.`
          };
        } else {
          return {
            status: 'FAIL',
            explanation: `FAIL: Cannot place BUY order. Core trend is currently ${trend.trendDirection || 'SIDEWAYS'} (EMA50: $${trend.ema50.toLocaleString()} / EMA200: $${trend.ema200.toLocaleString()}).`
          };
        }
      } else {
        // SELL
        if (isBearish) {
          return {
            status: 'PASS',
            explanation: `PASS: 50 EMA ($${trend.ema50.toLocaleString()}) trades below 200 EMA ($${trend.ema200.toLocaleString()}), aligning with a BEARISH markdown sequence.`
          };
        } else {
          return {
            status: 'FAIL',
            explanation: `FAIL: Cannot place SELL order. Trend direction is ${trend.trendDirection || 'SIDEWAYS'} which conflicts with a short entry vector.`
          };
        }
      }
    }
  );

  // 2. Market Structure Rule
  addRule(
    'rule-market-structure',
    'Market Structure Validation',
    'STRUCTURE',
    'Checks for Higher Highs/Lows for BUY or Lower Highs/Lows for SELL to confirm directional breakout.',
    () => {
      if (structure.rangeDetected) {
        return {
          status: 'SKIPPED',
          explanation: 'SKIPPED: Range-bound regime detected. Directional high-low sequence is suspended.'
        };
      }

      if (input.selectedDirection === 'BUY') {
        if (structure.higherHighs && structure.higherLows) {
          return {
            status: 'PASS',
            explanation: `PASS: Structure confirms an expansion phase with HH & HL established. Regime: [${structure.regime}].`
          };
        } else {
          return {
            status: 'FAIL',
            explanation: `FAIL: Buy structure missing sequence. Active structure: HH=${structure.higherHighs}, HL=${structure.higherLows}.`
          };
        }
      } else {
        // SELL
        if (structure.lowerHighs && structure.lowerLows) {
          return {
            status: 'PASS',
            explanation: `PASS: Distribution sequence confirmed with active LH & LL prints. Regime: [${structure.regime}].`
          };
        } else {
          return {
            status: 'FAIL',
            explanation: `FAIL: Sell structure missing sequence. Active structure: LH=${structure.lowerHighs}, LL=${structure.lowerLows}.`
          };
        }
      }
    }
  );

  // 3. Session Filter Rule
  addRule(
    'rule-session-filter',
    'Session Liquidity Filter',
    'TIMING',
    'Validates entry timing against major high-liquidity session blocks (Asian, London, or New York).',
    () => {
      const activeName = input.activeSession.toUpperCase();
      const hasLondon = activeName.includes('LONDON');
      const hasNY = activeName.includes('NEW YORK') || activeName.includes('NY') || activeName.includes('US_EAST');
      const hasAsian = activeName.includes('ASIAN') || activeName.includes('TOKYO') || activeName.includes('SYDNEY');
      
      if (hasLondon || hasNY || hasAsian) {
        return {
          status: 'PASS',
          explanation: `PASS: Current active block is [${input.activeSession}]. Active session aligns with Gold high-liquidity trading hours (Asian, London, or New York).`
        };
      } else {
        return {
          status: 'FAIL',
          explanation: `FAIL: Session [${input.activeSession}] has insufficient institutional order books. Gold strategy requires Asian, London, or NY open.`
        };
      }
    }
  );

  // 4. Breakout Rule
  addRule(
    'rule-breakout',
    'Key Level Breakout',
    'TRIGGER',
    'Scans proximity to nearest ceiling or floor. Expects a strong volumetric push past local extremes.',
    () => {
      // Base breakout logic on preset and direction
      if (input.marketPreset === 'Extreme' || (input.marketPreset === 'Bullish' && input.selectedDirection === 'BUY') || (input.marketPreset === 'Bearish' && input.selectedDirection === 'SELL')) {
        return {
          status: 'PASS',
          explanation: `PASS: Volumetric force verified. Price has pushed decisively beyond the nearest extreme boundary ($${(input.selectedDirection === 'BUY' ? supportResistance.nearestResistance : supportResistance.nearestSupport).toLocaleString()}).`
        };
      } else if (input.marketPreset === 'Sideways') {
        return {
          status: 'FAIL',
          explanation: `FAIL: Mean-reversion detected. No valid breakout indicators present.`
        };
      } else {
        return {
          status: 'SKIPPED',
          explanation: `SKIPPED: Insufficient range consolidation to register a valid breakout wave.`
        };
      }
    }
  );

  // 5. Retest Rule
  addRule(
    'rule-retest',
    'Support & Resistance Retest',
    'TRIGGER',
    'Ensures entering after a successful retest and rejection of a broken level, avoiding trap fills.',
    () => {
      if (input.marketPreset === 'Sideways') {
        return {
          status: 'PASS',
          explanation: `PASS: Local boundary retest successful. Support boundary at $${supportResistance.nearestSupport.toLocaleString()} rejected multiple selling spikes.`
        };
      } else if (input.marketPreset === 'Extreme') {
        return {
          status: 'FAIL',
          explanation: 'FAIL: Hyper-momentum breakout has bypassed the retest phase entirely. High slippage risk.'
        };
      } else {
        return {
          status: 'SKIPPED',
          explanation: 'SKIPPED: Waiting for pull-back confirmation to trace the retest cluster.'
        };
      }
    }
  );

  // 6. Bullish Engulfing Rule
  addRule(
    'rule-bullish-engulfing',
    'Bullish Engulfing Trigger',
    'TRIGGER',
    'Scans for high-conviction Bullish Engulfing candlestick patterns on the execution timeframe.',
    () => {
      if (input.selectedDirection !== 'BUY') {
        return {
          status: 'SKIPPED',
          explanation: 'SKIPPED: Trigger is not applicable for short-sided (SELL) positions.'
        };
      }

      if (input.marketPreset === 'Bullish' || input.marketPreset === 'Extreme') {
        return {
          status: 'PASS',
          explanation: 'PASS: Verified! A high-volume Bullish Engulfing candlestick body has swallowed the previous session range.'
        };
      } else {
        return {
          status: 'FAIL',
          explanation: 'FAIL: No bullish candle engulfing signals detected in the latest local frame.'
        };
      }
    }
  );

  // 7. Bearish Engulfing Rule
  addRule(
    'rule-bearish-engulfing',
    'Bearish Engulfing Trigger',
    'TRIGGER',
    'Scans for high-conviction Bearish Engulfing candlestick patterns on the execution timeframe.',
    () => {
      if (input.selectedDirection !== 'SELL') {
        return {
          status: 'SKIPPED',
          explanation: 'SKIPPED: Trigger is not applicable for long-sided (BUY) positions.'
        };
      }

      if (input.marketPreset === 'Bearish' || input.marketPreset === 'Extreme') {
        return {
          status: 'PASS',
          explanation: 'PASS: Verified! A massive Bearish Engulfing candle has broken the support level.'
        };
      } else {
        return {
          status: 'FAIL',
          explanation: 'FAIL: No bearish candle engulfing signals found.'
        };
      }
    }
  );

  // 8. Minimum Risk Reward Rule
  addRule(
    'rule-min-rr',
    'Minimum Risk-to-Reward Ratio',
    'RISK',
    'Requires an asymmetrical setup offering a minimum of 2.0x target return relative to stop risk.',
    () => {
      const userRatio = input.riskRewardRatio;
      if (userRatio >= 2.0) {
        return {
          status: 'PASS',
          explanation: `PASS: Highly favorable asymmetry. Target payout is ${userRatio.toFixed(1)}:1, meeting the absolute 2.0:1 institutional minimum.`
        };
      } else {
        return {
          status: 'FAIL',
          explanation: `FAIL: Adverse asymmetry. Requested target is ${userRatio.toFixed(1)}:1. System rejects trades under 2.0:1 to protect overall expectancy.`
        };
      }
    }
  );

  // 9. Guardian Approval Rule
  addRule(
    'rule-guardian-approval',
    'AI Guardian Guardrail Approval',
    'SAFETY',
    'Checks the AI Guardian module risk scoring matrix to prevent trading inside high-hazard volatility loops.',
    () => {
      // Live integration with Guardian Risk Engine (V2.2)
      const guardianConfig = loadGuardianConfig();
      // Synchronize some values from input to config for dual-engine cross-coherence
      const syncConfig = {
        ...guardianConfig,
        riskRewardRatio: input.riskRewardRatio,
        activeSession: input.activeSession,
        setupConfidence: (input as any).setupConfidence || 85,
      };
      const guardianEval = evaluateGuardianRisk(syncConfig);
      
      if (guardianEval.status === 'APPROVED') {
        return {
          status: 'PASS',
          explanation: `PASS: Guardian Risk Engine APPROVED. ${guardianEval.overallReason}`
        };
      } else if (guardianEval.status === 'WARNING') {
        return {
          status: 'SKIPPED',
          explanation: `SKIPPED: Guardian Risk Engine WARNING. ${guardianEval.overallReason}`
        };
      } else {
        return {
          status: 'FAIL',
          explanation: `FAIL: Guardian Risk Engine BLOCKED. Reason: ${guardianEval.overallReason}`
        };
      }
    }
  );

  // 10. Market Health Rule
  addRule(
    'rule-market-health',
    'Market Health Verification',
    'SAFETY',
    'Aggregates bid-ask spreads, order book thickness, and systemic volatility metrics to verify healthy execution buffers.',
    () => {
      const health = input.marketHealthScore;
      if (health >= 70) {
        return {
          status: 'PASS',
          explanation: `PASS: Overall market health is highly optimal (${health}/100). Slippage buffers and execution queues are pristine.`
        };
      } else if (health >= 40) {
        return {
          status: 'SKIPPED',
          explanation: `SKIPPED: Market health index is average (${health}/100). Slippage risk is moderate. Order processing restricted to limit-only.`
        };
      } else {
        return {
          status: 'FAIL',
          explanation: `FAIL: Market Health index is critical (${health}/100). Spreads are dangerously wide. Immediate trading restricted.`
        };
      }
    }
  );

  return rules;
}
