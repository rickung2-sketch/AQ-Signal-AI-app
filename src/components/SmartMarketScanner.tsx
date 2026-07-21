import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Search, Filter, Shield, Clock, TrendingUp, TrendingDown, RefreshCw, 
  Download, ListFilter, AlertTriangle, AlertCircle, Compass, Play, Pause,
  Layers, CheckCircle, BarChart3, HelpCircle, ArrowUpRight, ArrowDownRight, Minus,
  Target
} from 'lucide-react';
import { 
  MarketScannerEventType, ScannerPriority, ScannerEvent, ScannerFilter 
} from '../types/marketScanner';
import { 
  generateRandomEvent, generateInitialEvents 
} from '../plugins/marketScannerEngine';
import ContinuousScanner from './ContinuousScanner';
import { TradeLog } from '../types/dashboard';

interface SmartMarketScannerProps {
  addLog: (log: string) => void;
  events: ScannerEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ScannerEvent[]>>;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  scanSpeedMs: number;
  setScanSpeedMs: (speed: number) => void;
  tradeLogs?: TradeLog[];
  onAddTrade?: (trade: TradeLog) => void;
}

export default function SmartMarketScanner({ 
  addLog, 
  events, 
  setEvents, 
  isScanning, 
  setIsScanning, 
  scanSpeedMs, 
  setScanSpeedMs,
  tradeLogs = [],
  onAddTrade
}: SmartMarketScannerProps) {
  const [activeScannerTab, setActiveScannerTab] = useState<'gold' | 'broad'>('gold');
  
  // Filtering state
  const [filterType, setFilterType] = useState<MarketScannerEventType | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<ScannerPriority | 'ALL'>('ALL');
  const [filterDirection, setFilterDirection] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'ALL'>('ALL');
  const [searchTicker, setSearchTicker] = useState<string>('');

  // Selected event for deep-dive panel
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Sound or flash effect trigger state
  const [lastEventFlash, setLastEventFlash] = useState<boolean>(false);

  // Flash effect whenever events length increases (new opportunity received)
  const prevLengthRef = useRef(events.length);
  useEffect(() => {
    if (events.length > prevLengthRef.current) {
      setLastEventFlash(true);
      const timer = setTimeout(() => setLastEventFlash(false), 800);
      prevLengthRef.current = events.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = events.length;
  }, [events]);

  // Handle manually forcing a scan
  const triggerManualScan = () => {
    const newEvent = generateRandomEvent();
    setEvents(prev => [newEvent, ...prev].slice(0, 100));
    addLog(`SCANNER: Triggered manual scan cycle. Opportunity discovered: $${newEvent.ticker} [${newEvent.type}]`);
  };

  // Clear all events
  const clearAllEvents = () => {
    setEvents([]);
    addLog('SCANNER: Cleared all active scanned opportunities.');
  };

  // Export Opportunities as JSON
  const handleExportOpportunities = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aq_scanner_opportunities_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog('SCANNER: Exported active opportunity list to JSON.');
  };

  // Filter logic
  const filteredEvents = events.filter(e => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (filterPriority !== 'ALL' && e.priority !== filterPriority) return false;
    if (filterDirection !== 'ALL' && e.direction !== filterDirection) return false;
    if (searchTicker && !e.ticker.toLowerCase().includes(searchTicker.toLowerCase())) return false;
    return true;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId) || filteredEvents[0] || null;

  // Statistic formulas
  const totalSignals = events.length;
  const bullishSignalsCount = events.filter(e => e.direction === 'BULLISH').length;
  const bearishSignalsCount = events.filter(e => e.direction === 'BEARISH').length;
  const neutralSignalsCount = events.filter(e => e.direction === 'NEUTRAL').length;
  const avgConfidence = totalSignals > 0 
    ? Math.round(events.reduce((acc, e) => acc + e.confidence, 0) / totalSignals) 
    : 0;
  const highPriorityCount = events.filter(e => e.priority === 'HIGH').length;

  const getPriorityStyle = (priority: ScannerPriority) => {
    switch (priority) {
      case 'HIGH':
        return {
          text: 'text-amber-500 font-extrabold',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          border: 'border-amber-500/40',
          dot: 'bg-amber-500'
        };
      case 'MEDIUM':
        return {
          text: 'text-zinc-300 font-bold',
          bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
          border: 'border-zinc-800',
          dot: 'bg-zinc-400'
        };
      case 'LOW':
        return {
          text: 'text-zinc-500 font-medium',
          bg: 'bg-zinc-950 border-zinc-900 text-zinc-500',
          border: 'border-zinc-900',
          dot: 'bg-zinc-600'
        };
    }
  };

  const getDirectionBadge = (dir: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    switch (dir) {
      case 'BULLISH':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
            <ArrowUpRight className="w-3 h-3" />
            BUY
          </span>
        );
      case 'BEARISH':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
            <ArrowDownRight className="w-3 h-3" />
            SELL
          </span>
        );
      case 'NEUTRAL':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
            <Minus className="w-3 h-3" />
            NEUTRAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex gap-2.5 border-b border-zinc-900 pb-1 font-mono text-xs uppercase tracking-wider">
        <button
          onClick={() => setActiveScannerTab('gold')}
          className={`pb-3.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeScannerTab === 'gold' 
              ? 'border-amber-500 text-amber-400 font-extrabold' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Target className="w-4 h-4" />
          XAU/USD Continuous Scanner (v7.1)
        </button>
        <button
          onClick={() => setActiveScannerTab('broad')}
          className={`pb-3.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeScannerTab === 'broad' 
              ? 'border-amber-500 text-amber-400 font-extrabold' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Compass className="w-4 h-4" />
          Broad Market Alerts Feed
        </button>
      </div>

      {activeScannerTab === 'gold' ? (
        <ContinuousScanner 
          addLog={addLog} 
          events={events}
          setEvents={setEvents}
          tradeLogs={tradeLogs}
          onAddTrade={onAddTrade}
        />
      ) : (
        <div className="space-y-6">
          
          {/* Dynamic Status Ribbon & Brand Title */}
      <div id="scanner-brand-header" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.006] blur-3xl rounded-full" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest border transition-all ${
              isScanning 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              {isScanning ? '● CONTINUOUS SCANNING ONLINE' : '○ SCANNING PAUSED'}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              COEFFICIENT ENGINE v3.0
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            SMART MARKET SCANNER
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            Continuously crawls dynamic order flows and technical patterns including breakouts, EMA Golden Crosses, Engulfing bars, and macro support/resistance tests. Reports opportunities instantly without executing trades.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          
          {/* Scanning Speed control */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded">
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Speed:</span>
            <select
              value={scanSpeedMs}
              onChange={(e) => setScanSpeedMs(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-mono text-[10px] uppercase font-bold focus:outline-none cursor-pointer"
            >
              <option value={2000}>Aggressive (2s)</option>
              <option value={4000}>Standard (4s)</option>
              <option value={8000}>Relaxed (8s)</option>
              <option value={15000}>Sustained (15s)</option>
            </select>
          </div>

          <button
            id="scanner-toggle-btn"
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border ${
              isScanning 
                ? 'bg-zinc-900 text-amber-400 border-amber-500/20 hover:bg-zinc-850' 
                : 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}
          >
            {isScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isScanning ? 'Pause Auto-Scan' : 'Resume Auto-Scan'}
          </button>

          <button
            id="scanner-manual-btn"
            onClick={triggerManualScan}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Force Scan Sweep
          </button>

          <button
            id="scanner-clear-btn"
            onClick={clearAllEvents}
            className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            Clear List
          </button>

          <button
            id="scanner-export-btn"
            onClick={handleExportOpportunities}
            className="px-3 py-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500 hover:text-black text-amber-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_15px_rgba(245,158,11,0.02)]"
          >
            <Download className="w-3.5 h-3.5" />
            Export Opportunities
          </button>

        </div>
      </div>

      {/* Real-time Tickers Flash Bar */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 flex items-center overflow-hidden gap-6 font-mono text-[10px] relative">
        <span className="text-[8px] uppercase tracking-widest text-zinc-500 border-r border-zinc-900 pr-4 font-extrabold shrink-0">
          Continuous Pipeline
        </span>
        <div className="flex gap-8 overflow-x-auto whitespace-nowrap scrollbar-none py-1 w-full">
          {events.slice(0, 5).map((e, idx) => (
            <div key={idx} className="flex items-center gap-2 hover:opacity-85 cursor-pointer" onClick={() => setSelectedEventId(e.id)}>
              <span className="text-zinc-400 font-bold">{e.ticker}</span>
              <span className={`text-[8px] font-mono px-1 py-0.1 rounded ${
                e.direction === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400' :
                e.direction === 'BEARISH' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {e.type}
              </span>
              <span className="text-zinc-200 font-bold">${e.price}</span>
            </div>
          ))}
          {events.length === 0 && (
            <span className="text-zinc-600 italic">No events generated. Click "Force Scan Sweep" or "Resume Auto-Scan" to populate feed.</span>
          )}
        </div>
      </div>

      {/* STATISTICS OVERVIEW BENTO BOX */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/[0.002] blur-xl rounded-full" />
          <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">TOTAL OPPORTUNITIES</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-serif font-bold text-zinc-100">{totalSignals}</span>
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">DISCOVERED</span>
          </div>
          <p className="text-[9px] font-mono text-zinc-500 mt-1">
            Overall scanned signal instances
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl relative overflow-hidden">
          <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">SENTIMENT DISTRIBUTION</span>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="h-2 bg-emerald-500/80 rounded" style={{ width: `${totalSignals > 0 ? (bullishSignalsCount/totalSignals)*100 : 50}%` }} title="Bullish opportunities" />
            <div className="h-2 bg-red-500/80 rounded" style={{ width: `${totalSignals > 0 ? (bearishSignalsCount/totalSignals)*100 : 30}%` }} title="Bearish opportunities" />
            <div className="h-2 bg-zinc-700 rounded" style={{ width: `${totalSignals > 0 ? (neutralSignalsCount/totalSignals)*100 : 20}%` }} title="Neutral status" />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-2">
            <span className="text-emerald-400 font-bold">{bullishSignalsCount} Buy</span>
            <span className="text-red-400 font-bold">{bearishSignalsCount} Sell</span>
            <span className="text-zinc-400">{neutralSignalsCount} Neut</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
          <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">AVERAGE SIGNAL CONFIDENCE</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-serif font-bold text-amber-400">{avgConfidence}%</span>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">MATRIX MINIMUM 60%</span>
          </div>
          <p className="text-[9px] font-mono text-zinc-500 mt-1">
            Dynamic probability calculation threshold
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
          <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">HIGH PRIORITY ALERTS</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-serif font-bold text-red-400">{highPriorityCount}</span>
            <span className="text-[8px] font-mono text-red-500/80 uppercase font-bold animate-pulse">ATTENTION REQ</span>
          </div>
          <p className="text-[9px] font-mono text-zinc-500 mt-1">
            Breakouts & trend shifts triggered
          </p>
        </div>

      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        
        <div className="border-b border-zinc-900 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">
              SCANNER FILTER CONTROLLER
            </h4>
          </div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">
            Active: {filteredEvents.length} / {events.length} Matches
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-[10px]">
          
          {/* Ticker Search bar */}
          <div className="space-y-1">
            <label className="text-zinc-500 block uppercase text-[8px] tracking-wider">Search Ticker</label>
            <div className="relative">
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                placeholder="e.g. BTC, ETH, NVDA"
                className="w-full bg-[#0C0C0D] border border-zinc-900 rounded-lg px-3 py-1.5 text-zinc-300 placeholder-zinc-700 uppercase focus:border-amber-500/50 focus:outline-none"
              />
              <Search className="w-3 h-3 text-zinc-600 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Event type filter */}
          <div className="space-y-1">
            <label className="text-zinc-500 block uppercase text-[8px] tracking-wider">Event Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-[#0C0C0D] border border-zinc-900 rounded-lg px-3 py-1.5 text-zinc-300 focus:border-amber-500/50 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="Trend Change">Trend Changes</option>
              <option value="EMA Cross">EMA Crosses</option>
              <option value="Breakout">Breakouts</option>
              <option value="Retest">Retests</option>
              <option value="Bullish Engulfing">Bullish Engulfings</option>
              <option value="Bearish Engulfing">Bearish Engulfings</option>
              <option value="Support Test">Support Tests</option>
              <option value="Resistance Test">Resistance Tests</option>
              <option value="Session Change">Session Changes</option>
              <option value="Guardian Status">Guardian Status</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="space-y-1">
            <label className="text-zinc-500 block uppercase text-[8px] tracking-wider">Priority Level</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full bg-[#0C0C0D] border border-zinc-900 rounded-lg px-3 py-1.5 text-zinc-300 focus:border-amber-500/50 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL PRIORITIES</option>
              <option value="HIGH">HIGH ONLY</option>
              <option value="MEDIUM">MEDIUM ONLY</option>
              <option value="LOW">LOW ONLY</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div className="space-y-1">
            <label className="text-zinc-500 block uppercase text-[8px] tracking-wider">Opportunity Bias</label>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value as any)}
              className="w-full bg-[#0C0C0D] border border-zinc-900 rounded-lg px-3 py-1.5 text-zinc-300 focus:border-amber-500/50 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL BIASES</option>
              <option value="BULLISH">BUY (BULLISH)</option>
              <option value="BEARISH">SELL (BEARISH)</option>
              <option value="NEUTRAL">NEUTRAL</option>
            </select>
          </div>

        </div>

      </div>

      {/* CORE DISPLAY WINDOW: Split List on left, details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Opportunity Ticker Stream (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" />
              LIVE OPPORTUNITIES FEED
            </h4>
            <span className="text-[8px] font-mono text-zinc-500">
              UPDATES CONTINUOUSLY
            </span>
          </div>

          {/* Table / List of Scanned Opportunities */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
            {filteredEvents.map((e, idx) => {
              const priorityStyle = getPriorityStyle(e.priority);
              const isSelected = selectedEventId === e.id;
              
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEventId(e.id)}
                  className={`border p-3.5 rounded-lg flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-500/[0.03] border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.04)]' 
                      : idx === 0 && lastEventFlash 
                      ? 'bg-amber-500/[0.06] border-amber-500/80'
                      : 'bg-[#0C0C0D] border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="space-y-1 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-black text-zinc-100 tracking-wide">
                        {e.ticker}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 font-medium">
                        ${e.price}
                      </span>
                      {getDirectionBadge(e.direction)}
                    </div>
                    
                    <p className="text-[10px] font-mono text-zinc-400 font-bold truncate">
                      {e.type}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-600 line-clamp-1">
                      {e.reason}
                    </p>
                  </div>

                  {/* Priority, Confidence and time indicators */}
                  <div className="text-right shrink-0 space-y-1.5 font-mono text-[10px]">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${priorityStyle.bg}`}>
                        {e.priority}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">
                        {e.confidence}% Conf
                      </span>
                    </div>
                    <span className="text-[8px] text-zinc-600 block">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs font-mono text-zinc-500">
                  No active opportunities match the selected filters.
                </p>
                <button
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterPriority('ALL');
                    setFilterDirection('ALL');
                    setSearchTicker('');
                  }}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-850 text-amber-500 text-[9px] uppercase font-mono cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Secure Watermark Warning */}
          <div className="bg-[#0C0C0D] border border-dashed border-zinc-900 p-3 rounded-lg flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-500/70 shrink-0" />
            <p className="text-[9px] font-mono text-zinc-500 leading-normal">
              <strong className="text-zinc-400 uppercase">Advisory Safe Protocol:</strong> Smart Market Scanner is strictly informational and will never automatically write to the ledger or create a broker position order.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Opportunity Deep-Dive Panel (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col justify-between space-y-5">
          {selectedEvent ? (
            <div className="space-y-5">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Selected Opportunity</span>
                  <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                    MATRIX RECONNAISSANCE
                  </h4>
                </div>
                <Compass className="w-4 h-4 text-amber-500" />
              </div>

              {/* Big Ticker Info and Price */}
              <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.005] blur-2xl rounded-full" />
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-serif font-bold text-zinc-100">{selectedEvent.ticker}</span>
                    <span className="block text-[9px] font-mono text-zinc-500 uppercase mt-0.5">Scanned Ticker Asset</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-extrabold text-amber-400">${selectedEvent.price}</span>
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase mt-0.5">Trigger Quote</span>
                  </div>
                </div>
              </div>

              {/* Detailed Specs list */}
              <div className="space-y-2.5 font-mono text-[10px]">
                
                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-500">Pattern Detected</span>
                  <span className="text-zinc-200 font-bold uppercase">{selectedEvent.type}</span>
                </div>

                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-500">Scanning Priority</span>
                  <span className={`font-bold uppercase ${getPriorityStyle(selectedEvent.priority).text}`}>
                    {selectedEvent.priority}
                  </span>
                </div>

                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-500">Biased Setup Direction</span>
                  <div>{getDirectionBadge(selectedEvent.direction)}</div>
                </div>

                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-500">Mathematical Confidence</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-zinc-900 h-1 rounded overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${selectedEvent.confidence}%` }} />
                    </div>
                    <span className="text-amber-400 font-bold">{selectedEvent.confidence}%</span>
                  </div>
                </div>

                <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-500">Detection Epoch</span>
                  <span className="text-zinc-400">{new Date(selectedEvent.timestamp).toLocaleDateString()} {new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
                </div>

              </div>

              {/* Reason Box */}
              <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg space-y-2">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">
                  Opportunity Reason / Technical Justification
                </span>
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed italic">
                  "{selectedEvent.reason}"
                </p>
              </div>

              {/* Advisory info block */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-center space-y-1.5">
                <p className="text-[9px] font-mono text-amber-500/90 font-bold uppercase tracking-wider">
                  PRE-TRADE RECONNAISSANCE ONLY
                </p>
                <p className="text-[8px] font-mono text-zinc-500 leading-normal">
                  To open a position, evaluate these parameters manually, check the Guardian Risk Gateway on Mission Control, and proceed with trade logs under the Decision Ledger view.
                </p>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Compass className="w-12 h-12 text-zinc-800 animate-spin-slow" />
              <h5 className="text-xs font-serif font-bold text-zinc-400 uppercase">No signal selected</h5>
              <p className="text-[10px] font-mono text-zinc-600 max-w-xs leading-normal">
                Choose an active opportunity from the live feed on the left to review its raw market diagnostics.
              </p>
            </div>
          )}

          {/* Ledger connection confirmation */}
          <div className="text-center text-[8px] font-mono text-zinc-600 border-t border-zinc-900 pt-3">
            <span>SECURE OPPORTUNITY SUITE v3.0 // NO DIRECT LEDGER WRITE PERMITTED</span>
          </div>
        </div>

      </div>

        </div>
      )}

    </div>
  );
}
