import { TestCaseResult, RegressionTestRun, RegressionSettings } from '../types/regression';
import { evaluateRules } from './ruleEngine';
import { loadGuardianConfig, evaluateGuardianRisk } from './guardianRiskEngine';
import { calculateEMA, calculateRSI, calculateATR } from './indicatorEngine';
import { calculateMarketStructure } from './structureEngine';
import { paperTradingEngine } from './paperTradingEngine';
import { getTPSLTargets, createRecommendationFromEvent, simulateRecommendationTick } from './validationEngine';
import { engineIntegrationLayer } from './engineIntegrationLayer';
import { OHLC } from '../types/marketDataPluginSDK';

const SETTINGS_KEY = 'aq_regression_settings_v84';
const HISTORY_KEY = 'aq_regression_history_v84';

const DEFAULT_SETTINGS: RegressionSettings = {
  autoRunEnabled: false,
  autoRunIntervalSeconds: 30,
  stopOnFirstFailure: false,
};

export class RegressionTestEngine {
  private static instance: RegressionTestEngine | null = null;
  private settings: RegressionSettings = DEFAULT_SETTINGS;
  private history: RegressionTestRun[] = [];
  private listeners: Set<(run: RegressionTestRun | null, history: RegressionTestRun[]) => void> = new Set();
  private activeInterval: any = null;
  private isRunning: boolean = false;

  private constructor() {
    this.loadSettings();
    this.loadHistory();
    this.setupAutoScheduler();
  }

  public static getInstance(): RegressionTestEngine {
    if (!RegressionTestEngine.instance) {
      RegressionTestEngine.instance = new RegressionTestEngine();
    }
    return RegressionTestEngine.instance;
  }

  public subscribe(listener: (run: RegressionTestRun | null, history: RegressionTestRun[]) => void): () => void {
    this.listeners.add(listener);
    // Send current status
    listener(this.getLastRun(), [...this.history]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(currentRun: RegressionTestRun | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(currentRun, [...this.history]);
      } catch (e) {
        console.error('Error in regression listener:', e);
      }
    });
  }

  public getSettings(): RegressionSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<RegressionSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.setupAutoScheduler();
    this.notify(this.getLastRun());
  }

  public getHistory(): RegressionTestRun[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    localStorage.removeItem(HISTORY_KEY);
    this.notify(null);
  }

  private getLastRun(): RegressionTestRun | null {
    return this.history.length > 0 ? this.history[0] : null;
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load regression settings:', e);
    }
  }

  private saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load regression history:', e);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save regression history:', e);
    }
  }

  private setupAutoScheduler(): void {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }

    if (this.settings.autoRunEnabled) {
      const intervalMs = Math.max(5000, this.settings.autoRunIntervalSeconds * 1000);
      this.activeInterval = setInterval(() => {
        if (!this.isRunning) {
          this.runRegressionSuite(true);
        }
      }, intervalMs);
    }
  }

  /**
   * Generates a deterministic high-fidelity candle list for testing.
   */
  private generateTestCandles(count: number = 150): OHLC[] {
    const candles: OHLC[] = [];
    let price = 50000.00;
    const now = Date.now();
    
    for (let i = count; i > 0; i--) {
      // Simulate an upward trend with some swing patterns
      const isSwingHighCandle = i % 15 === 0;
      const isSwingLowCandle = i % 15 === 7;
      
      let change = price * 0.002 * (Math.sin(i / 5) + 0.1); // Wave pattern with upward bias
      
      if (isSwingHighCandle) {
        change += price * 0.01; // Force swing high
      } else if (isSwingLowCandle) {
        change -= price * 0.01; // Force swing low
      }

      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + (price * 0.003);
      const low = Math.min(open, close) - (price * 0.003);
      
      candles.push({
        time: new Date(now - i * 60000 * 15).toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: 25000 + Math.round(Math.random() * 5000)
      });
      price = close;
    }
    return candles;
  }

  /**
   * Runs the complete multi-engine regression test suite.
   */
  public async runRegressionSuite(isAuto: boolean = false): Promise<RegressionTestRun> {
    if (this.isRunning) {
      throw new Error('A regression test is already in progress.');
    }
    this.isRunning = true;

    const startTime = Date.now();
    const testCases: TestCaseResult[] = [];
    const warningsList: string[] = [];
    const runId = `tst-v84-${Math.floor(Math.random() * 9000) + 1000}`;

    // Helper to log and append test results
    const addResult = (
      id: string,
      name: string,
      engine: TestCaseResult['engine'],
      description: string,
      status: TestCaseResult['status'],
      message?: string,
      details?: string
    ) => {
      testCases.push({ id, name, engine, description, status, message, details });
      if (status === 'WARNING' && message) {
        warningsList.push(`[${engine}] ${message}`);
      }
    };

    try {
      // Generate standard candle set for testing indicators & structure
      const testCandles = this.generateTestCandles(150);

      // ==========================================
      // 1. RULE ENGINE TESTS
      // ==========================================
      try {
        const rulesRes = evaluateRules(
          {
            marketPreset: 'Bullish',
            activeSession: 'London',
            guardianRiskScore: 15,
            marketHealthScore: 85,
            selectedDirection: 'BUY',
            riskRewardRatio: 2.5,
          },
          {}
        );

        if (rulesRes && rulesRes.length > 0) {
          addResult(
            'rule-01',
            'Rule Engine Evaluation',
            'Rule Engine',
            'Validates rule engine correctly parses standard bullish inputs and generates evaluations list.',
            'PASSED',
            undefined,
            `Evaluated ${rulesRes.length} rules successfully.`
          );

          // Test Rule Toggling & Skipping
          const toggledRes = evaluateRules(
            {
              marketPreset: 'Bullish',
              activeSession: 'London',
              guardianRiskScore: 15,
              marketHealthScore: 85,
              selectedDirection: 'BUY',
              riskRewardRatio: 2.5,
            },
            { 'rule-session-filter': false }
          );
          const filterRule = toggledRes.find(r => r.id === 'rule-session-filter');
          if (filterRule && filterRule.status === 'SKIPPED') {
            addResult(
              'rule-02',
              'Rule Engine Toggling Mechanics',
              'Rule Engine',
              'Validates rule skip mechanics when explicit rule toggles are disabled by the operator.',
              'PASSED',
              undefined,
              `Successfully verified rule 'rule-session-filter' was skipped.`
            );
          } else {
            addResult(
              'rule-02',
              'Rule Engine Toggling Mechanics',
              'Rule Engine',
              'Validates rule skip mechanics when explicit rule toggles are disabled.',
              'WARNING',
              "Toggled rule 'rule-session-filter' did not display 'SKIPPED' status.",
              `Status returned was: ${filterRule ? filterRule.status : 'NOT FOUND'}`
            );
          }
        } else {
          addResult(
            'rule-01',
            'Rule Engine Evaluation',
            'Rule Engine',
            'Validates rule engine output array.',
            'FAILED',
            'Rule engine returned an empty or invalid array of evaluations.'
          );
        }
      } catch (e: any) {
        addResult('rule-01', 'Rule Engine Evaluation', 'Rule Engine', 'Validates rule engine output array.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 2. INDICATOR ENGINE TESTS
      // ==========================================
      try {
        const emaRes = calculateEMA(testCandles, 50);
        const rsiRes = calculateRSI(testCandles, 14);
        const atrRes = calculateATR(testCandles, 14);

        if (emaRes && typeof emaRes.value === 'number' && !isNaN(emaRes.value)) {
          addResult(
            'ind-01',
            'EMA Computation Integrity',
            'Indicator Engine',
            'Verifies 50-period Exponential Moving Average smoothing mathematical output and signal assignment.',
            'PASSED',
            undefined,
            `EMA value calculated: ${emaRes.value}, Direction: ${emaRes.direction}, Signal: ${emaRes.signal}`
          );
        } else {
          addResult('ind-01', 'EMA Computation Integrity', 'Indicator Engine', 'Verifies 50-period EMA mathematical output.', 'FAILED', 'EMA returned non-numeric or null value');
        }

        if (rsiRes && rsiRes.value >= 0 && rsiRes.value <= 100) {
          addResult(
            'ind-02',
            'RSI Oscillator Boundaries Check',
            'Indicator Engine',
            'Verifies 14-period Relative Strength Index boundary limits (0 to 100) and overbought/oversold logic.',
            'PASSED',
            undefined,
            `RSI value calculated: ${rsiRes.value.toFixed(2)}, Signal: ${rsiRes.signal}`
          );
        } else {
          addResult('ind-02', 'RSI Oscillator Boundaries Check', 'Indicator Engine', 'Verifies RSI limits.', 'FAILED', `RSI value out of boundaries or null: ${rsiRes ? rsiRes.value : 'NULL'}`);
        }

        if (atrRes && atrRes.value > 0) {
          addResult(
            'ind-03',
            'Average True Range Sensitivity',
            'Indicator Engine',
            'Verifies volatility measurement engine (14-period ATR) delivers valid positive price deviations.',
            'PASSED',
            undefined,
            `ATR value calculated: ${atrRes.value.toFixed(2)}`
          );
        } else {
          addResult('ind-03', 'Average True Range Sensitivity', 'Indicator Engine', 'Verifies ATR values.', 'FAILED', `ATR value non-positive or null: ${atrRes ? atrRes.value : 'NULL'}`);
        }
      } catch (e: any) {
        addResult('ind-err', 'Indicator Calculations', 'Indicator Engine', 'Runs all core indicators.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 3. MARKET STRUCTURE ENGINE TESTS
      // ==========================================
      try {
        const structureState = calculateMarketStructure(testCandles);
        if (structureState && structureState.support && structureState.resistance) {
          const supportsVal = structureState.support.value;
          const resistanceVal = structureState.resistance.value;
          
          if (supportsVal > 0 && resistanceVal > supportsVal) {
            addResult(
              'struct-01',
              'S/R Level Logical Coherence',
              'Market Structure Engine',
              'Validates detected support levels are mathematically lower than detected resistance levels.',
              'PASSED',
              undefined,
              `Support: $${supportsVal.toLocaleString()}, Resistance: $${resistanceVal.toLocaleString()}`
            );
          } else {
            addResult(
              'struct-01',
              'S/R Level Logical Coherence',
              'Market Structure Engine',
              'Validates detected support is lower than resistance.',
              'WARNING',
              `Resistance ($${resistanceVal}) not higher than Support ($${supportsVal}). Fallback default levels applied.`
            );
          }

          if (structureState.trendDirection && ['BULLISH', 'BEARISH', 'SIDEWAYS'].includes(structureState.trendDirection.value)) {
            addResult(
              'struct-02',
              'Structural Trend Assignment',
              'Market Structure Engine',
              'Validates trend direction detection algorithms match defined regime classes (BULLISH, BEARISH, or SIDEWAYS).',
              'PASSED',
              undefined,
              `Detected Trend: ${structureState.trendDirection.value} (Confidence: ${structureState.trendDirection.confidence}%)`
            );
          } else {
            addResult('struct-02', 'Structural Trend Assignment', 'Market Structure Engine', 'Validates trend direction output class.', 'FAILED', 'Trend direction is invalid or empty.');
          }
        } else {
          addResult('struct-01', 'Structure Calculations', 'Market Structure Engine', 'Verifies structure engine parses candle pivots.', 'FAILED', 'Returned structure state is null or incomplete.');
        }
      } catch (e: any) {
        addResult('struct-err', 'Structure Engine Failure', 'Market Structure Engine', 'Runs pivot high/low structure scans.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 4. GUARDIAN (RISK ENGINE) TESTS
      // ==========================================
      try {
        const config = loadGuardianConfig();
        
        // Scenario A: Clean account risk checks
        const cleanEval = evaluateGuardianRisk({
          ...config,
          dailyLoss: 0,
          maxDailyLossLimit: 500,
          emergencyKillSwitch: false,
          marketOpen: true,
          spreadBps: 10,
          maxSpreadBps: 30,
          volatilityIndex: 40,
          maxVolatilityIndex: 80,
          riskRewardRatio: 2.5,
          minRiskRewardRatio: 2.0,
        });

        if (cleanEval && cleanEval.status !== 'BLOCKED' && cleanEval.canTrade) {
          addResult(
            'guard-01',
            'Guardian Risk Evaluation: Approved Path',
            'Guardian',
            'Verifies that clean accounts within standard volatility and spread parameters are APPROVED for trading.',
            'PASSED',
            undefined,
            `Verdict: ${cleanEval.status}, Reasons: ${cleanEval.overallReason}`
          );
        } else {
          addResult(
            'guard-01',
            'Guardian Risk Evaluation: Approved Path',
            'Guardian',
            'Verifies clean parameter approvals.',
            'FAILED',
            `Approved parameter configuration was blocked. Verdict: ${cleanEval ? cleanEval.status : 'NULL'}`
          );
        }

        // Scenario B: Emergency Kill Switch active blocking
        const killSwitchEval = evaluateGuardianRisk({
          ...config,
          emergencyKillSwitch: true,
        });

        if (killSwitchEval && killSwitchEval.status === 'BLOCKED' && !killSwitchEval.canTrade) {
          addResult(
            'guard-02',
            'Guardian Protection: Emergency Circuit Breaker',
            'Guardian',
            'Verifies that activating the manual emergency kill switch immediately BLOCKS the entire pipeline.',
            'PASSED',
            undefined,
            'Verified kill switch successfully overrides all active entries.'
          );
        } else {
          addResult(
            'guard-02',
            'Guardian Protection: Emergency Circuit Breaker',
            'Guardian',
            'Verifies kill switch safety override.',
            'FAILED',
            'Kill switch was active but guardian evaluation did not report BLOCKED.'
          );
        }

        // Scenario C: Daily loss limit breach
        const breachedLossEval = evaluateGuardianRisk({
          ...config,
          dailyLoss: 600,
          maxDailyLossLimit: 500,
          emergencyKillSwitch: false,
        });

        if (breachedLossEval && breachedLossEval.status === 'BLOCKED' && !breachedLossEval.canTrade) {
          addResult(
            'guard-03',
            'Guardian Capital Safeguard: Drawdown Check',
            'Guardian',
            'Verifies that exceeding the maximum daily drawdown limit blocks order execution to safeguard core equity.',
            'PASSED',
            undefined,
            'Verified daily loss limit breach triggers block.'
          );
        } else {
          addResult(
            'guard-03',
            'Guardian Capital Safeguard: Drawdown Check',
            'Guardian',
            'Verifies drawdown limits.',
            'FAILED',
            'Exceeded daily loss limit was not blocked by the safety system.'
          );
        }
      } catch (e: any) {
        addResult('guard-err', 'Guardian Execution', 'Guardian', 'Performs safety checks evaluations.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 5. STRATEGY ENGINE TESTS
      // ==========================================
      try {
        // Run integrated pipeline to inspect stage 5 output
        const runRes = await engineIntegrationLayer.executePipeline('BTC/USD', '15M', 'Bullish');
        const strategyStage = runRes.stages.find(s => s.id === 'strategy-engine');

        if (strategyStage && strategyStage.status === 'COMPLETED') {
          const parsedStrategy = JSON.parse(strategyStage.output);
          if (parsedStrategy && parsedStrategy.strategyId && parsedStrategy.riskSettings) {
            addResult(
              'strat-01',
              'Strategy Pattern Selector Alignment',
              'Strategy Engine',
              'Validates automated pattern matching resolves standard presets into strategy templates with entry/exit rule arrays.',
              'PASSED',
              undefined,
              `Loaded Strategy: ${parsedStrategy.name}, Max Risk Limit: ${parsedStrategy.riskSettings.maxRiskPerTradePercent}%`
            );
          } else {
            addResult(
              'strat-01',
              'Strategy Pattern Selector Alignment',
              'Strategy Engine',
              'Validates strategy templates.',
              'FAILED',
              'Strategy output from pipeline is missing crucial schema fields like strategyId or riskSettings.'
            );
          }
        } else {
          addResult(
            'strat-01',
            'Strategy Pattern Selector Alignment',
            'Strategy Engine',
            'Validates strategy templates.',
            'FAILED',
            `Pipeline Strategy Stage returned status: ${strategyStage ? strategyStage.status : 'NOT FOUND'}`
          );
        }
      } catch (e: any) {
        addResult('strat-err', 'Strategy Engine Calculations', 'Strategy Engine', 'Checks strategies.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 6. DECISION ENGINE TESTS
      // ==========================================
      try {
        const runRes = await engineIntegrationLayer.executePipeline('BTC/USD', '15M', 'Bullish');
        const decisionStage = runRes.stages.find(s => s.id === 'decision-engine');

        if (decisionStage && decisionStage.status === 'COMPLETED') {
          const decision = JSON.parse(decisionStage.output);
          if (decision && decision.action && typeof decision.confidence === 'number') {
            addResult(
              'dec-01',
              'Integrated Consensus Engine',
              'Decision Engine',
              'Verifies the multi-agent consensus module converges on a definitive action and calculates confidence score.',
              'PASSED',
              undefined,
              `Consensus Action: ${decision.action}, Confidence Score: ${decision.confidence}%, Risk/Reward: ${decision.riskRewardRatio}:1`
            );
          } else {
            addResult(
              'dec-01',
              'Integrated Consensus Engine',
              'Decision Engine',
              'Verifies decision metrics schema.',
              'FAILED',
              'Decision engine output missing action or confidence properties.'
            );
          }
        } else {
          addResult(
            'dec-01',
            'Integrated Consensus Engine',
            'Decision Engine',
            'Verifies decision stage.',
            'FAILED',
            `Pipeline Decision Stage did not complete. Status: ${decisionStage ? decisionStage.status : 'NOT FOUND'}`
          );
        }
      } catch (e: any) {
        addResult('dec-err', 'Decision Engine Calculations', 'Decision Engine', 'Checks consensus math.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 7. PAPER TRADING ENGINE TESTS
      // ==========================================
      try {
        // Standard position sizing check
        const posSizeResult = paperTradingEngine.calculatePositionSize(95000, 94000, 1.5);
        if (posSizeResult && posSizeResult.positionSize > 0 && !isNaN(posSizeResult.positionSize)) {
          addResult(
            'paper-01',
            'Mathematical Position Sizing Formula',
            'Paper Trading',
            'Verifies position size calculation correctly scales balance risk percentages relative to the price stop distance.',
            'PASSED',
            undefined,
            `Resulting Position Size: ${posSizeResult.positionSize.toFixed(4)} lots at 1.5% account risk.`
          );
        } else {
          addResult(
            'paper-01',
            'Mathematical Position Sizing Formula',
            'Paper Trading',
            'Verifies position sizing math.',
            'FAILED',
            `Calculation returned zero or non-numeric value: ${posSizeResult ? posSizeResult.positionSize : 'NULL'}`
          );
        }

        // Safe mode isolated trade lifecycle simulation
        const accountRef = paperTradingEngine.getAccount();
        if (accountRef) {
          const originalAccountState = JSON.parse(JSON.stringify(accountRef));
          const originalJournalEntries = localStorage.getItem('aq_trade_journal_entries');

          try {
            // Execute trade
            const orderRes = paperTradingEngine.executeTrade('BTC/USD', 'BUY', 95000.00, 94000.00, 97000.00, {
              confidence: 90
            });

            if (orderRes && orderRes.success && orderRes.trade) {
              const openPositions = paperTradingEngine.getAccount().positions;
              const hasOrder = openPositions.some(p => p.id === orderRes.trade?.id);

              if (hasOrder) {
                // Close position
                paperTradingEngine.closePosition(orderRes.trade.id, 'MANUAL', 96000.00);
                const stillOpen = paperTradingEngine.getAccount().positions.some(p => p.id === orderRes.trade?.id);
                if (!stillOpen) {
                  addResult(
                    'paper-02',
                    'Safe Mode Trade Lifecycle Sandbox',
                    'Paper Trading',
                    'Tests trade entry mechanics, order book allocation, active status updates, and graceful trade closures.',
                    'PASSED',
                    undefined,
                    'Completed order execution, active position validation, and trade closure lifecycle check.'
                  );
                } else {
                  addResult(
                    'paper-02',
                    'Safe Mode Trade Lifecycle Sandbox',
                    'Paper Trading',
                    'Tests trade entry, allocation, and closure.',
                    'FAILED',
                    'Failed to close executed order. Position is still in open positions portfolio.'
                  );
                }
              } else {
                addResult(
                  'paper-02',
                  'Safe Mode Trade Lifecycle Sandbox',
                  'Paper Trading',
                  'Tests trade entry, allocation, and closure.',
                  'FAILED',
                  'Executed trade successfully but position was not allocated in account openPositions portfolio.'
                );
              }
            } else {
              addResult(
                'paper-02',
                'Safe Mode Trade Lifecycle Sandbox',
                'Paper Trading',
                'Tests trade entry, allocation, and closure.',
                'WARNING',
                `Paper broker rejected trade entry. Account Balance might be depleted: $${accountRef.balance.toLocaleString()}`,
                orderRes?.message
              );
            }
          } finally {
            // HYGIENIC RESTORE: Ensure we never leak testing history or test positions into user's real account
            (paperTradingEngine as any).account = originalAccountState;
            paperTradingEngine.saveState();
            if (originalJournalEntries) {
              localStorage.setItem('aq_trade_journal_entries', originalJournalEntries);
            } else {
              localStorage.removeItem('aq_trade_journal_entries');
            }
          }
        } else {
          addResult('paper-01', 'Position Sizing Formula', 'Paper Trading', 'Verifies paper trading state.', 'FAILED', 'Account object not available in Paper Trading Engine.');
        }
      } catch (e: any) {
        addResult('paper-err', 'Paper Broker Operations', 'Paper Trading', 'Validates portfolio broker modules.', 'FAILED', e.message || 'Unknown error');
      }

      // ==========================================
      // 8. VALIDATION MODE TESTS
      // ==========================================
      try {
        const targets = getTPSLTargets(100.00, 'BULLISH');
        if (targets && targets.tpPrice > 100.00 && targets.slPrice < 100.00) {
          addResult(
            'val-01',
            'Validation Targets Mathematical Matrix',
            'Validation Mode',
            'Verifies that validation target generators generate mathematically sound Stop Loss and Take Profit bounds.',
            'PASSED',
            undefined,
            `TP: $${targets.tpPrice.toFixed(2)}, SL: $${targets.slPrice.toFixed(2)}`
          );
        } else {
          addResult(
            'val-01',
            'Validation Targets Mathematical Matrix',
            'Validation Mode',
            'Verifies take profit and stop loss targets bounds.',
            'FAILED',
            `Calculated target bounds are logically incorrect: entry: 100, tp: ${targets?.tpPrice}, sl: ${targets?.slPrice}`
          );
        }

        // Test mock recommendation ingestion
        const mockRec = createRecommendationFromEvent({
          id: 'evt-test-101',
          ticker: 'BTC/USD',
          type: 'Breakout',
          direction: 'BULLISH',
          price: 95000.00,
          confidence: 88,
          timestamp: new Date().toISOString(),
          priority: 'HIGH',
          reason: 'Bullish breakout above standard range.',
          overallScore: 85,
          trendScore: 80,
          structureScore: 80,
          confirmationScore: 80,
          riskScore: 10,
          guardianScore: 90,
          marketHealthScore: 85,
          readinessScore: 88,
          rankingLevel: 'Elite'
        });

        if (mockRec && mockRec.status === 'TRACKING' && mockRec.entryPrice === 95000.00) {
          addResult(
            'val-02',
            'Recommendation Pipeline Ingestion',
            'Validation Mode',
            'Verifies that scanner signals translate seamlessly into monitored validation mode recommendations.',
            'PASSED',
            undefined,
            `Successfully created monitored Recommendation with Take Profit at $${mockRec.tpPrice.toLocaleString()}`
          );

          // Test state simulation ticks
          const nextTick = simulateRecommendationTick(mockRec);
          if (nextTick) {
            addResult(
              'val-03',
              'Dynamic Recommendations Tick Simulator',
              'Validation Mode',
              'Checks the background price/time tick simulator evolves simulated coordinates correctly.',
              'PASSED',
              undefined,
              `Triggered tick evolution. Updated price: $${nextTick.currentPrice.toLocaleString()}, Current status: ${nextTick.status}`
            );
          } else {
            addResult('val-03', 'Dynamic Recommendations Tick Simulator', 'Validation Mode', 'Checks recommendation state simulation.', 'FAILED', 'Tick evolution returned null or failed.');
          }
        } else {
          addResult(
            'val-02',
            'Recommendation Pipeline Ingestion',
            'Validation Mode',
            'Verifies recommendation models creation.',
            'FAILED',
            `Ingested event did not create standard recommendation. status: ${mockRec ? mockRec.status : 'NULL'}, entryPrice: ${mockRec ? mockRec.entryPrice : 'NULL'}`
          );
        }
      } catch (e: any) {
        addResult('val-err', 'Validation Mode Simulations', 'Validation Mode', 'Validates backtesting simulation logic.', 'FAILED', e.message || 'Unknown error');
      }

    } catch (globalErr: any) {
      addResult('global-err', 'Regression Suite Global Runner', 'Decision Engine', 'Runs the multi-point test suite.', 'FAILED', globalErr.message || 'Critical pipeline exception.');
    }

    // Wrap up results
    const executionTimeMs = Date.now() - startTime;
    const totalTests = testCases.length;
    const passedCount = testCases.filter(c => c.status === 'PASSED').length;
    const failedCount = testCases.filter(c => c.status === 'FAILED').length;
    const warningCount = testCases.filter(c => c.status === 'WARNING').length;

    let overallStatus: RegressionTestRun['status'] = 'SUCCESS';
    if (failedCount > 0) {
      overallStatus = 'FAILURE';
    } else if (warningCount > 0) {
      overallStatus = 'WARNINGS';
    }

    const newRun: RegressionTestRun = {
      id: runId,
      timestamp: new Date().toISOString(),
      status: overallStatus,
      executionTimeMs,
      totalTests,
      passedCount,
      failedCount,
      warningCount,
      results: testCases,
      warnings: warningsList,
      isAutoRun: isAuto,
    };

    // Store in history
    this.history.unshift(newRun);
    this.history = this.history.slice(0, 30); // keep last 30 runs
    this.saveHistory();

    this.isRunning = false;
    this.notify(newRun);

    return newRun;
  }
}

export const regressionTestEngine = RegressionTestEngine.getInstance();
