import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Power, RefreshCw, Info, CheckCircle2, 
  AlertTriangle, XCircle, Sliders, DollarSign, Activity, Clock, Percent, AlertCircle
} from 'lucide-react';
import { GuardianConfig, GuardianEvaluation } from '../types/guardian';
import { evaluateGuardianRisk, loadGuardianConfig, saveGuardianConfig, DEFAULT_GUARDIAN_CONFIG } from '../plugins/guardianRiskEngine';

interface AIGuardianProps {
  addLog: (log: string) => void;
}

export default function AIGuardian({ addLog }: AIGuardianProps) {
  const [config, setConfig] = useState<GuardianConfig>(() => loadGuardianConfig());
  const [evaluation, setEvaluation] = useState<GuardianEvaluation>(() => evaluateGuardianRisk(loadGuardianConfig()));

  // Re-calculate whenever config updates
  useEffect(() => {
    const ev = evaluateGuardianRisk(config);
    setEvaluation(ev);
    saveGuardianConfig(config);
  }, [config]);

  // Synchronize from localStorage on an interval in case other components edit it
  useEffect(() => {
    const sync = () => {
      const current = loadGuardianConfig();
      // Only set if string representation differs to avoid infinite rendering
      if (JSON.stringify(current) !== JSON.stringify(config)) {
        setConfig(current);
      }
    };
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [config]);

  const updateParam = <K extends keyof GuardianConfig>(key: K, value: GuardianConfig[K]) => {
    const next = { ...config, [key]: value };
    setConfig(next);
  };

  const handleApplyInstitutionalReset = () => {
    setConfig(DEFAULT_GUARDIAN_CONFIG);
    addLog('AI: Admin restored institutional risk guardrails to safe defaults (V2.2 Standard).');
  };

  const handleToggleKillSwitch = () => {
    const nextVal = !config.emergencyKillSwitch;
    updateParam('emergencyKillSwitch', nextVal);
    if (nextVal) {
      addLog('SYS: EMERGENCY KILL SWITCH ACTIVATED! Automated routing pipelines severed.');
    } else {
      addLog('SYS: Emergency kill switch deactivated. Algorithmic pipeline unlocked.');
    }
  };

  // UI styling based on output
  const getOutputStyle = () => {
    switch (evaluation.status) {
      case 'APPROVED':
        return {
          glow: 'border-emerald-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-emerald-950/10 shadow-[0_0_30px_rgba(16,185,129,0.06)]',
          badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          text: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          indicatorIcon: <ShieldCheck className="w-10 h-10 text-emerald-400" />,
          desc: 'CLEAR PIPELINE: All 11 safety parameters verified. Orders may proceed to live liquidity pools.'
        };
      case 'WARNING':
        return {
          glow: 'border-amber-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/10 shadow-[0_0_30px_rgba(245,158,11,0.06)]',
          badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          text: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          indicatorIcon: <AlertTriangle className="w-10 h-10 text-amber-400 animate-pulse" />,
          desc: 'CAUTION GATED: Marginal tolerances identified. Restricted leverage and limit-only rules enforced.'
        };
      default: // BLOCKED
        return {
          glow: 'border-red-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/10 shadow-[0_0_30px_rgba(239,68,68,0.06)]',
          badge: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse',
          text: 'text-red-400',
          iconBg: 'bg-red-500/10 border-red-500/20 text-red-400',
          indicatorIcon: <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />,
          desc: 'PIPELINE ENGAGED: Automated order dispatch frozen. Critical risk or psychological boundaries violated.'
        };
    }
  };

  const uiStyle = getOutputStyle();

  return (
    <div className="space-y-6">
      
      {/* Banner & Control Switch */}
      <div id="guardian-risk-header" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/[0.01] blur-3xl rounded-full" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
              VERSION 2.2 GUARD
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              GUARDIAN RISK PROTOCOL MATRIX
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            GUARDIAN RISK ENFORCEMENT ENGINE
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            A premium full-spectrum execution gatekeeper. It evaluates live spreads, timing constraints, portfolio buffers, and behavioral volatility rules before releasing trades to broker routes.
          </p>
        </div>

        {/* Global Controls & Emergency Kill Switch Trigger */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={handleApplyInstitutionalReset}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Institutional Reset
          </button>
          
          <button
            onClick={handleToggleKillSwitch}
            className={`px-4 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
              config.emergencyKillSwitch 
                ? 'bg-red-500 border-red-400 text-black shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-400' 
                : 'bg-zinc-900/80 border-zinc-850 text-red-400 hover:bg-zinc-800 hover:text-red-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {config.emergencyKillSwitch ? 'KILL SWITCH ENGAGED' : 'ENGAGE KILL SWITCH'}
          </button>
        </div>
      </div>

      {/* Main Grid: Status Display & interactive controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Guardian status & breakdown list (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main Status Badge */}
          <div className={`border rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${uiStyle.glow}`}>
            <div className={`p-4 rounded-full border mb-4 ${uiStyle.iconBg}`}>
              {uiStyle.indicatorIcon}
            </div>

            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              SYSTEM DECISION CORE
            </span>
            <h3 className={`text-2xl font-serif font-black tracking-wider mt-1 uppercase ${uiStyle.text}`}>
              {evaluation.status}
            </h3>

            <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed max-w-sm">
              {uiStyle.desc}
            </p>

            <div className="w-full border-t border-zinc-900/80 my-4 pt-4 flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>ACTIVE COGNITION</span>
              <span>UTC MONITORED</span>
            </div>

            {evaluation.status === 'BLOCKED' && (
              <div className="w-full bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-left">
                <span className="text-[8px] font-mono font-bold text-red-400 block uppercase mb-1">
                  BLOCKED EXPLANATIONS
                </span>
                <p className="text-[10px] font-mono text-red-400/90 leading-normal">
                  {evaluation.overallReason}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Safeguard Protocol Matrix with 11 item check statuses */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              SAFEGUARDS MATRICES (11 / 11 VERIFIED)
            </h4>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {evaluation.verifications.map((check) => (
                <div 
                  key={check.id}
                  className="bg-[#0C0C0D] border border-zinc-900/60 p-3 rounded-lg flex gap-3 transition-colors hover:border-zinc-800"
                >
                  <div className="shrink-0 mt-0.5">
                    {check.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : check.status === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-serif font-bold text-zinc-200">{check.name}</span>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase ${
                        check.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' :
                        check.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400 leading-normal">
                      {check.explanation}
                    </p>
                    <div className="flex gap-4 pt-1 text-[8px] font-mono text-zinc-500">
                      <span>Value: <strong className="text-zinc-300 font-normal">{check.value}</strong></span>
                      <span>Limit: <strong className="text-zinc-300 font-normal">{check.limit}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex gap-2.5">
              <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                Guardian Risk Engine restricts automated portfolio interactions client-side. Trigger criteria are dynamic.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: sliders & config parameters (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              PARAMETER CONTROL GATEWAY
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Adjust sliders to trigger warnings/blocks across different risk parameters
            </p>
          </div>

          <div className="space-y-5 font-mono text-xs">
            
            {/* Row 1: Market Open & Trading Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-[#0A0A0B] border border-zinc-900 rounded-lg">
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">1. Exchange Status</span>
                <label className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg cursor-pointer hover:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={config.marketOpen}
                    onChange={(e) => updateParam('marketOpen', e.target.checked)}
                    className="accent-red-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">Market Open status</span>
                    <span className="text-[9px] text-zinc-500">Simulate exchange hours</span>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">2. Active Session Block</span>
                <select
                  value={config.activeSession}
                  onChange={(e) => updateParam('activeSession', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/40 cursor-pointer text-xs"
                >
                  <option value="London">London & New York Overlap (Optimal)</option>
                  <option value="New York">New York Trading Session</option>
                  <option value="Tokyo">Tokyo Trading Session (Warning)</option>
                  <option value="Sydney">Sydney Trading Session (Warning)</option>
                  <option value="Off-Hours">Off-Hours / Bank Closed (Blocked)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Spread and Volatility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>3. Bid-Ask Spread</span>
                  <span className={`font-bold ${config.spreadBps > config.maxSpreadBps ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.spreadBps} BPS / Max {config.maxSpreadBps}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Spread Bps</span>
                    <span>{config.spreadBps} bps</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={config.spreadBps}
                    onChange={(e) => updateParam('spreadBps', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Max Allowed Limit</span>
                    <span>{config.maxSpreadBps} bps</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={config.maxSpreadBps}
                    onChange={(e) => updateParam('maxSpreadBps', parseInt(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>4. Dynamic Volatility</span>
                  <span className={`font-bold ${config.volatilityIndex > config.maxVolatilityIndex ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.volatilityIndex}% / Max {config.maxVolatilityIndex}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Current Volatility</span>
                    <span>{config.volatilityIndex}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.volatilityIndex}
                    onChange={(e) => updateParam('volatilityIndex', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Max Allowed Limit</span>
                    <span>{config.maxVolatilityIndex}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={config.maxVolatilityIndex}
                    onChange={(e) => updateParam('maxVolatilityIndex', parseInt(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Row 3: Confidence Score & Risk Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>5. Min Confidence</span>
                  <span className="font-bold text-amber-500">
                    Threshold: {config.minConfidenceScore}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Required Consensus</span>
                    <span>{config.minConfidenceScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={config.minConfidenceScore}
                    onChange={(e) => updateParam('minConfidenceScore', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[9px] font-mono text-zinc-500 leading-normal">
                  Requires structural alignments (such as multi-timeframe concordance scores) to exceed this gate prior to release.
                </p>
              </div>

              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>6. Risk-to-Reward Ratio</span>
                  <span className={`font-bold ${config.riskRewardRatio < config.minRiskRewardRatio ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.riskRewardRatio.toFixed(1)}:1 / Min {config.minRiskRewardRatio.toFixed(1)}:1
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Active Setup Ratio</span>
                    <span>{config.riskRewardRatio.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={config.riskRewardRatio}
                    onChange={(e) => updateParam('riskRewardRatio', parseFloat(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Minimum Safe Threshold</span>
                    <span>{config.minRiskRewardRatio.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="3"
                    step="0.1"
                    value={config.minRiskRewardRatio}
                    onChange={(e) => updateParam('minRiskRewardRatio', parseFloat(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Row 4: Daily Loss & Open Trades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>7. Daily Loss Drawdown</span>
                  <span className={`font-bold ${config.dailyLoss >= config.maxDailyLossLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                    ${config.dailyLoss} / Max ${config.maxDailyLossLimit}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Intraday Accumulated Loss</span>
                    <span>${config.dailyLoss}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={config.dailyLoss}
                    onChange={(e) => updateParam('dailyLoss', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Intraday Drawdown Stop cap</span>
                    <span>${config.maxDailyLossLimit}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={config.maxDailyLossLimit}
                    onChange={(e) => updateParam('maxDailyLossLimit', parseInt(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>8. Max Open Trades</span>
                  <span className={`font-bold ${config.currentOpenTrades >= config.maxOpenTradesLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.currentOpenTrades} / Max {config.maxOpenTradesLimit}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Current Active Exposures</span>
                    <span>{config.currentOpenTrades} positions</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.currentOpenTrades}
                    onChange={(e) => updateParam('currentOpenTrades', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>System Allocation Limit</span>
                    <span>{config.maxOpenTradesLimit} positions</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.maxOpenTradesLimit}
                    onChange={(e) => updateParam('maxOpenTradesLimit', parseInt(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Row 5: Max Risk % & Account Protection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>9. Max Risk % Per Trade</span>
                  <span className={`font-bold ${config.tradeRiskPercent > config.maxRiskPercentLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.tradeRiskPercent}% / Max {config.maxRiskPercentLimit}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Setup Risk Allocation</span>
                    <span>{config.tradeRiskPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={config.tradeRiskPercent}
                    onChange={(e) => updateParam('tradeRiskPercent', parseFloat(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Hard Protective Cap</span>
                    <span>{config.maxRiskPercentLimit}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={config.maxRiskPercentLimit}
                    onChange={(e) => updateParam('maxRiskPercentLimit', parseFloat(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>10. Account Equity Cushion</span>
                  <span className={`font-bold ${config.accountEquityCushion < config.minAccountEquityCushion ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.accountEquityCushion}% / Min Required {config.minAccountEquityCushion}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Unrealized Equity Cushion</span>
                    <span>{config.accountEquityCushion}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={config.accountEquityCushion}
                    onChange={(e) => updateParam('accountEquityCushion', parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Min Security Floor</span>
                    <span>{config.minAccountEquityCushion}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="90"
                    value={config.minAccountEquityCushion}
                    onChange={(e) => updateParam('minAccountEquityCushion', parseInt(e.target.value))}
                    className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
