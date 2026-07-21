import React, { useState } from 'react';
import { Terminal, Shield, RefreshCw, Zap, Bell, CheckCircle2, ChevronRight, Activity, Cpu } from 'lucide-react';

interface CommandCenterProps {
  onTriggerAction: (action: string) => void;
  logs: string[];
  addLog: (log: string) => void;
  marketScore: number;
  readinessScore: number;
}

export default function CommandCenter({ onTriggerAction, logs, addLog, marketScore, readinessScore }: CommandCenterProps) {
  const [tickerInput, setTickerInput] = useState('');
  const [selectedSize, setSelectedSize] = useState('1.0');
  const [isDeploying, setIsDeploying] = useState(false);

  const handleQuickAnalysis = (ticker: string) => {
    if (!ticker) return;
    addLog(`CMD: Initiating premium algorithmic sweep for $${ticker.toUpperCase()}...`);
    setIsDeploying(true);
    setTimeout(() => {
      addLog(`AI: Dynamic audit complete for $${ticker.toUpperCase()}. Readiness factor: ${readinessScore}%. AI Guardian rating: OPTIMAL.`);
      setIsDeploying(false);
      setTickerInput('');
    }, 1500);
  };

  const systemActions = [
    { name: 'Perform Diagnostic Audit', desc: 'Verify latency and key validations across all nodes', code: 'DIAG_AUDIT' },
    { name: 'Calibrate AQ Sensors', desc: 'Sync pricing feeds and mock order book levels', code: 'CALIB_SENSORS' },
    { name: 'Reset Guardrails', desc: 'Flush active risk warnings and set limit locks', code: 'RESET_RISK' },
  ];

  return (
    <div className="space-y-6">
      {/* Header section with status badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/80 border border-amber-500/10 p-5 rounded-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
            AQ COMMAND CENTER
          </h2>
          <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase mt-1">
            Institutional Quantitative Core Command Node
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">SYS HEALTH:</span>
            <span className="text-xs font-bold font-mono text-amber-400">99.8%</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">API SYNC:</span>
            <span className="text-xs font-bold font-mono text-zinc-300">STABLE (MOCK)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Executive Actions & Real-time Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Action Cockpit (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/2 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-4 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              QUICK AUDIT UTILITY
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                  TARGET TICKER SYMBOL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    placeholder="e.g. BTC, ETH, TSLA, NVDA"
                    className="flex-1 bg-zinc-900 border border-zinc-800/80 focus:border-amber-500/40 rounded-lg px-4 py-2 text-sm text-zinc-200 uppercase font-mono placeholder-zinc-600 focus:outline-none transition-all"
                  />
                  <button
                    onClick={() => handleQuickAnalysis(tickerInput)}
                    disabled={isDeploying || !tickerInput}
                    className="bg-amber-500 text-black font-semibold font-mono text-xs tracking-widest px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isDeploying ? 'SCANNING...' : 'SCAN'}
                  </button>
                </div>
              </div>

              {/* Ticker Presets */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">PRESETS:</span>
                {['BTCUSD', 'ETHUSD', 'SOLUSD', 'NVDA', 'AAPL'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleQuickAnalysis(sym)}
                    className="bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800/80 hover:border-amber-500/30 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    ${sym}
                  </button>
                ))}
              </div>

              {/* Position Template Rules */}
              <div className="border-t border-zinc-900 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    DEFAULT ORDER THRESHOLD
                  </span>
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    {['0.5', '1.0', '2.5', '5.0'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-amber-500 text-black font-bold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {sz} LOT
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    <span className="text-amber-400 font-bold">GUARDIAN RATIO ACTIVE</span>: Current position size threshold sets leverage risk profile to <span className="text-amber-400 font-bold">10x</span>. Total asset lock-down is monitored dynamically.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Calibration Actions */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SYSTEM PROTOCOLS
            </h3>
            <div className="divide-y divide-zinc-900">
              {systemActions.map((action, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold font-serif text-zinc-300">{action.name}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{action.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      addLog(`CMD: Triggering remote core command: ${action.code}...`);
                      onTriggerAction(action.code);
                    }}
                    className="bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800/80 hover:border-amber-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-amber-400 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    RUN
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Console Feed & Notifications (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                INTELLIGENT FEED
              </h3>
              <button
                onClick={() => {
                  addLog('SYS: Flushed internal telemetry log cache.');
                }}
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                CLEAR
              </button>
            </div>

            {/* Simulated Live Output Console */}
            <div className="flex-1 bg-[#070708] border border-zinc-900/60 rounded-lg p-3 font-mono text-[11px] overflow-y-auto max-h-[280px] space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed break-all border-l-2 border-zinc-800/30 pl-2">
                  <span className="text-zinc-600 text-[10px] mr-1.5">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  {log.startsWith('CMD:') ? (
                    <span className="text-amber-400/95 font-bold">{log}</span>
                  ) : log.startsWith('AI:') ? (
                    <span className="text-yellow-100">{log}</span>
                  ) : log.startsWith('WARN:') ? (
                    <span className="text-red-400 font-bold">{log}</span>
                  ) : (
                    <span className="text-zinc-400">{log}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Warning System indicator */}
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  REAL-TIME ADVISORY
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 leading-normal mt-0.5">
                  AI Guardian rating is high ({readinessScore}%). Volatility checks confirm the path is fully secure for premium setups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
