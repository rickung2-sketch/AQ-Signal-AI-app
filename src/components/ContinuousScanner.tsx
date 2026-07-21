import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Clock, RefreshCw, AlertTriangle, AlertCircle, Play, Pause,
  CheckCircle, ArrowUpRight, ArrowDownRight, Layers, HelpCircle, 
  ChevronRight, Target, ShieldAlert, Award, Sparkles, Database, FileText,
  Minus
} from 'lucide-react';
import { marketDataService } from '../plugins/marketDataService';
import { ScannerEvent } from '../types/marketScanner';
import { TradeLog } from '../types/dashboard';

interface ContinuousScannerProps {
  addLog: (log: string) => void;
  events: ScannerEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ScannerEvent[]>>;
  onAddTrade?: (trade: TradeLog) => void;
  tradeLogs?: TradeLog[];
}

export type ScannerState = 'Watching' | 'Setup Forming' | 'Ready' | 'Trade Active' | 'Cooldown';

export default function ContinuousScanner({ 
  addLog, 
  events, 
  setEvents, 
  onAddTrade,
  tradeLogs = []
}: ContinuousScannerProps) {
  // State variables
  const [scannerState, setScannerState] = useState<ScannerState>('Watching');
  const [isScannerActive, setIsScannerActive] = useState<boolean>(true);
  const [scanIntervalSeconds, setScanIntervalSeconds] = useState<number>(10);
  const [timeToNextScan, setTimeToNextScan] = useState<number>(10);
  const [currentPrice, setCurrentPrice] = useState<number>(2420.5);
  const [confidence, setConfidence] = useState<number>(0);
  const [direction, setDirection] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL');
  const [setupDetails, setSetupDetails] = useState<string>('Searching for horizontal structures and breakout retests...');
  const [activeTrade, setActiveTrade] = useState<TradeLog | null>(null);
  const [recentScannerLogs, setRecentScannerLogs] = useState<{timestamp: string, msg: string, type: 'info' | 'success' | 'warn' | 'fail'}[]>([]);

  // Simulation metrics
  const [candlesEvaluated, setCandlesEvaluated] = useState<number>(42);
  const [setupsTrackedCount, setSetupsTrackedCount] = useState<number>(3);
  const [successfulConformancesCount, setSuccessfulConformancesCount] = useState<number>(1);

  // Helper to add local display logs
  const addScannerLog = (msg: string, type: 'info' | 'success' | 'warn' | 'fail' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setRecentScannerLogs(prev => [{ timestamp, msg, type }, ...prev].slice(0, 15));
  };

  // Subscribe to live price tick of XAU/USD from market data service if active
  useEffect(() => {
    const unsubscribe = marketDataService.subscribeTicks('XAU/USD', (tick) => {
      if (tick && tick.price) {
        setCurrentPrice(parseFloat(tick.price.toFixed(2)));
      }
    });

    // Seed some initial scanner logs
    addScannerLog('XAU/USD Continuous Scanner initialized. Monitoring live price feed.', 'success');
    addScannerLog('System upgraded to AQ Trade AI v7.1. High frequency analysis models calibrated.', 'info');

    return () => {
      unsubscribe();
    };
  }, []);

  // Timer loop for scanning intervals
  useEffect(() => {
    if (!isScannerActive) return;

    const timer = setInterval(() => {
      setTimeToNextScan(prev => {
        if (prev <= 1) {
          // Perform the evaluation
          triggerScanSweep();
          return scanIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isScannerActive, scanIntervalSeconds, scannerState, currentPrice, direction]);

  // Reset time to next scan when interval is changed
  useEffect(() => {
    setTimeToNextScan(scanIntervalSeconds);
  }, [scanIntervalSeconds]);

  // Performs a complete scan and analysis
  const triggerScanSweep = () => {
    setCandlesEvaluated(prev => prev + 1);
    
    // Slight price tick simulation to keep screen dynamic
    const tickChange = (Math.random() - 0.5) * 0.8;
    const nextPrice = currentPrice + tickChange;
    setCurrentPrice(parseFloat(nextPrice.toFixed(2)));

    addLog(`SYS: [Continuous Scanner] Performing scheduled XAU/USD sweep at $${nextPrice.toFixed(2)}.`);
    addScannerLog(`Running analysis suite at $${nextPrice.toFixed(2)}. Conformity scores verified.`, 'info');

    // State machine automatic transitions (simulating real market conditions occasionally if not manually driven)
    if (scannerState === 'Watching') {
      // 10% chance to automatically start a setup
      if (Math.random() < 0.10) {
        triggerSetupFormingSim();
      }
    } else if (scannerState === 'Setup Forming') {
      // 40% chance to improve, 15% chance to fail
      const rand = Math.random();
      if (rand < 0.40) {
        improveSetupSim();
      } else if (rand < 0.55) {
        failSetupSim('Breakout boundary rejected by high-timeframe order blocks.');
      }
    } else if (scannerState === 'Ready') {
      // 30% chance to automatically execute, 10% chance to decay/fail
      const rand = Math.random();
      if (rand < 0.30) {
        executeVirtualTradeSim();
      } else if (rand < 0.40) {
        failSetupSim('Volatility spike invalidated setup risk-reward parameters.');
      }
    } else if (scannerState === 'Trade Active') {
      // 25% chance to complete trade (either profit or loss)
      if (Math.random() < 0.25) {
        const win = Math.random() > 0.40; // 60% win rate
        closeActiveTradeSim(win);
      }
    } else if (scannerState === 'Cooldown') {
      // Auto return to Watching
      setScannerState('Watching');
      setConfidence(0);
      setDirection('NEUTRAL');
      setSetupDetails('Searching for horizontal structures and breakout retests...');
      addScannerLog('Cooldown complete. Transitioned back to WATCHING state.', 'info');
      addLog('SYS: [Continuous Scanner] Cooldown complete on XAU/USD. Returning to WATCHING.');
    }
  };

  // Trigger state: Setup Forming
  const triggerSetupFormingSim = () => {
    const dir = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
    const initConfidence = 65;
    const targetPrice = currentPrice;
    
    setScannerState('Setup Forming');
    setConfidence(initConfidence);
    setDirection(dir);
    setSetupsTrackedCount(prev => prev + 1);

    const detailText = dir === 'BULLISH'
      ? `Breakout forming. XAU/USD price is testing horizontal resistance at $${(targetPrice + 1.5).toFixed(2)} with rising buyers.`
      : `Breakout forming. XAU/USD price is breaking key support level at $${(targetPrice - 1.5).toFixed(2)} with sellers aggressive.`;
    
    setSetupDetails(detailText);

    // 1. Notify Mission Control by adding a ScannerEvent
    const newEvent: ScannerEvent = {
      id: `gold-setup-${Date.now()}`,
      type: dir === 'BULLISH' ? 'Breakout' : 'Retest',
      ticker: 'XAU/USD',
      priority: 'MEDIUM',
      confidence: initConfidence,
      timestamp: new Date().toISOString(),
      reason: `Gold Setup Detected: ${detailText}`,
      price: targetPrice,
      direction: dir,
      overallScore: 68,
      trendScore: 70,
      structureScore: 65,
      confirmationScore: 60,
      riskScore: 75,
      guardianScore: 72,
      marketHealthScore: 80,
      readinessScore: 75,
      rankingLevel: 'Watch'
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 100));

    // 2. Log globally
    addLog(`SYS: [Continuous Scanner] Setup begins forming on XAU/USD [${dir}] - Confidence: ${initConfidence}%. Notification sent to Mission Control.`);
    addScannerLog(`Setup began forming [${dir}] at $${targetPrice.toFixed(2)}. MC alert dispatched.`, 'warn');
  };

  // Trigger state: Improve Setup Quality (Setup Forming -> Ready)
  const improveSetupSim = () => {
    if (scannerState !== 'Setup Forming') return;

    const newConfidence = 92;
    setScannerState('Ready');
    setConfidence(newConfidence);
    setSuccessfulConformancesCount(prev => prev + 1);

    const detailText = direction === 'BULLISH'
      ? `SETUP READY: Pristine bullish breakout retest confirmed above $${(currentPrice - 0.5).toFixed(2)}. Volumes supporting buy side.`
      : `SETUP READY: Decisive bearish breakdown confirmed below $${(currentPrice + 0.5).toFixed(2)}. Liquidation pools clear.`;
    
    setSetupDetails(detailText);

    // 1. Notify Mission Control by pushing another high confidence event
    const newEvent: ScannerEvent = {
      id: `gold-ready-${Date.now()}`,
      type: direction === 'BULLISH' ? 'Bullish Engulfing' : 'Bearish Engulfing',
      ticker: 'XAU/USD',
      priority: 'HIGH',
      confidence: newConfidence,
      timestamp: new Date().toISOString(),
      reason: `Gold Setup Improved to Ready: ${detailText} Confidence boosted to ${newConfidence}%.`,
      price: currentPrice,
      direction: direction,
      overallScore: 92,
      trendScore: 90,
      structureScore: 95,
      confirmationScore: 92,
      riskScore: 88,
      guardianScore: 95,
      marketHealthScore: 88,
      readinessScore: 92,
      rankingLevel: 'Elite'
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 100));

    // 2. Log globally
    addLog(`SYS: [Continuous Scanner] Setup quality improved on XAU/USD [${direction}]. Confidence elevated to ${newConfidence}%. Ready state armed.`);
    addScannerLog(`Setup quality improved. Confidence updated to ${newConfidence}%. State: READY.`, 'success');
  };

  // Trigger state: Setup Fail (Automatically return to No Trade)
  const failSetupSim = (reason: string = 'Market structures failed to confirm momentum. Rejecting boundaries.') => {
    if (scannerState !== 'Setup Forming' && scannerState !== 'Ready') return;

    const originalState = scannerState;
    setScannerState('Watching');
    setConfidence(0);
    setDirection('NEUTRAL');
    setSetupDetails('Searching for horizontal structures and breakout retests...');

    // 1. Record the failed setup in the Decision Ledger
    if (onAddTrade) {
      const failedLedgerEntry: TradeLog = {
        id: `AQ-FST-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        ticker: 'XAU/USD',
        direction: direction === 'NEUTRAL' ? 'BUY' : direction,
        size: 0,
        leverage: 0,
        entryPrice: currentPrice,
        conviction: 1,
        status: 'LOSS', // Log as setup cancellation/loss of pattern
        notes: `CANCELLED SETUP: XAU/USD Setup pattern failed. Original state: ${originalState}. Reason: ${reason}`,
        guardianRiskScore: 90,
        guardianFeedback: `[BLOCKED] SETUP CRITERIA INVALID: ${reason}`
      };
      onAddTrade(failedLedgerEntry);
    }

    // 2. Notify globally and log
    addLog(`SYS: [Continuous Scanner] Setup failed on XAU/USD. Returning to WATCHING (No Trade). Recorded in Decision Ledger.`);
    addScannerLog(`Setup failed: ${reason}. Resetting to WATCHING. Written to Decision Ledger.`, 'fail');
  };

  // Trigger state: Ready -> Trade Active
  const executeVirtualTradeSim = () => {
    if (scannerState !== 'Ready') return;

    setScannerState('Trade Active');

    const atr = 12.5; // Custom Gold ATR
    const riskAmount = atr * 1.2;
    const stopLoss = direction === 'BULLISH' ? currentPrice - riskAmount : currentPrice + riskAmount;
    const takeProfit = direction === 'BULLISH' ? currentPrice + 2 * riskAmount : currentPrice - 2 * riskAmount;

    // Create Trade Log in Decision Ledger
    const newTrade: TradeLog = {
      id: `AQ-GTR-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      ticker: 'XAU/USD',
      direction: direction === 'BULLISH' ? 'BUY' : 'SELL',
      size: 1.5,
      leverage: 20,
      entryPrice: currentPrice,
      conviction: 5,
      status: 'OPEN',
      notes: `V7.1 SCANNER TRIGGERED: Virtual trade entered on XAU/USD breakout pattern. SL at $${stopLoss.toFixed(2)}, TP at $${takeProfit.toFixed(2)}.`,
      guardianRiskScore: 12,
      guardianFeedback: 'APPROVED: Volatility bounds valid. 1H 200 EMA matches primary vector.'
    };

    setActiveTrade(newTrade);
    if (onAddTrade) {
      onAddTrade(newTrade);
    }

    addLog(`SYS: [Continuous Scanner] Executing virtual trade on XAU/USD at $${currentPrice.toFixed(2)}. Targets: TP $${takeProfit.toFixed(2)}, SL $${stopLoss.toFixed(2)}.`);
    addScannerLog(`Trade triggered on XAU/USD ${direction} at $${currentPrice.toFixed(2)}. SL: $${stopLoss.toFixed(2)} | TP: $${takeProfit.toFixed(2)}.`, 'success');
  };

  // Trigger state: Trade Active -> Cooldown
  const closeActiveTradeSim = (isWin: boolean) => {
    if (scannerState !== 'Trade Active') return;

    setScannerState('Cooldown');
    
    // Process closing the active trade
    if (activeTrade && onAddTrade) {
      const finalStatus = isWin ? 'WIN' : 'LOSS';
      const profitValue = isWin ? 3500.00 : -1750.00;
      
      const closedTrade: TradeLog = {
        ...activeTrade,
        status: finalStatus as any,
        notes: `${activeTrade.notes} CLOSED out. Outcome: ${finalStatus}. Net Result: $${profitValue > 0 ? '+' : ''}${profitValue.toFixed(2)} virtual equity change.`
      };

      // In state, we replace or add closed status. Since we append onAddTrade, let's just push a closed report to ledger
      onAddTrade(closedTrade);
    }

    setActiveTrade(null);

    addLog(`SYS: [Continuous Scanner] Virtual trade completed on XAU/USD. Outcome: ${isWin ? 'TAKE PROFIT (WIN)' : 'STOP LOSS (LOSS)'}. Entering Cooldown.`);
    addScannerLog(`Trade closed: ${isWin ? 'TAKE PROFIT HIT (+2R)' : 'STOP LOSS TRIPPED (-1R)'}. Entering Cooldown state.`, isWin ? 'success' : 'fail');
  };

  // Determine state badges & classes
  const getStateColorClass = (state: ScannerState) => {
    switch (state) {
      case 'Watching': return 'border-cyan-500/35 bg-cyan-950/15 text-cyan-400';
      case 'Setup Forming': return 'border-amber-500/35 bg-amber-950/15 text-amber-500';
      case 'Ready': return 'border-orange-500/35 bg-orange-950/15 text-orange-500';
      case 'Trade Active': return 'border-emerald-500/35 bg-emerald-950/15 text-emerald-400 animate-pulse';
      case 'Cooldown': return 'border-purple-500/35 bg-purple-950/15 text-purple-400';
    }
  };

  const getLightColorClass = (state: ScannerState) => {
    switch (state) {
      case 'Watching': return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
      case 'Setup Forming': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 'Ready': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'Trade Active': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-ping';
      case 'Cooldown': return 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]';
    }
  };

  // Filter ledger logs belonging to XAU/USD to show in local ledger view
  const xauusdLedgerLogs = tradeLogs.filter(log => log.ticker === 'XAU/USD');

  return (
    <div className="space-y-6">
      
      {/* 7.1 Top Ribbon Banner */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.008] blur-3xl rounded-full" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest bg-amber-500 text-black border border-amber-400">
              CORE UPGRADE V7.1
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              XAU/USD CONTINUOUS MONITORING CLIENT
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            CONTINUOUS GOLD SCANNER
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            Real-time multi-stage analysis matrix dedicated to XAU/USD (Gold). Continuously evaluates 1H 200 EMA breakout retests, monitors swing extremes, and dispatches high-conformance entries to Mission Control.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          
          {/* Scanning Speed/Interval control */}
          <div className="flex items-center gap-1.5 bg-[#0C0C0D] border border-zinc-900 px-3 py-1.5 rounded-lg">
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Interval:</span>
            <select
              value={scanIntervalSeconds}
              onChange={(e) => setScanIntervalSeconds(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-mono text-[10px] uppercase font-bold focus:outline-none cursor-pointer"
            >
              <option value={5}>Aggressive (5s)</option>
              <option value={10}>Standard (10s)</option>
              <option value={30}>Balanced (30s)</option>
              <option value={60}>Sustained (60s)</option>
            </select>
          </div>

          <button
            onClick={() => setIsScannerActive(!isScannerActive)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border ${
              isScannerActive 
                ? 'bg-zinc-900 text-amber-400 border-amber-500/20 hover:bg-zinc-850' 
                : 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}
          >
            {isScannerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isScannerActive ? 'Pause Scanner' : 'Resume Scanner'}
          </button>

          <button
            onClick={triggerScanSweep}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Force Evaluation Sweep
          </button>
        </div>
      </div>

      {/* STEPPED PIPELINE STATE DISPLAY */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            STATE MACHINE ENGINE FLOW
          </h3>
          <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            Next Sweep in <strong className="text-amber-400">{isScannerActive ? `${timeToNextScan}s` : 'PAUSED'}</strong>
          </span>
        </div>

        {/* Beautiful 5 Stage Progress */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          
          {/* WATCHING */}
          <div className={`border p-4 rounded-xl space-y-2 transition-all ${
            scannerState === 'Watching' 
              ? 'bg-cyan-500/[0.04] border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.06)] scale-[1.02]' 
              : 'bg-[#0C0C0D] border-zinc-900 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">STAGE 1</span>
              <div className={`w-2.5 h-2.5 rounded-full ${scannerState === 'Watching' ? getLightColorClass('Watching') : 'bg-zinc-800'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">Watching</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-normal">
                Scanning the 1H 200 EMA vector for breakout retest alerts on Gold.
              </p>
            </div>
          </div>

          {/* SETUP FORMING */}
          <div className={`border p-4 rounded-xl space-y-2 transition-all ${
            scannerState === 'Setup Forming' 
              ? 'bg-amber-500/[0.04] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.06)] scale-[1.02]' 
              : 'bg-[#0C0C0D] border-zinc-900 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-amber-500 font-extrabold tracking-widest uppercase">STAGE 2</span>
              <div className={`w-2.5 h-2.5 rounded-full ${scannerState === 'Setup Forming' ? getLightColorClass('Setup Forming') : 'bg-zinc-800'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">Setup Forming</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-normal">
                Initial patterns spotted. Dispatched alert to Mission Control.
              </p>
            </div>
          </div>

          {/* READY */}
          <div className={`border p-4 rounded-xl space-y-2 transition-all ${
            scannerState === 'Ready' 
              ? 'bg-orange-500/[0.04] border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.06)] scale-[1.02]' 
              : 'bg-[#0C0C0D] border-zinc-900 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-orange-500 font-extrabold tracking-widest uppercase">STAGE 3</span>
              <div className={`w-2.5 h-2.5 rounded-full ${scannerState === 'Ready' ? getLightColorClass('Ready') : 'bg-zinc-800'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">Ready</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-normal">
                Conformity rules satisfied. 92% confidence established. Setup armed.
              </p>
            </div>
          </div>

          {/* TRADE ACTIVE */}
          <div className={`border p-4 rounded-xl space-y-2 transition-all ${
            scannerState === 'Trade Active' 
              ? 'bg-emerald-500/[0.04] border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.06)] scale-[1.02]' 
              : 'bg-[#0C0C0D] border-zinc-900 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">STAGE 4</span>
              <div className={`w-2.5 h-2.5 rounded-full ${scannerState === 'Trade Active' ? getLightColorClass('Trade Active') : 'bg-zinc-800'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">Trade Active</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-normal">
                Virtual position opened. Target/Stop Loss monitored live in ledger.
              </p>
            </div>
          </div>

          {/* COOLDOWN */}
          <div className={`border p-4 rounded-xl space-y-2 transition-all ${
            scannerState === 'Cooldown' 
              ? 'bg-purple-500/[0.04] border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.06)] scale-[1.02]' 
              : 'bg-[#0C0C0D] border-zinc-900 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-purple-400 font-extrabold tracking-widest uppercase">STAGE 5</span>
              <div className={`w-2.5 h-2.5 rounded-full ${scannerState === 'Cooldown' ? getLightColorClass('Cooldown') : 'bg-zinc-800'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">Cooldown</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-normal">
                Trade outcome filed. Resting for 1 candle to avoid over-trading.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* CORE DISPLAY SECTION: Scanner Diagnostics left, Controls/Ledger right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Live Diagnostics & Monitor (7 Columns) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
            <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              LIVE TELEMETRY WINDOW (XAU/USD)
            </h4>
            <span className="flex items-center gap-1 text-[8px] font-mono text-zinc-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FEED ONLINE
            </span>
          </div>

          {/* Quote Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-xl">
              <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">XAU/USD SPOT PRICE</span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-xl font-mono font-extrabold text-amber-400">${currentPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-xl">
              <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">SCANNER CONVICTION</span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-xl font-mono font-extrabold text-zinc-100">{confidence}%</span>
                <span className="text-[8px] font-mono text-zinc-500">CONF</span>
              </div>
            </div>

            <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-xl">
              <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">BIAS DIRECTION</span>
              <div className="flex items-baseline gap-1 mt-1.5">
                {direction === 'BULLISH' && <span className="text-lg font-mono font-extrabold text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> BUY</span>}
                {direction === 'BEARISH' && <span className="text-lg font-mono font-extrabold text-red-400 flex items-center gap-1"><ArrowDownRight className="w-4 h-4" /> SELL</span>}
                {direction === 'NEUTRAL' && <span className="text-lg font-mono font-extrabold text-zinc-500 flex items-center gap-1"><Minus className="w-4 h-4" /> NEUTRAL</span>}
              </div>
            </div>
          </div>

          {/* Setup Justification Summary */}
          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-xl space-y-1.5">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-extrabold">Active Core Analysis Log</span>
            <p className="text-[11px] font-mono text-zinc-300 leading-relaxed font-bold">
              {setupDetails}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center text-zinc-400 font-mono text-[10px]">
            <div className="border border-zinc-900/60 p-2.5 rounded-lg bg-zinc-950/20">
              <span className="text-zinc-600 block text-[8px] uppercase">CANDLES EVALUATED</span>
              <span className="font-extrabold text-zinc-200">{candlesEvaluated}</span>
            </div>
            <div className="border border-zinc-900/60 p-2.5 rounded-lg bg-zinc-950/20">
              <span className="text-zinc-600 block text-[8px] uppercase">SETUPS DETECTED</span>
              <span className="font-extrabold text-zinc-200">{setupsTrackedCount}</span>
            </div>
            <div className="border border-zinc-900/60 p-2.5 rounded-lg bg-zinc-950/20">
              <span className="text-zinc-600 block text-[8px] uppercase">PEAK CONFORMANCES</span>
              <span className="font-extrabold text-zinc-200">{successfulConformancesCount}</span>
            </div>
          </div>

          {/* Scanner Console Stream */}
          <div className="space-y-2">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-extrabold">Continuous Scanner Log Stream</span>
            <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-xl max-h-[160px] overflow-y-auto space-y-2 scrollbar-thin">
              {recentScannerLogs.map((log, index) => (
                <div key={index} className="flex items-start justify-between text-[9px] font-mono leading-relaxed border-b border-zinc-900/45 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex gap-2">
                    <span className="text-zinc-600 select-none">{log.timestamp}</span>
                    <span className={`${
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warn' ? 'text-amber-500' :
                      log.type === 'fail' ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {log.msg}
                    </span>
                  </div>
                  <span className="text-zinc-600 text-[8px] uppercase font-bold">{log.type}</span>
                </div>
              ))}
              {recentScannerLogs.length === 0 && (
                <div className="text-center py-4 text-zinc-700 italic text-[9px]">Awaiting telemetry cycles...</div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Interactive Simulation & Ledger Feed (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SIMULATION CONTROLLER CARD */}
          <div className="bg-zinc-950 border border-amber-500/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-mono font-bold tracking-widest text-amber-100 uppercase">
                V7.1 MANUAL SIMULATOR
              </h4>
            </div>

            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              Directly manipulate the state machine to verify integrations with Mission Control and the Decision Ledger in real-time.
            </p>

            <div className="space-y-2 text-[10px] font-mono">
              
              {/* Trigger Setup Forming */}
              <button
                onClick={triggerSetupFormingSim}
                disabled={scannerState !== 'Watching' && scannerState !== 'Cooldown'}
                className="w-full text-left p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-850/60 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>1. Trigger Setup Forming</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* Improve Setup Quality */}
              <button
                onClick={improveSetupSim}
                disabled={scannerState !== 'Setup Forming'}
                className="w-full text-left p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-850/60 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span>2. Improve Setup Quality (Ready)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* Trigger Setup Failure */}
              <button
                onClick={() => failSetupSim('Simulation override: Breakout rejected at horizontal ceiling.')}
                disabled={scannerState !== 'Setup Forming' && scannerState !== 'Ready'}
                className="w-full text-left p-2.5 rounded-lg border border-red-950 bg-red-950/10 hover:bg-red-950/20 text-red-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>X. Trigger Setup Failure (Auto-Return)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* Execute Position */}
              <button
                onClick={executeVirtualTradeSim}
                disabled={scannerState !== 'Ready'}
                className="w-full text-left p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-850/60 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3. Execute Virtual Trade</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* Close Trade Profit / Loss */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => closeActiveTradeSim(true)}
                  disabled={scannerState !== 'Trade Active'}
                  className="p-2 border border-emerald-950 bg-emerald-950/15 hover:bg-emerald-950/25 text-emerald-400 font-extrabold rounded-lg disabled:opacity-30 disabled:pointer-events-none text-center block"
                >
                  Win Trade (+2R)
                </button>
                <button
                  onClick={() => closeActiveTradeSim(false)}
                  disabled={scannerState !== 'Trade Active'}
                  className="p-2 border border-red-950 bg-red-950/15 hover:bg-red-950/25 text-red-400 font-extrabold rounded-lg disabled:opacity-30 disabled:pointer-events-none text-center block"
                >
                  Lose Trade (-1R)
                </button>
              </div>

            </div>
          </div>

          {/* LEDGER ACTIVITY VERIFICATION FEED */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">
                GOLD LEDGER AUDIT FEED
              </h4>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {xauusdLedgerLogs.map((log) => (
                <div key={log.id} className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-extrabold">{log.id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      log.status === 'WIN' ? 'bg-emerald-500/15 text-emerald-400' :
                      log.status === 'LOSS' ? 'bg-red-500/15 text-red-400' :
                      'bg-amber-500/15 text-amber-400 animate-pulse'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Type: {log.direction} @ ${log.entryPrice}</span>
                    <span>Leverage: {log.leverage}x</span>
                  </div>

                  <p className="text-[9px] text-zinc-400 leading-relaxed italic border-t border-zinc-900/60 pt-1">
                    "{log.notes}"
                  </p>
                </div>
              ))}
              {xauusdLedgerLogs.length === 0 && (
                <div className="text-center py-6 text-zinc-600 italic text-[9px]">
                  No XAU/USD ledger entries captured. Trigger a setup failure or execute a trade to test writing.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
