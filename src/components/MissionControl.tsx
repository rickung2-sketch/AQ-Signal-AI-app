import React, { useState, useEffect } from 'react';
import { 
  Target, CheckSquare, Square, DollarSign, ArrowUpRight, Percent, 
  Award, AlertCircle, Cpu, Layers, TrendingUp, Flame, Clock, Compass, Activity,
  AlertTriangle
} from 'lucide-react';
import { generateHistoricalOrTestData } from '../plugins/marketDataPluginRegistry';
import { calculateMultiTimeframe } from '../plugins/multiTimeframeEngine';
import { TimeframeAlignmentState } from '../types/multiTimeframe';
import TimeframeAlignmentCard from './TimeframeAlignmentCard';
import { Shield } from 'lucide-react';
import { loadGuardianConfig, evaluateGuardianRisk } from '../plugins/guardianRiskEngine';
import { ScannerEvent } from '../types/marketScanner';
import { indicatorService } from '../plugins/indicatorService';
import { IndicatorEngineState } from '../types/indicatorEngine';
import { structureService } from '../plugins/structureService';
import { MarketStructureEngineState } from '../types/structureEngine';

interface MissionControlProps {
  addLog: (log: string) => void;
  onUpdateReadiness: (scoreDiff: number) => void;
  opportunities: ScannerEvent[];
}

export default function MissionControl({ addLog, onUpdateReadiness, opportunities }: MissionControlProps) {
  const [balance, setBalance] = useState(128450.00);
  const [intelState, setIntelState] = useState<any>(null);
  const [timeframeState, setTimeframeState] = useState<TimeframeAlignmentState | null>(null);
  const [indicators, setIndicators] = useState<IndicatorEngineState>(() => indicatorService.getState());
  const [structure, setStructure] = useState<MarketStructureEngineState | null>(() => structureService.getState());

  useEffect(() => {
    const unsubscribeIndicators = indicatorService.subscribe((state) => {
      setIndicators(state);
    });
    const unsubscribeStructure = structureService.subscribe((state) => {
      setStructure(state);
    });
    return () => {
      unsubscribeIndicators();
      unsubscribeStructure();
    };
  }, []);

  const [rankingFilter, setRankingFilter] = useState<'ALL' | 'Elite' | 'Good' | 'Watch' | 'No Trade'>('ALL');
  const [expandedOpps, setExpandedOpps] = useState<Record<string, boolean>>({});

  const toggleOppExpand = (id: string) => {
    setExpandedOpps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sortedOpps = [...(opportunities || [])].sort((a, b) => b.overallScore - a.overallScore);
  const filteredOpps = sortedOpps.filter(o => rankingFilter === 'ALL' || o.rankingLevel === rankingFilter);

  const [guardianConfig, setGuardianConfig] = useState(() => loadGuardianConfig());

  useEffect(() => {
    const sync = () => {
      setGuardianConfig(loadGuardianConfig());
    };
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, []);

  const guardianEval = evaluateGuardianRisk(guardianConfig);

  useEffect(() => {
    const loadState = () => {
      const preset = (localStorage.getItem('aq_market_preset') || 'Bullish') as any;
      setIntelState(generateHistoricalOrTestData(preset));
      setTimeframeState(calculateMultiTimeframe(preset));
    };
    loadState();
    const interval = setInterval(loadState, 2000);
    return () => clearInterval(interval);
  }, []);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Confirm global macroeconomic risk events on calendar', completed: false, weight: 10 },
    { id: 2, text: 'Analyze and map primary support/resistance keyframes', completed: false, weight: 15 },
    { id: 3, text: 'Review prior trading session ledger and logged lessons', completed: false, weight: 10 },
    { id: 4, text: 'Complete dynamic AQ Core sensor calibration suite', completed: false, weight: 10 },
    { id: 5, text: 'Define absolute maximum trade risk exposure limits', completed: false, weight: 20 },
    { id: 6, text: 'Perform personal mental and emotional check-in', completed: false, weight: 15 },
    { id: 7, text: 'Verify AI Guardian safety triggers are online', completed: false, weight: 20 }
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        // Update Readiness Score dynamically depending on checklist items
        onUpdateReadiness(nextState ? item.weight : -item.weight);
        addLog(`SYS: Checklist updated [${item.text.substring(0, 24)}...] = ${nextState ? 'COMPLETED' : 'PENDING'}`);
        return { ...item, completed: nextState };
      }
      return item;
    }));
  };

  const completedCount = checklist.filter(i => i.isActive ?? i.completed).length;
  const totalWeight = checklist.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              AQ VIRTUAL PORTFOLIO
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono text-green-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +2.45%
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 mt-2">
            MOCK EQUITY VALUE (AQ ACTIVE SEED)
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              WIN / LOSS RATIO
            </span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              72.4%
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              29 WIN / 11 LOSS
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 mt-2">
            CALCULATED OVER RECENT 40 LEDGER ENTRIES
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              MISSION TARGET LEVEL
            </span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              $150,000
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              85.6% ACHIEVED
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 mt-2">
            CONVECTIVE RETIREMENT CAP GOAL
          </p>
        </div>
      </div>

      {/* Timeframe Alignment Real-Time Feed (V2.1) */}
      {timeframeState && (
        <TimeframeAlignmentCard 
          alignmentState={timeframeState} 
          onRefresh={() => {
            const preset = (localStorage.getItem('aq_market_preset') || 'Bullish') as any;
            setTimeframeState(calculateMultiTimeframe(preset));
            addLog('SYS: Manually forced multi-timeframe alignment re-computation.');
          }}
        />
      )}

      {/* Guardian Risk Engine V3.0 Real-time Dashboard Ribbon */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.005] blur-2xl rounded-full" />
        <div className="flex items-center gap-3.5 z-10">
          <div className={`p-2.5 rounded-lg border ${
            guardianEval.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            guardianEval.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">
                GUARDIAN RISK GATEWAY V3.0
              </h4>
              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                guardianEval.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                guardianEval.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400 animate-pulse'
              }`}>
                {guardianEval.status}
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              {guardianEval.overallReason}
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-mono shrink-0 z-10">
          <div className="bg-[#0C0C0D] border border-zinc-900 px-3 py-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px] uppercase">Daily Loss</span>
            <span className="text-zinc-200 font-bold">${guardianConfig.dailyLoss}/${guardianConfig.maxDailyLossLimit}</span>
          </div>
          <div className="bg-[#0C0C0D] border border-zinc-900 px-3 py-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px] uppercase">Open Trades</span>
            <span className="text-zinc-200 font-bold">{guardianConfig.currentOpenTrades}/{guardianConfig.maxOpenTradesLimit}</span>
          </div>
          <div className="bg-[#0C0C0D] border border-zinc-900 px-3 py-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px] uppercase">Risk Per Trade</span>
            <span className="text-zinc-200 font-bold">{guardianConfig.tradeRiskPercent}%</span>
          </div>
        </div>
      </div>

      {/* Live Quantitative Indicators - Version 5.1 Indicator Engine */}
      <div id="mission-control-engines" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              INDICATOR ENGINE V5.1 (LIVE FEEDS)
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            {localStorage.getItem('aq_mkt_symbol') || 'XAU/USD'} @ {localStorage.getItem('aq_mkt_timeframe') || '15M'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. EMA 50 */}
          <div id="health-ema-50" className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                EMA (50)
              </span>
              {indicators.ema50 && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    indicators.ema50.signal === 'BUY' ? 'bg-emerald-400' :
                    indicators.ema50.signal === 'SELL' ? 'bg-red-400' : 'bg-amber-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    indicators.ema50.signal === 'BUY' ? 'bg-emerald-500' :
                    indicators.ema50.signal === 'SELL' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></span>
                </span>
              )}
            </div>
            {indicators.ema50 ? (
              <div className="space-y-2">
                <div className="text-lg font-bold font-mono text-zinc-100 tracking-tight">
                  ${indicators.ema50.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className="text-zinc-500">Direction:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    indicators.ema50.direction === 'UP' ? 'text-green-400' :
                    indicators.ema50.direction === 'DOWN' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {indicators.ema50.direction === 'UP' ? '▲ UP' :
                     indicators.ema50.direction === 'DOWN' ? '▼ DOWN' : '◀▶ FLAT'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pb-1">
                  <span className="text-zinc-500">Signal:</span>
                  <span className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                    indicators.ema50.signal === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    indicators.ema50.signal === 'SELL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}>
                    {indicators.ema50.signal}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Confidence:</span>
                    <span className="text-amber-500 font-bold">{indicators.ema50.confidence}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${indicators.ema50.confidence}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-600 block text-right mt-1 font-mono">
                    Updated: {new Date(indicators.ema50.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-600 py-4 text-center">Calculating EMA-50 telemetry...</div>
            )}
          </div>

          {/* 2. EMA 200 */}
          <div id="health-ema-200" className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                EMA (200)
              </span>
              {indicators.ema200 && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    indicators.ema200.signal === 'BUY' ? 'bg-emerald-400' :
                    indicators.ema200.signal === 'SELL' ? 'bg-red-400' : 'bg-amber-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    indicators.ema200.signal === 'BUY' ? 'bg-emerald-500' :
                    indicators.ema200.signal === 'SELL' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></span>
                </span>
              )}
            </div>
            {indicators.ema200 ? (
              <div className="space-y-2">
                <div className="text-lg font-bold font-mono text-zinc-100 tracking-tight">
                  ${indicators.ema200.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className="text-zinc-500">Direction:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    indicators.ema200.direction === 'UP' ? 'text-green-400' :
                    indicators.ema200.direction === 'DOWN' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {indicators.ema200.direction === 'UP' ? '▲ UP' :
                     indicators.ema200.direction === 'DOWN' ? '▼ DOWN' : '◀▶ FLAT'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pb-1">
                  <span className="text-zinc-500">Signal:</span>
                  <span className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                    indicators.ema200.signal === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    indicators.ema200.signal === 'SELL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}>
                    {indicators.ema200.signal}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Confidence:</span>
                    <span className="text-amber-500 font-bold">{indicators.ema200.confidence}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${indicators.ema200.confidence}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-600 block text-right mt-1 font-mono">
                    Updated: {new Date(indicators.ema200.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-600 py-4 text-center">Calculating EMA-200 telemetry...</div>
            )}
          </div>

          {/* 3. ATR 14 */}
          <div id="health-atr-14" className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                ATR (14)
              </span>
              {indicators.atr14 && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    indicators.atr14.signal === 'HIGH' ? 'bg-amber-400' : 'bg-zinc-500'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    indicators.atr14.signal === 'HIGH' ? 'bg-amber-500' : 'bg-zinc-600'
                  }`}></span>
                </span>
              )}
            </div>
            {indicators.atr14 ? (
              <div className="space-y-2">
                <div className="text-lg font-bold font-mono text-zinc-100 tracking-tight">
                  ${indicators.atr14.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className="text-zinc-500">Direction:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    indicators.atr14.direction === 'UP' ? 'text-amber-400' :
                    indicators.atr14.direction === 'DOWN' ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    {indicators.atr14.direction === 'UP' ? '▲ EXPANDING' :
                     indicators.atr14.direction === 'DOWN' ? '▼ CONTRACTING' : '◀▶ STEADY'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pb-1">
                  <span className="text-zinc-500">Signal:</span>
                  <span className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                    indicators.atr14.signal === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    indicators.atr14.signal === 'LOW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-zinc-850 text-zinc-400 border border-zinc-700/50'
                  }`}>
                    {indicators.atr14.signal}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Confidence:</span>
                    <span className="text-amber-500 font-bold">{indicators.atr14.confidence}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${indicators.atr14.confidence}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-600 block text-right mt-1 font-mono">
                    Updated: {new Date(indicators.atr14.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-600 py-4 text-center">Calculating ATR-14 telemetry...</div>
            )}
          </div>

          {/* 4. RSI 14 */}
          <div id="health-rsi-14" className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                RSI (14)
              </span>
              {indicators.rsi14 && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    indicators.rsi14.signal === 'OVERSOLD' ? 'bg-emerald-400' :
                    indicators.rsi14.signal === 'OVERBOUGHT' ? 'bg-red-400' : 'bg-zinc-500'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    indicators.rsi14.signal === 'OVERSOLD' ? 'bg-emerald-500' :
                    indicators.rsi14.signal === 'OVERBOUGHT' ? 'bg-red-500' : 'bg-zinc-600'
                  }`}></span>
                </span>
              )}
            </div>
            {indicators.rsi14 ? (
              <div className="space-y-2">
                <div className="text-lg font-bold font-mono tracking-tight text-zinc-100 flex items-center justify-between">
                  <span>{indicators.rsi14.value.toFixed(2)}</span>
                  <span className="text-[10px] font-normal text-zinc-500">momentum</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className="text-zinc-500">Direction:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    indicators.rsi14.direction === 'UP' ? 'text-green-400' :
                    indicators.rsi14.direction === 'DOWN' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {indicators.rsi14.direction === 'UP' ? '▲ UP' :
                     indicators.rsi14.direction === 'DOWN' ? '▼ DOWN' : '◀▶ FLAT'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pb-1">
                  <span className="text-zinc-500">Signal:</span>
                  <span className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                    indicators.rsi14.signal === 'OVERSOLD' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    indicators.rsi14.signal === 'OVERBOUGHT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}>
                    {indicators.rsi14.signal}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Confidence:</span>
                    <span className="text-amber-500 font-bold">{indicators.rsi14.confidence}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${indicators.rsi14.confidence}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-600 block text-right mt-1 font-mono">
                    Updated: {new Date(indicators.rsi14.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-600 py-4 text-center">Calculating RSI-14 telemetry...</div>
            )}
          </div>

        </div>
      </div>

      {/* Live Market Structure Engine - Version 6.0 */}
      <div id="mission-control-structure" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              MARKET STRUCTURE ENGINE V6.0 (REAL-TIME AUTOMATION)
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            QUANT STRUCTURAL ANALYZER
          </span>
        </div>

        {structure ? (
          <div className="space-y-4">
            {/* Top row: Trend & Strength */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0b] border border-zinc-900 p-4 rounded-lg">
              {/* Trend Direction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Trend Direction</span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">Confidence: {structure.trendDirection.confidence}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold font-mono tracking-wider ${
                    structure.trendDirection.value === 'BULLISH' ? 'text-emerald-400' :
                    structure.trendDirection.value === 'BEARISH' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {structure.trendDirection.value === 'BULLISH' ? '▲ BULLISH ACQUISITION' :
                     structure.trendDirection.value === 'BEARISH' ? '▼ BEARISH DISTRIBUTION' : '◀▶ SIDEWAYS RANGE'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 italic">
                  "{structure.trendDirection.reason}"
                </p>
                <div className="text-[8px] font-mono text-zinc-600 block">
                  Detected: {new Date(structure.trendDirection.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Trend Strength */}
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-900 pt-3 md:pt-0 md:pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Trend Strength</span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">Confidence: {structure.trendStrength.confidence}%</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold font-mono text-zinc-200">{structure.trendStrength.value}% Power</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {structure.trendStrength.value >= 75 ? 'Strong Trend' :
                       structure.trendStrength.value >= 50 ? 'Moderate Trend' : 'Weak / Ranging'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        structure.trendStrength.value >= 75 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        structure.trendStrength.value >= 50 ? 'bg-amber-500' : 'bg-zinc-700'
                      }`} 
                      style={{ width: `${structure.trendStrength.value}%` }}
                    />
                  </div>
                </div>
                <p className="text-[9px] font-mono text-zinc-500 mt-1">
                  {structure.trendStrength.reason}
                </p>
              </div>
            </div>

            {/* Middle row: HH/HL & LH/LL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Higher Highs */}
              <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Higher Highs (HH)</span>
                  <span className={`w-2 h-2 rounded-full ${structure.higherHighs.value ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-bold font-mono ${structure.higherHighs.value ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {structure.higherHighs.value ? 'DETECTED / VALID' : 'NOT DETECTED'}
                  </span>
                  <p className="text-[9px] font-mono text-zinc-500 line-clamp-3 leading-normal">
                    {structure.higherHighs.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 pt-1 border-t border-zinc-900/50">
                  <span>Conf: {structure.higherHighs.confidence}%</span>
                  <span>{new Date(structure.higherHighs.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Higher Lows */}
              <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Higher Lows (HL)</span>
                  <span className={`w-2 h-2 rounded-full ${structure.higherLows.value ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-bold font-mono ${structure.higherLows.value ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {structure.higherLows.value ? 'DETECTED / VALID' : 'NOT DETECTED'}
                  </span>
                  <p className="text-[9px] font-mono text-zinc-500 line-clamp-3 leading-normal">
                    {structure.higherLows.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 pt-1 border-t border-zinc-900/50">
                  <span>Conf: {structure.higherLows.confidence}%</span>
                  <span>{new Date(structure.higherLows.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Lower Highs */}
              <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Lower Highs (LH)</span>
                  <span className={`w-2 h-2 rounded-full ${structure.lowerHighs.value ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-bold font-mono ${structure.lowerHighs.value ? 'text-red-400' : 'text-zinc-500'}`}>
                    {structure.lowerHighs.value ? 'DETECTED / ACTIVE' : 'NOT DETECTED'}
                  </span>
                  <p className="text-[9px] font-mono text-zinc-500 line-clamp-3 leading-normal">
                    {structure.lowerHighs.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 pt-1 border-t border-zinc-900/50">
                  <span>Conf: {structure.lowerHighs.confidence}%</span>
                  <span>{new Date(structure.lowerHighs.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Lower Lows */}
              <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Lower Lows (LL)</span>
                  <span className={`w-2 h-2 rounded-full ${structure.lowerLows.value ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-bold font-mono ${structure.lowerLows.value ? 'text-red-400' : 'text-zinc-500'}`}>
                    {structure.lowerLows.value ? 'DETECTED / ACTIVE' : 'NOT DETECTED'}
                  </span>
                  <p className="text-[9px] font-mono text-zinc-500 line-clamp-3 leading-normal">
                    {structure.lowerLows.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 pt-1 border-t border-zinc-900/50">
                  <span>Conf: {structure.lowerLows.confidence}%</span>
                  <span>{new Date(structure.lowerLows.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Support/Resistance Map & Swing Pivots */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pivot Points */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 lg:col-span-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block border-b border-zinc-900 pb-1.5">
                  Structural Pivot Logs
                </span>
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[9px] font-mono text-amber-500 uppercase block mb-1">Recent Swing Highs</span>
                    <div className="flex flex-wrap gap-1.5">
                      {structure.swingHighs.value.map((val, idx) => (
                        <span key={idx} className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                          ${val.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase block mb-1">Recent Swing Lows</span>
                    <div className="flex flex-wrap gap-1.5">
                      {structure.swingLows.value.map((val, idx) => (
                        <span key={idx} className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                          ${val.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[8px] font-mono text-zinc-600 leading-normal pt-2 border-t border-zinc-900/50">
                  {structure.swingHighs.reason}
                </p>
              </div>

              {/* Nearest Support Level */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Dynamic Support Floor</span>
                    <span className="text-[8px] font-mono text-zinc-500">Conf: {structure.support.confidence}%</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
                    ${structure.support.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1.5 leading-relaxed">
                    {structure.support.reason}
                  </p>
                </div>
                <span className="text-[8px] text-zinc-600 font-mono block text-right mt-1 border-t border-zinc-900/50 pt-1.5">
                  Validated: {new Date(structure.support.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Nearest Resistance Level */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg space-y-3 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Dynamic Resistance Ceiling</span>
                    <span className="text-[8px] font-mono text-zinc-500">Conf: {structure.resistance.confidence}%</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-red-400 mt-2">
                    ${structure.resistance.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1.5 leading-relaxed">
                    {structure.resistance.reason}
                  </p>
                </div>
                <span className="text-[8px] text-zinc-600 font-mono block text-right mt-1 border-t border-zinc-900/50 pt-1.5">
                  Validated: {new Date(structure.resistance.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-xs font-mono text-zinc-500 text-center py-6">
            Calibrating real-time Market Structure Engine...
          </div>
        )}
      </div>

      {/* Main Mission Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Checklist (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h3 className="text-sm font-bold font-serif text-zinc-200">
                DAILY PROTOCOLS CHECKLIST
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
                Align system elements and cognitive scores before seeking setups
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded text-xs font-mono font-bold text-amber-400">
              {completedCount} / {checklist.length} ACTIVE
            </div>
          </div>

          <div className="space-y-2.5">
            {checklist.map(item => (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                  item.completed
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.completed ? (
                    <CheckSquare className="w-4.5 h-4.5 text-amber-500" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-serif ${item.completed ? 'text-zinc-200' : 'text-zinc-400'}`}>
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      SYSTEM WEIGHT:
                    </span>
                    <span className="text-[9px] font-mono text-amber-500/80 font-bold">
                      +{item.weight}% READINESS
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Goal Indicator Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              SESSION READINESS POWER
            </h3>

            {/* Visual Arc representation */}
            <div className="flex flex-col items-center justify-center py-6 border-b border-zinc-900/60">
              <div className="relative flex items-center justify-center w-36 h-36">
                {/* SVG Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-zinc-900"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-amber-500 transition-all duration-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, totalWeight)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score Absolute Display */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-mono text-zinc-100">
                    {totalWeight}%
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    SYNC RATE
                  </span>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-xs font-bold font-serif text-zinc-300">
                  {totalWeight >= 80 ? 'FLIGHT APPROVED' : 'WARM-UP REQUIRED'}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">
                  {totalWeight >= 80 
                    ? 'All security checklist thresholds crossed.' 
                    : 'A minimum of 80% Readiness rate is advised by AQ Guardian.'}
                </p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono text-zinc-500 leading-normal">
                Executing setups with less than 80% readiness rate triggers automatic system telemetry warnings inside <span className="text-amber-400 font-bold">AQ Core</span>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPPORTUNITY RANKING PIPELINE v3.1 */}
      <div id="opportunity-ranking-pipeline" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                System Upgrade v3.1
              </span>
              <h3 className="text-sm font-bold font-serif text-zinc-200 uppercase tracking-wide">
                Opportunity Ranking Pipeline
              </h3>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">
              High-accuracy score aggregation & classification across 7 quantitative criteria
            </p>
          </div>
          <div className="flex gap-1.5 bg-zinc-900/40 p-1 rounded-lg border border-zinc-900 shrink-0">
            {(['ALL', 'Elite', 'Good', 'Watch', 'No Trade'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setRankingFilter(lvl)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all uppercase cursor-pointer ${
                  rankingFilter === lvl 
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities List Sorted from Highest to Lowest */}
        {filteredOpps.length > 0 ? (
          <div className="space-y-3.5">
            {filteredOpps.map((opp) => {
              const isExpanded = !!expandedOpps[opp.id];
              const badgeColors = {
                'Elite': 'bg-gradient-to-r from-yellow-500/25 to-amber-500/25 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.05)]',
                'Good': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                'Watch': 'bg-zinc-900 border-zinc-800 text-zinc-400',
                'No Trade': 'bg-red-950/20 border-red-900/30 text-red-400'
              };

              return (
                <div 
                  key={opp.id} 
                  className={`border rounded-lg transition-all ${
                    isExpanded 
                      ? 'bg-[#0a0a0b] border-amber-500/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]' 
                      : 'bg-zinc-900/10 border-zinc-900/60 hover:border-zinc-800'
                  }`}
                >
                  {/* Summary row */}
                  <div 
                    onClick={() => toggleOppExpand(opp.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Overall Score Badge */}
                      <div className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center shrink-0 ${
                        opp.rankingLevel === 'Elite' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        opp.rankingLevel === 'Good' ? 'bg-amber-500/10 border-amber-500/20' :
                        opp.rankingLevel === 'Watch' ? 'bg-zinc-900 border-zinc-800' :
                        'bg-red-500/10 border-red-500/20'
                      }`}>
                        <span className={`text-base font-bold font-mono leading-none ${
                          opp.rankingLevel === 'Elite' ? 'text-yellow-400 font-extrabold' :
                          opp.rankingLevel === 'Good' ? 'text-amber-400' :
                          opp.rankingLevel === 'Watch' ? 'text-zinc-300' :
                          'text-red-400'
                        }`}>
                          {opp.overallScore}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">PTS</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-zinc-100">
                            {opp.ticker}
                          </span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            opp.direction === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            opp.direction === 'BEARISH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {opp.direction}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColors[opp.rankingLevel]}`}>
                            {opp.rankingLevel}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-serif mt-1">
                          {opp.type} &mdash; <span className="text-zinc-500 font-mono text-[10px] leading-relaxed">{opp.reason}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-zinc-900 pt-2.5 md:pt-0">
                      <div className="text-right font-mono text-[10px] text-zinc-500 space-y-0.5">
                        <div>Confidence: <span className="text-amber-500 font-bold">{opp.confidence}%</span></div>
                        <div>Price: <span className="text-zinc-300 font-bold">${opp.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                      
                      <button className="text-xs font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                        {isExpanded ? 'Hide Details' : 'Details'}
                        <span className="text-[8px]">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Complete Score Breakdown panel */}
                  {isExpanded && (
                    <div className="border-t border-zinc-900/60 p-4 bg-zinc-950/40 space-y-4">
                      {/* Sub-scores grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Trend Score', val: opp.trendScore, icon: TrendingUp },
                          { label: 'Structure Score', val: opp.structureScore, icon: Layers },
                          { label: 'Confirmation Score', val: opp.confirmationScore, icon: CheckSquare },
                          { label: 'Risk Score', val: opp.riskScore, icon: Shield },
                          { label: 'Guardian Score', val: opp.guardianScore, icon: Cpu },
                          { label: 'Market Health Score', val: opp.marketHealthScore, icon: Activity },
                          { label: 'Readiness Score', val: opp.readinessScore, icon: Target },
                        ].map((sub, i) => {
                          const Icon = sub.icon;
                          let barColor = 'bg-amber-500';
                          let textColor = 'text-amber-400';
                          if (sub.val >= 85) {
                            barColor = 'bg-yellow-500';
                            textColor = 'text-yellow-400';
                          } else if (sub.val < 50) {
                            barColor = 'bg-red-500';
                            textColor = 'text-red-400';
                          }

                          return (
                            <div key={i} className="bg-[#0e0e10] border border-zinc-900 p-3 rounded-lg space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                                  {sub.label}
                                </span>
                                <span className={`font-bold ${textColor}`}>{sub.val}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${barColor} transition-all duration-500`}
                                  style={{ width: `${sub.val}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Guardian Version Block */}
                        <div className="bg-[#12100d] border border-amber-950/20 p-3 rounded-lg flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-amber-500/80 uppercase tracking-wider">GUARDIAN LINK</span>
                            <span className="text-[7px] font-mono text-zinc-600">V3.1 SECURED</span>
                          </div>
                          <div className="mt-2 text-[9px] font-mono text-zinc-500 leading-normal">
                            Quantitative verification seal validated. Execution lock: <span className="text-amber-400 font-bold">ARMED</span>.
                          </div>
                        </div>
                      </div>

                      {/* Protective Warnings & No Trade Executions */}
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                          <div>
                            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">NO TRADE EXECUTION PROTOCOL INSTATED</span>
                            <span className="text-[9px] font-mono text-zinc-500 leading-normal block mt-0.5">
                              This application does not perform actual trades or direct order executions. All statistics, ranks, and classifications are provided for pipeline simulation and analytical feedback.
                            </span>
                          </div>
                        </div>
                        <div className="bg-red-500/10 text-red-400 font-mono text-[8px] font-bold px-2 py-1 rounded uppercase border border-red-500/20 shrink-0">
                          OBSERVATION RE-LOCK
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-lg">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-mono text-zinc-500 mt-2">
              No opportunities matching the level [{rankingFilter}] are currently tracked in the pipeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
