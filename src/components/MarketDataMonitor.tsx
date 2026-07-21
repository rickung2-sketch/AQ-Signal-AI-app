import React, { useState, useEffect } from 'react';
import { 
  Database, Activity, ShieldCheck, ShieldAlert, Cpu, 
  Clock, Zap, Settings, RefreshCw, Layers, Sparkles, CheckCircle, Wifi, Play, Square, AlertCircle
} from 'lucide-react';
import { marketDataService } from '../plugins/marketDataService';
import { Timeframe, OHLC, ConnectionStatus } from '../types/marketDataPluginSDK';
import { ProviderTelemetry, TickUpdate } from '../types/marketDataService';

interface MarketDataMonitorProps {
  addLog: (log: string) => void;
}

export default function MarketDataMonitor({ addLog }: MarketDataMonitorProps) {
  const [telemetry, setTelemetry] = useState<ProviderTelemetry>(marketDataService.getTelemetry());
  const [activeProviderId, setActiveProviderId] = useState<string>(marketDataService.getActiveProviderId());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(marketDataService.getConnectionStatus());
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15M');
  const [livePrice, setLivePrice] = useState<number>(98500);
  const [liveBid, setLiveBid] = useState<number>(98490);
  const [liveAsk, setLiveAsk] = useState<number>(98510);
  const [liveSpread, setLiveSpread] = useState<number>(20);
  const [recentTicks, setRecentTicks] = useState<TickUpdate[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [candles, setCandles] = useState<OHLC[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);

  // Credentials form state
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const [proApiKey, setProApiKey] = useState<string>('');
  const [showCredentialsForm, setShowCredentialsForm] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const activeProvider = marketDataService.getActiveProvider();
  const allProviders = marketDataService.getProvidersList();

  // 1. Sync telemetry stats from service loop
  useEffect(() => {
    // Listen to logs from market data service
    marketDataService.setLogger((msg) => {
      addLog(msg);
    });

    const telemetryInterval = setInterval(() => {
      const stats = marketDataService.getTelemetry();
      setTelemetry(stats);
      setConnectionStatus(marketDataService.getConnectionStatus());
      setActiveProviderId(marketDataService.getActiveProviderId());
    }, 1000);

    return () => clearInterval(telemetryInterval);
  }, [addLog]);

  // 2. Subscribe to live tick stream via the abstraction layer
  useEffect(() => {
    if (!isLiveStreaming) return;

    const unsubscribe = marketDataService.subscribeTicks(selectedSymbol, (tick: TickUpdate) => {
      setLivePrice(tick.price);
      setLiveBid(tick.bid);
      setLiveAsk(tick.ask);
      setLiveSpread(tick.spread);
      
      setRecentTicks(prev => {
        const next = [tick, ...prev];
        return next.slice(0, 15); // keep 15 ticks max
      });
    });

    return () => unsubscribe();
  }, [selectedSymbol, isLiveStreaming]);

  // 3. Load Candlestick chart data from service
  const loadOHLCCandles = async () => {
    setIsLoadingCandles(true);
    try {
      const ohlc = await marketDataService.getOHLCCandles(selectedSymbol, selectedTimeframe, 24);
      setCandles(ohlc);
    } catch (err) {
      console.error('Error fetching candles from service:', err);
    } finally {
      setIsLoadingCandles(false);
    }
  };

  useEffect(() => {
    loadOHLCCandles();
  }, [selectedSymbol, selectedTimeframe, activeProviderId]);

  // Swapping provider routine
  const handleSwapProvider = async (pId: string) => {
    setConnectionError(null);
    const credentialsToUse: Record<string, string> = {};
    
    if (pId === 'PLG-MKT-BINANCE-LIVE') {
      if (!apiKey || !apiSecret) {
        setConnectionError('API Key and Secret are required for Binance Live Client.');
        setShowCredentialsForm(true);
        return;
      }
      credentialsToUse.apiKey = apiKey;
      credentialsToUse.apiSecret = apiSecret;
    } else if (pId === 'PLG-MKT-COINBASE-PRO') {
      if (!apiKey || !passphrase) {
        setConnectionError('API Key and FIX Passphrase are required for Coinbase Client.');
        setShowCredentialsForm(true);
        return;
      }
      credentialsToUse.apiKey = apiKey;
      credentialsToUse.passphrase = passphrase;
    } else if (pId === 'PLG-MKT-COINGECKO') {
      if (!proApiKey) {
        setConnectionError('Pro API Key is required for CoinGecko Pro Client.');
        setShowCredentialsForm(true);
        return;
      }
      credentialsToUse.proApiKey = proApiKey;
    }

    try {
      await marketDataService.switchProvider(pId, credentialsToUse);
      setShowCredentialsForm(false);
      addLog(`MONITOR: Hot-swapped active market provider to [${pId}]`);
    } catch (e: any) {
      setConnectionError(e.message || 'Connection handshake failed.');
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 85) return 'text-green-400 border-green-500/20 bg-green-500/5';
    if (quality >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const renderCandleSVG = () => {
    if (candles.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-950/20">
          <span className="text-[10px] font-mono text-zinc-600 uppercase">Awaiting candle matrix initialization...</span>
        </div>
      );
    }

    const maxVal = Math.max(...candles.map(c => c.high));
    const minVal = Math.min(...candles.map(c => c.low));
    const range = maxVal - minVal || 1;

    const h = 140;
    const w = 480;
    const pad = 12;

    const scaleY = (val: number) => h - pad - ((val - minVal) / range) * (h - 2 * pad);
    const scaleX = (idx: number) => pad + (idx / (candles.length - 1)) * (w - 2 * pad);
    const boxW = Math.max(3, Math.floor((w - 2 * pad) / candles.length) - 5);

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto mt-2">
        {/* Grids */}
        {[0, 0.5, 1].map((r, i) => {
          const pr = minVal + r * range;
          const y = scaleY(pr);
          return (
            <g key={i}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="#18181C" strokeDasharray="3,3" />
              <text x="4" y={y - 3} fill="#4b5563" fontSize="8" fontFamily="monospace">
                ${pr.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
            </g>
          );
        })}

        {/* Candles */}
        {candles.map((candle, idx) => {
          const x = scaleX(idx);
          const yOpen = scaleY(candle.open);
          const yClose = scaleY(candle.close);
          const yHigh = scaleY(candle.high);
          const yLow = scaleY(candle.low);
          const isBull = candle.close >= candle.open;
          const color = isBull ? '#10B981' : '#EF4444';

          return (
            <g key={idx}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
              <rect
                x={x - boxW / 2}
                y={Math.min(yOpen, yClose)}
                width={boxW}
                height={Math.max(2, Math.abs(yOpen - yClose))}
                fill={isBull ? 'transparent' : color}
                stroke={color}
                strokeWidth="1.2"
                rx="0.5"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div id="mkt-data-monitor-screen" className="space-y-6">
      
      {/* Title Header Block */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/2 blur-3xl rounded-full pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
              V5.0 COMPLIANT
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              Unified Decoupled Abstraction
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            MARKET DATA MONITOR
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            Real-time interface monitoring for active exchanges and feeds. Every subsystem within AQ Trade AI receives high-fidelity prices exclusively through this managed layer, avoiding raw API leaks.
          </p>
        </div>

        {/* Global Quality Widget */}
        <div className="flex items-center gap-4 bg-[#0B0B0C] border border-zinc-900 p-4 rounded-lg shrink-0">
          <div className="relative flex h-2.5 w-2.5">
            {connectionStatus === 'CONNECTED' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            )}
          </div>
          <div className="text-left font-mono">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">MONITOR CAPABILITY</span>
            <span className="text-xs text-zinc-300 font-bold">
              {activeProviderId === 'PLG-MKT-DEMO-MODE' ? 'DEMO SIMULATION ACTIVE' : 'REAL-TIME PROXIED'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Telemetry Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Provider Card */}
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="font-mono overflow-hidden">
            <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">active source</span>
            <span className="text-[11px] font-bold text-zinc-200 block truncate">{telemetry.providerName}</span>
          </div>
        </div>

        {/* Latency Card */}
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 rounded bg-blue-500/5 border border-blue-500/10 text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="font-mono">
            <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">network latency</span>
            <span className="text-xs font-bold text-zinc-200 flex items-baseline gap-1">
              {telemetry.latency}ms
              <span className="text-[8px] text-zinc-500">RTT</span>
            </span>
          </div>
        </div>

        {/* Update rate */}
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div className="font-mono">
            <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">ticks frequency</span>
            <span className="text-xs font-bold text-zinc-200">
              {telemetry.updateRate} <span className="text-[8px] text-zinc-500">ticks / min</span>
            </span>
          </div>
        </div>

        {/* Connection Quality Card */}
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 rounded bg-purple-500/5 border border-purple-500/10 text-purple-400 shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="font-mono">
            <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">signal index</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${getQualityColor(telemetry.connectionQuality)}`}>
              {telemetry.connectionQuality}% Quality
            </span>
          </div>
        </div>

      </div>

      {/* Main interactive split container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column Left (4 cols): Swappable Providers registry and config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                PROVIDER SWAP GATEWAY
              </h3>
            </div>

            <div className="space-y-2.5">
              {allProviders.map(prov => {
                const isCurrent = telemetry.providerId === prov.id;
                return (
                  <div 
                    key={prov.id}
                    onClick={() => {
                      if (prov.id === 'PLG-MKT-DEMO-MODE') {
                        handleSwapProvider(prov.id);
                      } else {
                        setActiveProviderId(prov.id);
                        setShowCredentialsForm(true);
                      }
                    }}
                    className={`p-3 rounded-lg border font-mono text-left cursor-pointer transition-all ${
                      isCurrent 
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-400'
                        : 'bg-zinc-900/10 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{prov.name}</span>
                      {isCurrent && <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 px-1 rounded">ACTIVE</span>}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1.5 leading-normal">{prov.description}</p>
                    <div className="flex gap-2 mt-2 text-[8px] uppercase tracking-wider text-zinc-500">
                      <span>Symbols: {prov.supportedSymbols.length}</span>
                      <span>•</span>
                      <span>Frames: {prov.supportedTimeframes.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Credentials credentials prompt */}
            {showCredentialsForm && (
              <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-lg space-y-3 font-mono">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gateway Key Authentication
                </div>
                
                {activeProviderId === 'PLG-MKT-BINANCE-LIVE' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase block">binance api key</label>
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="Binance API Key..."
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 text-zinc-300 rounded focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase block">binance api secret</label>
                      <input 
                        type="password" 
                        value={apiSecret} 
                        onChange={(e) => setApiSecret(e.target.value)} 
                        placeholder="Binance Secret..."
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 text-zinc-300 rounded focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeProviderId === 'PLG-MKT-COINBASE-PRO' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase block">coinbase api key</label>
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="Coinbase key..."
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 text-zinc-300 rounded focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase block">FIX Passphrase</label>
                      <input 
                        type="password" 
                        value={passphrase} 
                        onChange={(e) => setPassphrase(e.target.value)} 
                        placeholder="Coinbase Passphrase..."
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 text-zinc-300 rounded focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeProviderId === 'PLG-MKT-COINGECKO' && (
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase block">coingecko pro api key</label>
                    <input 
                      type="password" 
                      value={proApiKey} 
                      onChange={(e) => setProApiKey(e.target.value)} 
                      placeholder="CG Pro key..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 text-zinc-300 rounded focus:outline-none"
                    />
                  </div>
                )}

                {connectionError && (
                  <div className="p-2 bg-red-950/10 border border-red-900/30 rounded text-[9px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{connectionError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSwapProvider(activeProviderId)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 rounded cursor-pointer"
                  >
                    CONNECT
                  </button>
                  <button 
                    onClick={() => setShowCredentialsForm(false)}
                    className="px-2.5 border border-zinc-850 hover:border-zinc-700 text-zinc-500 text-xs rounded cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Core protection rule reminder card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3 font-mono">
            <h4 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              COHERENT ENGINE ASSURANCES
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Every system engine (Market Intelligence, Strategy Engine, Rule Engine, Guardian) is globally locked to this unified abstractions wrapper. Direct queries are intercepted.
            </p>
            <div className="p-2.5 rounded bg-[#0A0B0C] border border-zinc-900 flex items-center gap-2 text-[9px] text-zinc-400">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Breaker limits: Swapping resets cache to prevent stale quote execution slips.</span>
            </div>
          </div>
        </div>

        {/* Column Right (8 cols): Real-time tickers stream, Interactive candles layout */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Real-time Ticker Cockpit banner */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 w-24 h-24 bg-green-500/1 blur-2xl rounded-full" />
            
            <div className="col-span-1 border-r border-zinc-900/60 pr-2">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">live ticker</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <select 
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-100 py-1 px-1.5 rounded focus:outline-none w-full mt-1.5"
              >
                {activeProvider.supportedSymbols.map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 border-r border-zinc-900/60 px-2">
              <span className="text-[8px] text-zinc-500 uppercase block tracking-wider">last price</span>
              <div className="text-base md:text-lg font-bold text-green-400 tracking-tight mt-1 truncate">
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="col-span-1 border-r border-zinc-900/60 px-2">
              <span className="text-[8px] text-zinc-500 uppercase block tracking-wider">bid/ask spread</span>
              <div className="text-xs font-bold text-zinc-200 mt-1 whitespace-nowrap">
                ${liveBid.toLocaleString()} / ${liveAsk.toLocaleString()}
              </div>
              <span className="text-[8px] text-zinc-500 block mt-0.5">Spread: ${liveSpread}</span>
            </div>

            <div className="col-span-1 pl-2 flex flex-col justify-center">
              <button 
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={`w-full py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isLiveStreaming 
                    ? 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200' 
                    : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/15'
                }`}
              >
                {isLiveStreaming ? (
                  <>
                    <Square className="w-3 h-3 fill-zinc-400" />
                    PAUSE TAPE
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-green-400" />
                    STREAM TAPE
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Candles Area */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                  ACTIVE OHLC CANDLES ENGINE
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
                  className="bg-zinc-900 border border-zinc-850 text-[10px] font-mono text-zinc-400 rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value="15M">15 Minutes</option>
                  <option value="1H">1 Hour</option>
                  <option value="4H">4 Hours</option>
                </select>
                <button 
                  onClick={loadOHLCCandles}
                  className="p-1 rounded hover:bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  title="Reload Candle Feed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCandles ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingCandles ? (
              <div className="h-44 flex items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-950/20">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Loading remote OHLC database vectors...</span>
                </div>
              </div>
            ) : (
              renderCandleSVG()
            )}
          </div>

          {/* Real-time Scrolling Ticks Panel */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <h3 className="text-xs font-serif font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-500" />
                SECURE STREAM TICK TAPE LOG
              </h3>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">Updates every 2s</span>
            </div>

            {recentTicks.length === 0 ? (
              <div className="py-6 text-center text-[10px] font-mono text-zinc-600 uppercase border border-dashed border-zinc-900 rounded bg-zinc-950/10">
                Awaiting streaming ticks subscription trigger...
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                {recentTicks.map((tick, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-[#0A0B0C] border border-zinc-900/60 hover:border-zinc-800 transition-all text-zinc-400 hover:text-zinc-200 animate-fade-in"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold">[{tick.symbol}]</span>
                      <span className="text-zinc-600">|</span>
                      <span>Tick #{recentTicks.length - index}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Price: <strong className="text-green-400">${tick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                      <span className="hidden md:inline text-zinc-600">Spread: ${tick.spread}</span>
                      <span className="text-zinc-600 text-[9px]">{new Date(tick.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
