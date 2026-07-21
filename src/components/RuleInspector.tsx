import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Play, Settings, Sliders, ToggleLeft, 
  ToggleRight, Info, Eye, ShieldAlert, Cpu, Award, HelpCircle, RefreshCw,
  TrendingUp, Compass, Activity, ArrowRightLeft
} from 'lucide-react';
import { evaluateRules } from '../plugins/ruleEngine';
import { RuleEngineInput, RuleEvaluation, RuleResultStatus } from '../types/rules';

interface RuleInspectorProps {
  addLog?: (log: string) => void;
}

export default function RuleInspector({ addLog }: RuleInspectorProps) {
  // Config parameters for simulated inputs
  const [marketPreset, setMarketPreset] = useState<RuleEngineInput['marketPreset']>('Bullish');
  const [activeSession, setActiveSession] = useState<string>('London & New York Overlap');
  const [guardianRiskScore, setGuardianRiskScore] = useState<number>(24);
  const [marketHealthScore, setMarketHealthScore] = useState<number>(85);
  const [selectedDirection, setSelectedDirection] = useState<RuleEngineInput['selectedDirection']>('BUY');
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(2.5);

  // Storage key for rule toggle states
  const STORAGE_KEY_TOGGLES = 'aq_rule_toggles_v11';
  
  // Default toggle states (all true by default)
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

  // Load toggles on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TOGGLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure any new rule is present
        setRuleToggles({ ...defaultToggles, ...parsed });
      } catch (e) {
        setRuleToggles(defaultToggles);
      }
    } else {
      setRuleToggles(defaultToggles);
    }

    // Load any saved parameter config if available
    const savedPreset = localStorage.getItem('aq_market_preset') as any;
    if (savedPreset) {
      setMarketPreset(savedPreset);
    }
  }, []);

  // Sync state changes back to evaluations
  useEffect(() => {
    const input: RuleEngineInput = {
      marketPreset,
      activeSession,
      guardianRiskScore,
      marketHealthScore,
      selectedDirection,
      riskRewardRatio,
    };
    
    const results = evaluateRules(input, ruleToggles);
    setEvaluations(results);
  }, [marketPreset, activeSession, guardianRiskScore, marketHealthScore, selectedDirection, riskRewardRatio, ruleToggles]);

  // Handle toggling rule
  const toggleRule = (id: string) => {
    const nextToggles = { ...ruleToggles, [id]: !ruleToggles[id] };
    setRuleToggles(nextToggles);
    localStorage.setItem(STORAGE_KEY_TOGGLES, JSON.stringify(nextToggles));
    
    if (addLog) {
      const ruleName = evaluations.find(r => r.id === id)?.name || id;
      addLog(`RULE ENGINE: Operator ${!ruleToggles[id] ? 'ENABLED' : 'DISABLED'} rule [${ruleName}]`);
    }
  };

  // Helper status color mapping
  const getStatusDisplay = (status: RuleResultStatus) => {
    switch (status) {
      case 'PASS':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
          bg: 'bg-green-950/20 border border-green-900/30 text-green-400',
          text: 'PASS',
          dot: 'bg-green-500'
        };
      case 'FAIL':
        return {
          icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
          bg: 'bg-red-950/20 border border-red-900/30 text-red-400',
          text: 'FAIL',
          dot: 'bg-red-500'
        };
      case 'SKIPPED':
        return {
          icon: <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />,
          bg: 'bg-zinc-900/50 border border-zinc-800 text-zinc-400',
          text: 'SKIPPED',
          dot: 'bg-zinc-500'
        };
    }
  };

  // Count summaries
  const totalEnabled = evaluations.filter(e => e.isEnabled).length;
  const passedCount = evaluations.filter(e => e.status === 'PASS').length;
  const failedCount = evaluations.filter(e => e.status === 'FAIL').length;
  const skippedCount = evaluations.filter(e => e.status === 'SKIPPED').length;

  const passRate = totalEnabled > 0 ? Math.round((passedCount / totalEnabled) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Engine Banner */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/3 blur-3xl rounded-full" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
              v1.1 RELEASE
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">STANDALONE DECISION UNIT</span>
          </div>
          <h2 className="text-sm font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500 animate-spin-slow" />
            AQ QUANTITATIVE RULE ENGINE
          </h2>
          <p className="text-[11px] font-mono text-zinc-500 leading-relaxed max-w-xl">
            Evaluate and inspect complex trade setups in a risk-free environment. Rules run instantly against active market telemetry and structural filters.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="bg-[#0C0C0D] border border-zinc-900 px-5 py-3 rounded-lg flex items-center gap-4 shrink-0 relative z-10">
          <div className="text-center">
            <span className="text-[8px] font-mono text-zinc-500 block uppercase">PASS RATE</span>
            <span className="text-lg font-mono font-bold text-amber-400">{passRate}%</span>
          </div>
          <div className="w-[1px] h-8 bg-zinc-850" />
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div>
              <span className="text-green-400 block font-bold">{passedCount}</span>
              <span className="text-[8px] text-zinc-500 block">PASS</span>
            </div>
            <div>
              <span className="text-red-400 block font-bold">{failedCount}</span>
              <span className="text-[8px] text-zinc-500 block">FAIL</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-bold">{skippedCount}</span>
              <span className="text-[8px] text-zinc-500 block">SKIP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Interactive Parameter Controller */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6 self-start">
          <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              TELEMETRY INJECTOR
            </h3>
            <span className="text-[8px] font-mono text-zinc-500">SIMULATOR ACTIVE</span>
          </div>

          <div className="space-y-4">
            
            {/* Market Preset */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Active Market Regime</label>
              <select
                value={marketPreset}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setMarketPreset(val);
                  localStorage.setItem('aq_market_preset', val);
                  if (addLog) addLog(`RULE SIMULATION: Switched telemetry preset to [${val.toUpperCase()}]`);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-amber-500/30"
              >
                <option value="Bullish">Bullish Expansion</option>
                <option value="Bearish">Bearish Markdown</option>
                <option value="Sideways">Mean-Reverting Range</option>
                <option value="Extreme">Extreme Flash Liquid</option>
              </select>
            </div>

            {/* Simulated Direction */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Simulated Direction</label>
              <div className="grid grid-cols-2 bg-zinc-900 border border-zinc-850 rounded-xl p-1">
                <button
                  onClick={() => {
                    setSelectedDirection('BUY');
                    if (addLog) addLog(`RULE SIMULATION: Simulated trade path set to [BUY / LONG]`);
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
                    selectedDirection === 'BUY'
                      ? 'bg-green-500 text-black shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  onClick={() => {
                    setSelectedDirection('SELL');
                    if (addLog) addLog(`RULE SIMULATION: Simulated trade path set to [SELL / SHORT]`);
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
                    selectedDirection === 'SELL'
                      ? 'bg-red-500 text-black shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

            {/* Target Risk Reward */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Target Risk-Reward</label>
                <span className="text-[11px] font-mono font-bold text-amber-400">{riskRewardRatio.toFixed(1)}:1</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={riskRewardRatio}
                onChange={(e) => setRiskRewardRatio(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
              />
            </div>

            {/* Simulated Session */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Active Global Session</label>
              <select
                value={activeSession}
                onChange={(e) => {
                  setActiveSession(e.target.value);
                  if (addLog) addLog(`RULE SIMULATION: Global timing block set to [${e.target.value.toUpperCase()}]`);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-amber-500/30"
              >
                <option value="London & New York Overlap">London & NY Overlap (High volume)</option>
                <option value="New York Session">New York Open (Active buying)</option>
                <option value="London Session">London Open (Early markup)</option>
                <option value="Asian Session">Asian Range Hours (Thin order book)</option>
              </select>
            </div>

            {/* AI Guardian Risk Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Guardian Risk Index</label>
                <span className={`text-[11px] font-mono font-bold ${
                  guardianRiskScore <= 35 ? 'text-green-400' :
                  guardianRiskScore <= 70 ? 'text-amber-500' : 'text-red-400'
                }`}>{guardianRiskScore} / 100</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={guardianRiskScore}
                onChange={(e) => setGuardianRiskScore(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
              />
            </div>

            {/* Market Health Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Market Health Score</label>
                <span className={`text-[11px] font-mono font-bold ${
                  marketHealthScore >= 70 ? 'text-green-400' :
                  marketHealthScore >= 40 ? 'text-amber-500' : 'text-red-400'
                }`}>{marketHealthScore} / 100</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={marketHealthScore}
                onChange={(e) => setMarketHealthScore(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-900 rounded-lg appearance-none"
              />
            </div>

          </div>

          <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg text-center leading-normal">
            <span className="text-[9px] font-mono text-zinc-600 block">DANGER REDIRECTS DISMISSED</span>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">Rule Engine acts solely in evaluation mode. Live execution signals remain offline.</p>
          </div>
        </div>

        {/* Right Modular Rule Inspection Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex items-center justify-between bg-[#0C0C0D] border border-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-serif font-bold text-zinc-200 uppercase tracking-wide">ACTIVE CHECKLIST RE-EVALUATION LOGS</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {totalEnabled} OF 10 RULES INJECTED
            </span>
          </div>

          {/* List of rules */}
          <div className="space-y-3.5">
            {evaluations.map((rule) => {
              const statusDisplay = getStatusDisplay(rule.status);
              
              return (
                <div 
                  key={rule.id}
                  id={`rule-card-${rule.id}`}
                  className={`bg-zinc-950 border rounded-xl p-4 transition-all hover:bg-zinc-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    rule.isEnabled 
                      ? 'border-zinc-900' 
                      : 'border-zinc-900/40 opacity-50'
                  }`}
                >
                  {/* Left block - Info and Name */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {rule.category}
                      </span>
                      <h4 className="text-xs font-mono font-bold text-zinc-200">
                        {rule.name}
                      </h4>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                      {rule.description}
                    </p>
                    {rule.isEnabled && (
                      <div className="bg-[#0C0C0D] border border-zinc-900/80 rounded px-2.5 py-1.5 text-[10px] font-mono text-zinc-400 leading-normal">
                        <span className="text-zinc-500 mr-1 uppercase font-bold">Explanation:</span>
                        {rule.explanation}
                      </div>
                    )}
                  </div>

                  {/* Right block - Toggle and Status Badge */}
                  <div className="flex items-center gap-4 shrink-0 self-start md:self-center">
                    
                    {/* Status Display */}
                    {rule.isEnabled && (
                      <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 ${statusDisplay.bg}`}>
                        {statusDisplay.icon}
                        <span>{statusDisplay.text}</span>
                      </div>
                    )}

                    {/* Active/Inactive Toggle Switch */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="cursor-pointer transition-transform duration-100 hover:scale-105"
                      title={rule.isEnabled ? "Disable Rule" : "Enable Rule"}
                    >
                      {rule.isEnabled ? (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase">
                          <span>ENABLED</span>
                          <ToggleRight className="w-4 h-4 text-amber-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-1 rounded-lg text-[9px] font-mono uppercase font-bold">
                          <span>DISABLED</span>
                          <ToggleLeft className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
