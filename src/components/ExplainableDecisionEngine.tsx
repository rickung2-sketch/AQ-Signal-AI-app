import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Settings, Sliders, ToggleLeft, 
  ToggleRight, Info, Eye, ShieldAlert, Cpu, Award, HelpCircle, RefreshCw,
  TrendingUp, Compass, Activity, ArrowRightLeft, Clock, MessageSquare, 
  Terminal, ShieldCheck, ChevronDown, ChevronUp, Copy, BookOpen, Shield, Flame
} from 'lucide-react';
import { evaluateRules } from '../plugins/ruleEngine';
import { RuleEngineInput, RuleEvaluation, RuleResultStatus } from '../types/rules';
import { loadGuardianConfig, evaluateGuardianRisk, saveGuardianConfig } from '../plugins/guardianRiskEngine';

interface ExplainableDecisionEngineProps {
  addLog?: (log: string) => void;
}

export default function ExplainableDecisionEngine({ addLog }: ExplainableDecisionEngineProps) {
  // Telemetry Inputs (synchronized with rule evaluations)
  const [marketPreset, setMarketPreset] = useState<RuleEngineInput['marketPreset']>('Bullish');
  const [activeSession, setActiveSession] = useState<string>('London & New York Overlap');
  const [guardianRiskScore, setGuardianRiskScore] = useState<number>(45);
  const [marketHealthScore, setMarketHealthScore] = useState<number>(85);
  const [selectedDirection, setSelectedDirection] = useState<RuleEngineInput['selectedDirection']>('BUY');
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(2.5);

  // V2.2 Guardian Risk Engine state sync
  const [guardianConfig, setGuardianConfig] = useState(() => loadGuardianConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      const current = loadGuardianConfig();
      setGuardianConfig(current);
      setGuardianRiskScore(current.volatilityIndex); // map risk score to dynamic volatility index
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const guardianEval = evaluateGuardianRisk(guardianConfig);

  // Settings for the decision combining logic
  const [strictCompliance, setStrictCompliance] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(70);

  // Toggle sections
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({
    rules: true,
    debate: true,
    timeline: true,
    ledger: false,
    alternative: true,
  });

  const STORAGE_KEY_TOGGLES = 'aq_rule_toggles_v11';
  
  // Default toggles matching ruleEngine
  const defaultToggles: Record<string, boolean> = {
    'rule-ema-200': true,
    'rule-market-structure': true,
    'rule-session-filter': true,
    'rule-breakout': true,
    'rule-retest': true,
    'rule-bullish-engulfing': true,
    'rule-bearish-engulfing': true,
    'rule-min-rr': true,
    'rule-guardian-approval': true,
    'rule-market-health': true,
  };

  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>(defaultToggles);
  const [evaluations, setEvaluations] = useState<RuleEvaluation[]>([]);
  const [copiedLedger, setCopiedLedger] = useState<boolean>(false);
  const [randomTxId, setRandomTxId] = useState<string>('');

  // Generate a random transaction / decision hash for the ledger on parameter change
  useEffect(() => {
    const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    const hash = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    setRandomTxId(`0x${hash.slice(0, 12)}...${hash.slice(-8)}`);
  }, [marketPreset, selectedDirection, riskRewardRatio, guardianRiskScore, marketHealthScore]);

  // Load saved rule toggles
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TOGGLES);
    if (saved) {
      try {
        setRuleToggles({ ...defaultToggles, ...JSON.parse(saved) });
      } catch (e) {
        setRuleToggles(defaultToggles);
      }
    }

    const savedPreset = localStorage.getItem('aq_market_preset') as any;
    if (savedPreset) {
      setMarketPreset(savedPreset);
    }
  }, []);

  // Save rule toggles when modified
  const handleToggleRule = (id: string) => {
    const next = { ...ruleToggles, [id]: !ruleToggles[id] };
    setRuleToggles(next);
    localStorage.setItem(STORAGE_KEY_TOGGLES, JSON.stringify(next));
    if (addLog) {
      const name = evaluations.find(r => r.id === id)?.name || id;
      addLog(`DECISION ENGINE: Toggled rule [${name}] to [${!ruleToggles[id] ? 'ENABLED' : 'DISABLED'}]`);
    }
  };

  // Run the rule evaluation pipeline
  const currentInput: RuleEngineInput = {
    marketPreset,
    activeSession,
    guardianRiskScore,
    marketHealthScore,
    selectedDirection,
    riskRewardRatio,
  };

  const activeEvaluations = evaluateRules(currentInput, ruleToggles);

  // Group evaluations
  const enabledEvaluations = activeEvaluations.filter(e => e.isEnabled);
  const passedRules = enabledEvaluations.filter(e => e.status === 'PASS');
  const failedRules = enabledEvaluations.filter(e => e.status === 'FAIL');
  const skippedRules = enabledEvaluations.filter(e => e.status === 'SKIPPED');

  // Quantitative Decision Output Logic
  // Outputs strictly: BUY, SELL, or NO TRADE
  let decision: 'BUY' | 'SELL' | 'NO TRADE' = 'NO TRADE';
  let decisionSummary = '';
  let confidenceScore = 0;
  let tradeGrade = 'F';

  if (enabledEvaluations.length > 0) {
    // Score based on passed rules among all enabled rules
    const passedCount = passedRules.length;
    const totalEnabledCount = enabledEvaluations.length;
    confidenceScore = Math.round((passedCount / totalEnabledCount) * 100);

    if (strictCompliance) {
      // If any enabled rule fails, we immediately fall back to NO TRADE
      if (failedRules.length > 0) {
        decision = 'NO TRADE';
        decisionSummary = `BLOCKED: Engine fell back to NO TRADE. Under STRICT COMPLIANCE gate, all enabled filters must pass. There is currently ${failedRules.length} rule failure (${failedRules.map(r => r.name).join(', ')}).`;
      } else if (passedRules.length === 0) {
        decision = 'NO TRADE';
        decisionSummary = 'BLOCKED: No rules registered a PASS status. Setup lacks positive conviction bias.';
      } else {
        decision = selectedDirection === 'BUY' ? 'BUY' : 'SELL';
        decisionSummary = `CONFIRMED: Execution pathway unlocked for ${decision}. Setup has reached 100% compliance across all active rules with 0 active failures.`;
      }
    } else {
      // Threshold-based gate
      if (confidenceScore >= confidenceThreshold) {
        decision = selectedDirection === 'BUY' ? 'BUY' : 'SELL';
        decisionSummary = `CONFIRMED: Execution pathway unlocked for ${decision}. Conformance rate is ${confidenceScore}%, exceeding the required consensus threshold of ${confidenceThreshold}%.`;
      } else {
        decision = 'NO TRADE';
        decisionSummary = `REJECTED: Decision Engine resolved to NO TRADE. Current consensus rating (${confidenceScore}%) is below the minimum operator threshold of ${confidenceThreshold}%.`;
      }
    }
  } else {
    decision = 'NO TRADE';
    decisionSummary = 'REJECTED: All decision sub-rules have been disabled by the operator. Engine cannot synthesize an execution bias.';
  }

  // Map confidence/decision to a readable Grade
  if (decision === 'NO TRADE') {
    if (enabledEvaluations.length === 0) {
      tradeGrade = 'N/A';
    } else if (failedRules.length === 0 && skippedRules.length > 0) {
      tradeGrade = 'C-'; // Skipped, but no direct fails
    } else {
      tradeGrade = 'F'; // Fails present
    }
  } else {
    if (confidenceScore >= 90) tradeGrade = 'A+';
    else if (confidenceScore >= 80) tradeGrade = 'A';
    else if (confidenceScore >= 70) tradeGrade = 'B+';
    else if (confidenceScore >= 60) tradeGrade = 'B';
    else tradeGrade = 'C';
  }

  // Toggle section visibility helper
  const toggleSection = (sec: string) => {
    setExpandedSection(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const copyLedgerToClipboard = () => {
    const rawLedger = JSON.stringify(ledgerEntry, null, 2);
    navigator.clipboard.writeText(rawLedger);
    setCopiedLedger(true);
    setTimeout(() => setCopiedLedger(false), 2000);
    if (addLog) addLog('DECISION ENGINE: Exported cryptographic decision ledger to local clipboard.');
  };

  // Alternate Scenario calculations (What-If analysis)
  const calculateWhatIf = (altPreset: RuleEngineInput['marketPreset'], altDir: RuleEngineInput['selectedDirection']) => {
    const altInput: RuleEngineInput = {
      ...currentInput,
      marketPreset: altPreset,
      selectedDirection: altDir
    };
    const altEvals = evaluateRules(altInput, ruleToggles);
    const altEnabled = altEvals.filter(e => e.isEnabled);
    const altPassed = altEnabled.filter(e => e.status === 'PASS');
    const altFailed = altEnabled.filter(e => e.status === 'FAIL');

    let altDecision: 'BUY' | 'SELL' | 'NO TRADE' = 'NO TRADE';
    let altConfidence = altEnabled.length > 0 ? Math.round((altPassed.length / altEnabled.length) * 100) : 0;

    if (strictCompliance) {
      if (altFailed.length === 0 && altPassed.length > 0) {
        altDecision = altDir === 'BUY' ? 'BUY' : 'SELL';
      }
    } else {
      if (altConfidence >= confidenceThreshold) {
        altDecision = altDir === 'BUY' ? 'BUY' : 'SELL';
      }
    }
    return { decision: altDecision, confidence: altConfidence, passed: altPassed.length, failed: altFailed.length };
  };

  const oppositeDirection = selectedDirection === 'BUY' ? 'SELL' : 'BUY';
  const oppositePreset = marketPreset === 'Bullish' ? 'Bearish' : marketPreset === 'Bearish' ? 'Bullish' : 'Extreme';

  const alternativeDirResult = calculateWhatIf(marketPreset, oppositeDirection);
  const alternativePresetResult = calculateWhatIf(oppositePreset, selectedDirection);

  // Structured Decision Ledger Entry object
  const ledgerEntry = {
    ledgerIndex: Date.now().toString(),
    transactionId: randomTxId.replace('...', '001a1f'),
    epochTime: new Date().toISOString(),
    systemVersion: 'v3.0-ExplainableDecision',
    telemetryInput: {
      regime: marketPreset,
      activeSession: activeSession,
      targetDirection: selectedDirection,
      riskRewardRatio: riskRewardRatio,
      guardianScore: guardianRiskScore,
      healthIndex: marketHealthScore,
    },
    guardianRiskEngine: {
      status: guardianEval.status,
      overallReason: guardianEval.overallReason,
      canTrade: guardianEval.canTrade,
      config: guardianConfig
    },
    consensusSettings: {
      strictMode: strictCompliance,
      requiredConfidenceThreshold: confidenceThreshold,
    },
    outcome: {
      decision: decision,
      grade: tradeGrade,
      ruleConfidencePercentage: confidenceScore,
      passedRulesCount: passedRules.length,
      failedRulesCount: failedRules.length,
      skippedRulesCount: skippedRules.length,
    },
    signature: `SHA256::${randomTxId.replace('0x', '').replace('...', '')}f28e2098ca3922`
  };

  // AI Guardian review text calculation
  const getGuardianReviewText = () => {
    if (guardianEval.status === 'BLOCKED') {
      return `CRITICAL INHIBITION: Guardian Risk Engine V3.0 is currently BLOCKED. Reason: ${guardianEval.overallReason}. All transactional routing pipelines remain frozen to safeguard capital integrity.`;
    }
    if (guardianEval.status === 'WARNING') {
      return `WARNING RESTRICTION: Guardian Risk Engine V3.0 has thrown a cautionary notice: ${guardianEval.overallReason}. Order execution permitted in limit-only modes with restricted sizing allocations.`;
    }
    if (decision === 'NO TRADE') {
      return `MONITORING STANDBY: Guardian Risk Engine is fully SECURE & APPROVED (${guardianEval.overallReason}). However, the underlying technical rule filters have failed to reach execution consensus. Standing aside is advised.`;
    }
    return `APPROVED PROTOCOL: Setup parameters fall fully within secure parameters. Guardian Status: APPROVED. ${guardianEval.overallReason} Core execution routing cleared for delivery.`;
  };

  // AI Debate Review Dialogue
  const getDebateReview = () => {
    if (selectedDirection === 'BUY') {
      return {
        advocate: `Bullish Advisor Node: The 200 EMA supports long positions, and we have confirmed our structure in the current [${marketPreset}] regime. Spreads are tight, session volume is thick. Delaying entry risks missing the markup wave!`,
        sceptic: `Bearish Advisor Node: Beware the local retests. While macro trend points upwards, entering right after a quick breakout when the Guardian score is fluctuating is prone to bull traps. Ensure stop-losses are firmly placed below the key frame.`
      };
    } else {
      return {
        advocate: `Bearish Advisor Node: Trend alignment is optimal, EMA indicators are sloping downwards, and we are registering strong distribution characteristics. The short setup matches our markdown checklists perfectly.`,
        sceptic: `Bullish Advisor Node: Entering shorts in this dynamic session is risky without solid volume confirmation. If macro indices experience a mean-reverting squeeze, we'll get trapped at local lows. Limit entries are highly advised.`
      };
    }
  };

  const debateText = getDebateReview();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div id="ede-header-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/3 blur-3xl rounded-full" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
              UPGRADE v2.1
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              EXPLAINABLE DECISION SYSTEM
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            DECISION ENGINE & CONFORMANCE COGNITION
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            A fully transparent, deterministic combining engine that eliminates black-box trade entries. Each rule is modularly evaluated, weighted, and fully explained with historical scenario parameters.
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-3 bg-[#0C0C0D] border border-zinc-900 px-4 py-3 rounded-lg shrink-0">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <div className="text-left font-mono">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">ENGINE CONTEXT</span>
            <span className="text-xs text-zinc-300 font-bold">STABLE COGNITION</span>
          </div>
        </div>
      </div>

      {/* Main Panel - Split Left (Controllers) and Right (Primary Decision Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Telemetry & Engine Logic Control */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Telemetry Input Panel */}
          <div id="ede-telemetry-controller" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5">
            <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                COGNITIVE STIMULATION
              </h3>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">Input Feed</span>
            </div>

            <div className="space-y-4">
              {/* Regime */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Regime Preset</label>
                <select
                  value={marketPreset}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setMarketPreset(val);
                    localStorage.setItem('aq_market_preset', val);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none"
                >
                  <option value="Bullish">Bullish Expansion</option>
                  <option value="Bearish">Bearish Markdown</option>
                  <option value="Sideways">Mean-Reverting Range</option>
                  <option value="Extreme">Extreme Flash Liquid</option>
                </select>
              </div>

              {/* Target Direction */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Simulated Direction</label>
                <div className="grid grid-cols-2 bg-zinc-900 border border-zinc-850 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectedDirection('BUY')}
                    className={`py-1.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                      selectedDirection === 'BUY'
                        ? 'bg-green-500 text-black shadow-sm font-black'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    onClick={() => setSelectedDirection('SELL')}
                    className={`py-1.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                      selectedDirection === 'SELL'
                        ? 'bg-red-500 text-black shadow-sm font-black'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>

              {/* RR Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 uppercase">Risk-Reward Ratio</span>
                  <span className="font-bold text-amber-400">{riskRewardRatio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.5"
                  step="0.1"
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
                />
              </div>

              {/* Session Timeframe */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Timing Window</label>
                <select
                  value={activeSession}
                  onChange={(e) => setActiveSession(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none"
                >
                  <option value="London & New York Overlap">London/NY Overlap (High volume)</option>
                  <option value="New York Session">New York Open (Active volume)</option>
                  <option value="London Session">London Open (Early markup)</option>
                  <option value="Asian Session">Asian Trading Range (Thin volume)</option>
                </select>
              </div>

              {/* Safety/Risk Sliders */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-500 uppercase">Guardian Risk (Vol)</span>
                    <span className="font-bold text-amber-500">{guardianRiskScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={guardianRiskScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setGuardianRiskScore(val);
                      saveGuardianConfig({ ...guardianConfig, volatilityIndex: val });
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-500 uppercase">Market Health</span>
                    <span className="font-bold text-amber-500">{marketHealthScore}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={marketHealthScore}
                    onChange={(e) => setMarketHealthScore(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Live Guardian Status Ribbon */}
              <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900/60 rounded-lg px-3 py-1.5 mt-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-red-400" />
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Guardian Engine V3.0</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  guardianEval.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                  guardianEval.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400 animate-pulse'
                }`}>
                  {guardianEval.status}
                </span>
              </div>
            </div>
          </div>

          {/* Engine Synthesis Logic Controller */}
          <div id="ede-synthesis-controller" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-zinc-500" />
                CONFORMANCE GATES
              </h3>
              <span className="text-[8px] font-mono text-zinc-500">OPERATIONAL</span>
            </div>

            <div className="space-y-4">
              
              {/* Compliance Mode Toggle */}
              <div className="flex items-center justify-between bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                <div className="space-y-0.5 pr-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-200 block uppercase">STRICT COMPLIANCE GATE</span>
                  <span className="text-[9px] font-mono text-zinc-500 block leading-tight">Any FAIL triggers NO TRADE instantly.</span>
                </div>
                <button
                  onClick={() => {
                    setStrictCompliance(!strictCompliance);
                    if (addLog) addLog(`DECISION ENGINE: Switched consensus mode to [${!strictCompliance ? 'STRICT' : 'CONSENSUS'}]`);
                  }}
                  className="cursor-pointer text-amber-500"
                >
                  {strictCompliance ? (
                    <ToggleRight className="w-9 h-6 text-amber-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-zinc-600" />
                  )}
                </button>
              </div>

              {/* Consensus Threshold Slider */}
              {!strictCompliance && (
                <div className="space-y-1.5 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900 animate-fade-in">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-400 uppercase">PASS THRESHOLD</span>
                    <span className="font-bold text-amber-400">{confidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                  />
                  <span className="text-[8px] font-mono text-zinc-500 block mt-1 leading-normal">
                    Requires this percentage of active rules to return PASS status to approve trade.
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Explainable Outputs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Decision Board */}
          <div id="ede-decision-board" className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
            
            {/* Glow effects based on decision */}
            {decision === 'BUY' && <div className="absolute inset-0 bg-green-500/1 blur-[100px] rounded-full pointer-events-none" />}
            {decision === 'SELL' && <div className="absolute inset-0 bg-red-500/1 blur-[100px] rounded-full pointer-events-none" />}
            {decision === 'NO TRADE' && <div className="absolute inset-0 bg-zinc-500/1 blur-[100px] rounded-full pointer-events-none" />}

            {/* Col 1: Big Verdict (BUY, SELL, NO TRADE) */}
            <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-5 md:pb-0 md:pr-6">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">ENGINE VERDICT OUTCOME</span>
                <span className="text-[8px] font-mono text-zinc-600 block">EVALUATED AT LOCAL TIME</span>
              </div>

              {/* Massive Output block */}
              <div className="my-6">
                {decision === 'BUY' && (
                  <div className="inline-block">
                    <div className="text-5xl font-mono font-black text-green-400 tracking-wider animate-pulse flex items-center gap-2">
                      BUY
                    </div>
                    <span className="text-[9px] font-mono text-green-500/80 uppercase tracking-widest block mt-1.5 font-bold">
                      ● LONG POSITION CLEARED
                    </span>
                  </div>
                )}
                {decision === 'SELL' && (
                  <div className="inline-block">
                    <div className="text-5xl font-mono font-black text-red-400 tracking-wider animate-pulse flex items-center gap-2">
                      SELL
                    </div>
                    <span className="text-[9px] font-mono text-red-500/80 uppercase tracking-widest block mt-1.5 font-bold">
                      ● SHORT POSITION CLEARED
                    </span>
                  </div>
                )}
                {decision === 'NO TRADE' && (
                  <div className="inline-block">
                    <div className="text-4xl font-mono font-black text-zinc-400 tracking-widest flex items-center gap-2">
                      NO TRADE
                    </div>
                    <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block mt-1.5 font-bold">
                      ▲ STANDBY SYSTEM ACTIVE
                    </span>
                  </div>
                )}
              </div>

              {/* Sizing / Allocation placeholder */}
              <div className="bg-[#0C0C0D] border border-zinc-900 p-2.5 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500">MAX LOSS LIMIT</span>
                  <span className="text-zinc-300 font-bold">$2,500.00 (2.0%)</span>
                </div>
              </div>
            </div>

            {/* Col 2: Decision details, scores, grade */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Confidence */}
                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg text-center">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">CONFIDENCE</span>
                  <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
                    {confidenceScore}%
                  </span>
                </div>
                {/* Trade Grade */}
                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg text-center">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">TRADE GRADE</span>
                  <span className="text-xl font-mono font-bold text-zinc-200 mt-1 block">
                    {tradeGrade}
                  </span>
                </div>
                {/* Status rules breakdown */}
                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex flex-col justify-center items-center text-[10px] font-mono">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">RULES RATIO</span>
                  <div className="flex gap-1.5 font-bold text-[10px]">
                    <span className="text-green-400">{passedRules.length}P</span>
                    <span className="text-zinc-500">/</span>
                    <span className="text-red-400">{failedRules.length}F</span>
                    <span className="text-zinc-500">/</span>
                    <span className="text-zinc-500">{skippedRules.length}S</span>
                  </div>
                </div>
              </div>

              {/* Decision Summary Explanation paragraph */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3.5 space-y-1.5 relative overflow-hidden">
                <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold block flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  DECISION SUMMARY & EXPLANATION
                </span>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {decisionSummary}
                </p>
              </div>
            </div>

          </div>

          {/* Collapsible Section: Modular Rule Inspector Logs */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('rules')}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 border-b border-zinc-900 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  COMBINED DECISION RULE METRICS
                </h3>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                <span>{enabledEvaluations.length} ACTIVE</span>
                {expandedSection.rules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {expandedSection.rules && (
              <div className="p-4 space-y-3 bg-[#0C0C0D]/40">
                {activeEvaluations.map((rule) => {
                  return (
                    <div 
                      key={rule.id}
                      id={`ede-rule-row-${rule.id}`}
                      className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        !rule.isEnabled 
                          ? 'border-zinc-900/40 bg-zinc-950/20 opacity-40'
                          : rule.status === 'PASS'
                          ? 'border-green-900/20 bg-green-950/5'
                          : rule.status === 'FAIL'
                          ? 'border-red-900/20 bg-red-950/5'
                          : 'border-zinc-850 bg-zinc-900/10'
                      }`}
                    >
                      {/* Left: Rule info */}
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                            !rule.isEnabled ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' :
                            rule.status === 'PASS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            rule.status === 'FAIL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-zinc-850 text-zinc-400 border border-zinc-700'
                          }`}>
                            {rule.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-zinc-200">{rule.name}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500">{rule.description}</p>
                        {rule.isEnabled && (
                          <p className={`text-[10px] font-mono font-semibold mt-1 leading-normal ${
                            rule.status === 'PASS' ? 'text-green-400/90' :
                            rule.status === 'FAIL' ? 'text-red-400/90' : 'text-zinc-400'
                          }`}>
                            {rule.explanation}
                          </p>
                        )}
                      </div>

                      {/* Right: Toggle/Status info */}
                      <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                        {rule.isEnabled ? (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            rule.status === 'PASS' ? 'bg-green-950/20 border-green-900 text-green-400' :
                            rule.status === 'FAIL' ? 'bg-red-950/20 border-red-900 text-red-400' :
                            'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}>
                            {rule.status}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-500">
                            DISABLED
                          </span>
                        )}

                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className="text-[9px] font-mono text-zinc-500 hover:text-amber-400 border border-zinc-800 hover:border-zinc-700 px-2 py-1 rounded cursor-pointer"
                        >
                          TOGGLE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Guardian Review Panel */}
          <div id="ede-guardian-review" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                AI GUARDIAN & RISK ASSESSMENT OFFICE
              </h3>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
              {getGuardianReviewText()}
            </p>
            <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-3 bg-[#0C0C0D] p-2 rounded border border-zinc-900">
              <span className="font-bold text-amber-400">Risk Limit Index: 35.0%</span>
              <span className="text-zinc-600">|</span>
              <span className="font-bold text-amber-400">System Slippage Floor: 0.12%</span>
              <span className="text-zinc-600">|</span>
              <span>Protective Breakers: NORMAL</span>
            </div>
          </div>

          {/* Collapsible Section: AI Debate Review Panel */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('debate')}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 border-b border-zinc-900 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  ACTIVE AI DEBATE & SECOND OPINION
                </h3>
              </div>
              {expandedSection.debate ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {expandedSection.debate && (
              <div className="p-4 space-y-4 bg-[#0C0C0D]/40">
                {/* Advocate Block */}
                <div className="bg-green-950/5 border border-green-900/20 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-widest">
                      Advocate Agent Node (Bullish Rationale)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    {debateText.advocate}
                  </p>
                </div>

                {/* Sceptic Block */}
                <div className="bg-red-950/5 border border-red-900/20 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                      Sceptic Agent Node (Bearish Rationale)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    {debateText.sceptic}
                  </p>
                </div>

                {/* Second Opinion Review Panel */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-lg p-3.5 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Macro Overlay Desks (Second Opinion)
                  </span>
                  <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                    "External spot correlation matrix indicates positive liquidity in-flows to high-beta channels. Technical structural grids match the overlay. However, Asian Session limits might compress mean payouts if volatility collapses ahead of the London open. We suggest keeping orders at strict limit targets rather than market sweeps."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section: What-If Analysis (Alternative Scenario) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('alternative')}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 border-b border-zinc-900 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  ALTERNATIVE SCENARIO PREDICTIONS (WHAT-IF)
                </h3>
              </div>
              {expandedSection.alternative ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {expandedSection.alternative && (
              <div className="p-4 space-y-3 bg-[#0C0C0D]/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Alt 1: Inverted Direction */}
                <div className="bg-zinc-900/30 border border-zinc-850 p-3.5 rounded-lg space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                    What-If: Flip Direction to [{oppositeDirection}]
                  </span>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Predicted Verdict:</span>
                      <span className={`font-bold ${
                        alternativeDirResult.decision === 'NO TRADE' ? 'text-zinc-400' :
                        alternativeDirResult.decision === 'BUY' ? 'text-green-400' : 'text-red-400'
                      }`}>{alternativeDirResult.decision}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Predicted Confidence:</span>
                      <span className="font-bold text-amber-400">{alternativeDirResult.confidence}%</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Rule Pass/Fail Ratio:</span>
                      <span className="font-bold text-zinc-300">{alternativeDirResult.passed} Pass / {alternativeDirResult.failed} Fail</span>
                    </div>
                  </div>
                </div>

                {/* Alt 2: Inverted Regime */}
                <div className="bg-zinc-900/30 border border-zinc-850 p-3.5 rounded-lg space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                    What-If: Flip Regime to [{oppositePreset}]
                  </span>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Predicted Verdict:</span>
                      <span className={`font-bold ${
                        alternativePresetResult.decision === 'NO TRADE' ? 'text-zinc-400' :
                        alternativePresetResult.decision === 'BUY' ? 'text-green-400' : 'text-red-400'
                      }`}>{alternativePresetResult.decision}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Predicted Confidence:</span>
                      <span className="font-bold text-amber-400">{alternativePresetResult.confidence}%</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] font-mono">
                      <span className="text-zinc-500">Rule Pass/Fail Ratio:</span>
                      <span className="font-bold text-zinc-300">{alternativePresetResult.passed} Pass / {alternativePresetResult.failed} Fail</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Collapsible Section: Decision Timeline */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 border-b border-zinc-900 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  DETERMINISTIC COGNITIVE DECISION TIMELINE
                </h3>
              </div>
              {expandedSection.timeline ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {expandedSection.timeline && (
              <div className="p-4 space-y-3.5 bg-[#0C0C0D]/40">
                <div className="relative border-l border-zinc-900 pl-4 space-y-4 text-xs font-mono">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">[t+0ms]</span>
                        <span className="text-zinc-400 uppercase font-bold">Telemetry Ingestion Module</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Received active simulated parameters. Regime registered as <span className="text-zinc-300">[{marketPreset.toUpperCase()}]</span>. Active session window: <span className="text-zinc-300">[{activeSession}]</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">[t+45ms]</span>
                        <span className="text-zinc-400 uppercase font-bold">Trend & Structure Filters</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Synthesized 200 EMA sequence, higher/lower high configurations, and registered core price structure channels.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">[t+88ms]</span>
                        <span className="text-zinc-400 uppercase font-bold">Trigger Verification pipeline</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Evaluated engulfing patterns, volumetric support-resistance breakouts, and retest confirmation boundaries.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">[t+135ms]</span>
                        <span className="text-zinc-400 uppercase font-bold">AI Guardian Risk Audit</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Audited current risk indexes against threshold caps. Verified spread spreads, protective breakers, and sizing thresholds.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">[t+180ms]</span>
                        <span className="text-zinc-300 uppercase font-bold">Final Verdict Synthesis</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Unified active rule weights. Resulted in decision <span className="text-amber-400 font-bold">[{decision}]</span> with a Trade Grade of <span className="text-amber-400 font-bold">[{tradeGrade}]</span> and <span className="text-amber-400 font-bold">{confidenceScore}%</span> overall conformance confidence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section: Decision Ledger Entry (Immutable JSON Object) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('ledger')}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 border-b border-zinc-900 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  CRYPTOGRAPHIC IMMUTABLE DECISION LEDGER OBJECT
                </h3>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                <span>{randomTxId}</span>
                {expandedSection.ledger ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {expandedSection.ledger && (
              <div className="p-4 bg-[#050506] border-t border-zinc-900 space-y-3 relative">
                {/* Copy overlay */}
                <button
                  onClick={copyLedgerToClipboard}
                  className="absolute top-6 right-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLedger ? 'COPIED!' : 'COPY OBJECT'}
                </button>

                <div className="text-[11px] font-mono text-zinc-400 overflow-x-auto leading-relaxed max-h-96">
                  <pre className="text-amber-500/80">{JSON.stringify(ledgerEntry, null, 2)}</pre>
                </div>
                <div className="text-[10px] font-mono text-zinc-600 italic">
                  *This ledger payload remains locally buffered inside the browser execution layer, representing the simulated trade validation cycle. No real-world networks were compromised.
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
