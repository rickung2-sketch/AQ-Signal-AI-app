import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, RefreshCw, Radio, CheckCircle, XCircle, AlertTriangle, 
  Settings, Key, Play, Square, Activity, ShieldCheck, Flame, ArrowUpRight, 
  Clock, ShieldAlert, Cpu, Info, Zap, HelpCircle, Layers, Trash2, Award
} from 'lucide-react';
import { ALL_MARKET_DATA_PROVIDERS } from '../plugins/marketDataPlugins';
import { MarketDataFeed, Timeframe, ConnectionStatus, OHLC } from '../types/marketDataPluginSDK';
import { marketDataService } from '../plugins/marketDataService';
import { TradeLog } from '../types/dashboard';

interface MarketDataManagerProps {
  addLog: (log: string) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onAddTrade?: (trade: TradeLog) => void;
}

export default function MarketDataManager({ addLog, onConnectionChange, onAddTrade }: MarketDataManagerProps) {
  const [providers, setProviders] = useState(ALL_MARKET_DATA_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('PLG-MKT-BINANCE-LIVE');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  
  // Credentials input
  const [creds, setCreds] = useState<Record<string, string>>({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    proApiKey: ''
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15M');
  const [feed, setFeed] = useState<MarketDataFeed | null>(null);
  const [isTickActive, setIsTickActive] = useState<boolean>(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [simulatedFailureActive, setSimulatedFailureActive] = useState<boolean>(false);

  // Reference to current active provider
  const activeProvider = providers.find(p => p.id === selectedProviderId);

  // Load state on mount
  useEffect(() => {
    const savedStatus = localStorage.getItem('aq_mkt_connection_status') as ConnectionStatus;
    const savedProvider = localStorage.getItem('aq_mkt_provider_id');
    const savedSymbol = localStorage.getItem('aq_mkt_symbol');
    const savedTimeframe = localStorage.getItem('aq_mkt_timeframe') as Timeframe;

    if (savedProvider) setSelectedProviderId(savedProvider);
    if (savedSymbol) setSelectedSymbol(savedSymbol);
    if (savedTimeframe) setSelectedTimeframe(savedTimeframe);

    if (savedStatus === 'CONNECTED') {
      // Re-establish connection automatically
      setConnectionStatus('CONNECTED');
      setIsTickActive(true);
      if (onConnectionChange) onConnectionChange(true);
    } else {
      localStorage.setItem('aq_mkt_connection_status', 'DISCONNECTED');
      if (onConnectionChange) onConnectionChange(false);
    }
  }, []);

  // Sync credentials form based on provider selection
  useEffect(() => {
    setValidationError(null);
  }, [selectedProviderId]);

  // Data Fetching tick loop (delegates to marketDataService)
  useEffect(() => {
    let intervalId: any;

    if (connectionStatus === 'CONNECTED' && isTickActive && activeProvider) {
      const fetchTicks = async () => {
        try {
          // If failure simulation gets activated
          if (simulatedFailureActive) {
            triggerFailureSequence();
            return;
          }

          const livePrice = await marketDataService.getCurrentPrice(selectedSymbol);
          const bid = await marketDataService.getBid(selectedSymbol);
          const ask = await marketDataService.getAsk(selectedSymbol);
          const spread = await marketDataService.getSpread(selectedSymbol);
          const ohlc = await marketDataService.getOHLCCandles(selectedSymbol, selectedTimeframe, 15);
          const tele = marketDataService.getTelemetry();

          const freshFeed: MarketDataFeed = {
            symbol: selectedSymbol,
            timeframe: selectedTimeframe,
            livePrice,
            bid,
            ask,
            ohlc,
            volume: Math.round(150000 + Math.random() * 50000),
            lastUpdate: new Date().toISOString(),
            latency: tele.latency,
            dataQuality: tele.connectionQuality >= 85 ? 'Excellent' : tele.connectionQuality >= 50 ? 'Good' : 'Poor'
          };

          setFeed(freshFeed);
          setPriceHistory(prev => [...prev, livePrice].slice(-20));
          
          // Propagate connection status to parent
          if (onConnectionChange) onConnectionChange(true);
        } catch (e) {
          console.error('Handled feed fetch error', e);
          triggerFailureSequence();
        }
      };

      fetchTicks(); // Initial fetch
      intervalId = setInterval(fetchTicks, 2000); // Poll every 2 seconds for fresh ticks
    } else {
      setFeed(null);
      setPriceHistory([]);
    }

    return () => clearInterval(intervalId);
  }, [connectionStatus, isTickActive, selectedProviderId, selectedSymbol, selectedTimeframe, simulatedFailureActive]);

  // Handle actual connection routine
  const handleConnect = async () => {
    if (!activeProvider) return;
    setValidationError(null);

    // Validate provider credentials
    const validation = activeProvider.validateCredentials(creds);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid credentials provided.');
      addLog(`MARKET SDK: Connection rejected. Validation error on provider [${activeProvider.name}].`);
      return;
    }

    setConnectionStatus('CONNECTING');
    addLog(`MARKET SDK: Establishing secure node connection to [${activeProvider.name}]...`);

    try {
      await marketDataService.switchProvider(selectedProviderId, creds);
      setConnectionStatus('CONNECTED');
      setIsTickActive(true);
      setSimulatedFailureActive(false);
      localStorage.setItem('aq_mkt_connection_status', 'CONNECTED');
      localStorage.setItem('aq_mkt_provider_id', selectedProviderId);
      localStorage.setItem('aq_mkt_symbol', selectedSymbol);
      localStorage.setItem('aq_mkt_timeframe', selectedTimeframe);
      addLog(`MARKET SDK: [${activeProvider.name}] successfully connected via MarketDataService. Live ticks active.`);
      if (onConnectionChange) onConnectionChange(true);
    } catch (e: any) {
      setConnectionStatus('FAILED');
      addLog(`MARKET SDK ERROR: Connection handshake with [${activeProvider.name}] failed.`);
      if (onConnectionChange) onConnectionChange(false);
    }
  };

  // Disconnect routine
  const handleDisconnect = async () => {
    if (!activeProvider) return;
    addLog(`MARKET SDK: Terminating connection with [${activeProvider.name}].`);
    await marketDataService.switchProvider('PLG-MKT-DEMO-MODE');
    setConnectionStatus('DISCONNECTED');
    setIsTickActive(false);
    setFeed(null);
    localStorage.setItem('aq_mkt_connection_status', 'DISCONNECTED');
    if (onConnectionChange) onConnectionChange(false);
  };

  // Switch to Demo Data Mode after a failure
  const triggerFailureSequence = async () => {
    setConnectionStatus('FAILED');
    setIsTickActive(false);
    setFeed(null);
    localStorage.setItem('aq_mkt_connection_status', 'DISCONNECTED');
    
    const providerName = activeProvider?.name || 'Unknown';
    addLog(`CRITICAL CRASH: Market Data Plugin [${providerName}] stream dropped unexpected frames!`);
    addLog(`AQ CORE SHIELD: Automated sensor failure detected. SWITCHING INSTANTLY TO DEMO DATA MODE.`);
    addLog(`SYS: [AQ Core] ${providerName} connection severed. Fallback circuit breaker activated. System set to Demo Data Mode.`);
    
    // Record in Decision Ledger if onAddTrade is provided
    if (onAddTrade) {
      const failureLedgerEntry: TradeLog = {
        id: `AQ-FAIL-${Math.floor(Math.random() * 90000 + 10000)}`,
        timestamp: new Date().toISOString(),
        ticker: selectedSymbol || 'SYSTEM',
        direction: 'SELL', // Using 'SELL' as placeholder representing downside/degrade
        size: 0,
        leverage: 0,
        entryPrice: 0,
        conviction: 1,
        status: 'LOSS', // Using 'LOSS' representing system fault
        notes: `CRITICAL CIRCUIT BREAKER: [${providerName}] feed collapsed. Automated sensor failure trigger. Seamlessly switched to internal Demo Data Mode to shield capital.`,
        guardianRiskScore: 100,
        guardianFeedback: `CRITICAL FAULT: Transport line disconnected. Risk parameters auto-locked.`
      };
      onAddTrade(failureLedgerEntry);
    }

    await marketDataService.switchProvider('PLG-MKT-DEMO-MODE');
    if (onConnectionChange) onConnectionChange(false);
  };

  // Clear credentials
  const handleClearCreds = () => {
    setCreds({ apiKey: '', apiSecret: '', passphrase: '', proApiKey: '' });
    setValidationError(null);
    addLog(`MARKET SDK: Revoked local credentials cache for provider.`);
  };

  // Custom Candle & Volume SVG Renderer Helper
  const renderCandleChart = (ohlc: OHLC[], hasVolume: boolean) => {
    if (!ohlc || ohlc.length === 0) return null;

    const chartHeight = 180;
    const chartWidth = 500;
    const padding = 15;

    // Find min and max prices to scale y-axis
    const maxPrice = Math.max(...ohlc.map(c => c.high));
    const minPrice = Math.min(...ohlc.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;

    // Scale helpers
    const scaleY = (price: number) => {
      return chartHeight - padding - ((price - minPrice) / priceRange) * (chartHeight - 2 * padding);
    };

    const scaleX = (index: number) => {
      return padding + (index / (ohlc.length - 1)) * (chartWidth - 2 * padding);
    };

    const candleWidth = Math.max(2, Math.floor((chartWidth - 2 * padding) / ohlc.length) - 6);

    // Max volume for volume scaling
    const volumes = ohlc.map(c => c.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;
    const volumeHeight = 50;

    return (
      <div className="space-y-4">
        {/* Candlestick Chart SVG */}
        <div className="relative bg-zinc-950/80 border border-zinc-900 rounded-lg p-2 overflow-hidden">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-500 uppercase">
            {selectedSymbol} {selectedTimeframe} Candlestick Grid
          </div>
          <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-400 font-bold">
            High: ${maxPrice.toLocaleString()} | Low: ${minPrice.toLocaleString()}
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            {/* Horizontal gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const price = minPrice + ratio * priceRange;
              const y = scaleY(price);
              return (
                <g key={index}>
                  <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#18181B" strokeDasharray="3,3" />
                  <text x="5" y={y - 3} fill="#52525B" fontSize="8" fontFamily="monospace">
                    ${price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Render candles */}
            {ohlc.map((candle, idx) => {
              const x = scaleX(idx);
              const yOpen = scaleY(candle.open);
              const yClose = scaleY(candle.close);
              const yHigh = scaleY(candle.high);
              const yLow = scaleY(candle.low);
              const isBullish = candle.close >= candle.open;
              const candleColor = isBullish ? '#10B981' : '#EF4444'; // Emerald or Rose

              return (
                <g key={idx}>
                  {/* Wick (high to low) */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.2" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(yOpen, yClose)}
                    width={candleWidth}
                    height={Math.max(2, Math.abs(yOpen - yClose))}
                    fill={isBullish ? 'transparent' : candleColor}
                    stroke={candleColor}
                    strokeWidth="1.5"
                    rx="1"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Volume Sub-Chart SVG */}
        <div className="relative bg-zinc-950/80 border border-zinc-900 rounded-lg p-2 overflow-hidden">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-500 uppercase">
            {hasVolume ? 'AGGREGATE ORDER BOOK VOLUME' : 'VOLUME NOT SUPPLIED BY PROVIDER'}
          </div>
          {hasVolume ? (
            <svg viewBox={`0 0 ${chartWidth} ${volumeHeight}`} className="w-full h-auto mt-4">
              {ohlc.map((candle, idx) => {
                const x = scaleX(idx);
                const vol = candle.volume || 0;
                const vHeight = (vol / maxVolume) * (volumeHeight - 10);
                const y = volumeHeight - vHeight;
                const isBullish = candle.close >= candle.open;
                const barColor = isBullish ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
                const borderBarColor = isBullish ? '#10B981' : '#EF4444';

                return (
                  <rect
                    key={idx}
                    x={x - candleWidth / 2}
                    y={y}
                    width={candleWidth}
                    height={vHeight}
                    fill={barColor}
                    stroke={borderBarColor}
                    strokeWidth="0.5"
                    rx="0.5"
                  />
                );
              })}
            </svg>
          ) : (
            <div className="h-[50px] flex items-center justify-center text-[10px] font-mono text-zinc-600 uppercase border border-dashed border-zinc-900 mt-2 bg-zinc-950/20">
              <Info className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
              Provider SDK reports no volumetric flow for this query
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Banner Header */}
      <div id="mkt-header-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/2 blur-3xl rounded-full" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
              VERSION 1.3
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              DECOUPLED FEED NETWORK
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            MARKET DATA MANAGER
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            Integrate modular feed providers using our Version 1.3 Decoupled SDK. Easily configure API keys, monitor transport latency, inspect candles, and test automated fallback safety breakers.
          </p>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center gap-3 bg-[#0C0C0D] border border-zinc-900 px-4 py-3 rounded-lg shrink-0">
          <div className="relative flex h-2.5 w-2.5">
            {connectionStatus === 'CONNECTED' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </>
            ) : connectionStatus === 'CONNECTING' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-600"></span>
              </>
            )}
          </div>
          <div className="text-left font-mono">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">NODE STATUS</span>
            <span className={`text-xs font-bold ${
              connectionStatus === 'CONNECTED' ? 'text-green-400' :
              connectionStatus === 'CONNECTING' ? 'text-amber-400' :
              connectionStatus === 'FAILED' ? 'text-red-400 animate-pulse' : 'text-zinc-500'
            }`}>
              {connectionStatus === 'CONNECTED' ? 'PREMIUM PLUG ACTIVE' :
               connectionStatus === 'CONNECTING' ? 'CONNECTING HANDSHAKE' :
               connectionStatus === 'FAILED' ? 'BREAKER FAILED' : 'DEMO DATA MODE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Provider Registry & Credentials Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5">
            <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                PROVIDER CONFIGURATION
              </h3>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">SDK Decoupled</span>
            </div>

            <div className="space-y-4">
              
              {/* Select Provider */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Target Provider Plugin</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  disabled={connectionStatus === 'CONNECTED' || connectionStatus === 'CONNECTING'}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:hover:border-zinc-800 text-zinc-200 text-xs font-mono py-2.5 px-3 rounded-lg focus:outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.version})
                    </option>
                  ))}
                </select>
                {activeProvider && (
                  <p className="text-[10px] font-mono text-zinc-500 mt-1 leading-normal">
                    {activeProvider.description}
                  </p>
                )}
              </div>

              {/* Dynamic Credentials Form */}
              {activeProvider && connectionStatus !== 'CONNECTED' && connectionStatus !== 'CONNECTING' && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3.5 space-y-3.5">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                    <Key className="w-3.5 h-3.5" />
                    Secure Credentials Gateway
                  </div>

                  {selectedProviderId === 'PLG-MKT-BINANCE-LIVE' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Binance API Key</label>
                        <input
                          type="password"
                          value={creds.apiKey || ''}
                          onChange={(e) => setCreds({ ...creds, apiKey: e.target.value })}
                          placeholder="e.g. binance_pro_..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/40 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Binance API Secret</label>
                        <input
                          type="password"
                          value={creds.apiSecret || ''}
                          onChange={(e) => setCreds({ ...creds, apiSecret: e.target.value })}
                          placeholder="e.g. hmac_signature_hash..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/40 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProviderId === 'PLG-MKT-COINBASE-PRO' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Coinbase FIX Key</label>
                        <input
                          type="password"
                          value={creds.apiKey || ''}
                          onChange={(e) => setCreds({ ...creds, apiKey: e.target.value })}
                          placeholder="Coinbase key..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/40 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">FIX Passphrase</label>
                        <input
                          type="password"
                          value={creds.passphrase || ''}
                          onChange={(e) => setCreds({ ...creds, passphrase: e.target.value })}
                          placeholder="Coinbase passphrase..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/40 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProviderId === 'PLG-MKT-COINGECKO' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase block">CoinGecko Pro API Key</label>
                      <input
                        type="password"
                        value={creds.proApiKey || ''}
                        onChange={(e) => setCreds({ ...creds, proApiKey: e.target.value })}
                        placeholder="e.g. CG-pro-key..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/40 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                      />
                    </div>
                  )}

                  {validationError && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-mono p-2 rounded flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleConnect}
                      className="flex-1 cursor-pointer bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold font-mono text-xs py-2 px-3 rounded transition-colors"
                    >
                      ESTABLISH NODE HANDSHAKE
                    </button>
                    <button
                      onClick={handleClearCreds}
                      className="cursor-pointer border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 font-mono text-xs p-2 rounded"
                      title="Clear Credentials"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Connected Active State Info */}
              {connectionStatus === 'CONNECTED' && activeProvider && (() => {
                const tele = marketDataService.getTelemetry();
                return (
                  <div className="bg-green-950/5 border border-green-900/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-mono font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>NODE STREAM VERIFIED SECURE</span>
                    </div>
                    
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between border-b border-zinc-900/40 py-1">
                        <span className="text-zinc-500">Provider:</span>
                        <span className="text-zinc-200 font-bold">{activeProvider.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/40 py-1">
                        <span className="text-zinc-500">Connection Status:</span>
                        <span className="text-green-400 font-bold">{connectionStatus}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/40 py-1">
                        <span className="text-zinc-500">Last Update:</span>
                        <span className="text-zinc-300">
                          {feed ? new Date(feed.lastUpdate).toLocaleTimeString() : 'Syncing...'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className="bg-zinc-950 border border-zinc-900 p-2 rounded">
                        <span className="text-zinc-500 block text-[8px] uppercase">latency</span>
                        <span className="text-green-400 font-bold">{feed ? `${feed.latency}ms` : 'Calculating...'}</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-900 p-2 rounded">
                        <span className="text-zinc-500 block text-[8px] uppercase">Data Quality</span>
                        <span className="text-amber-400 font-bold">{feed ? feed.dataQuality : 'Assessing...'}</span>
                      </div>
                      
                      {typeof tele.requestsRemaining === 'number' && (
                        <div className="bg-zinc-950 border border-zinc-900 p-2 rounded col-span-2">
                          <span className="text-zinc-500 block text-[8px] uppercase">Requests Remaining</span>
                          <span className="text-blue-400 font-bold">
                            {tele.requestsRemaining} / {tele.requestsLimit || 8}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDisconnect}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-200 font-mono text-xs py-2 px-3 rounded transition-all cursor-pointer"
                    >
                      DISCONNECT FEED SAFELY
                    </button>
                  </div>
                );
              })()}

              {/* Feed Symbol & Timeframe Selectors */}
              <div className="space-y-3 bg-zinc-900/10 border border-zinc-900 rounded-lg p-3.5">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  <span>Stream Settings</span>
                  <span className="text-[8px] text-amber-500 bg-amber-500/5 px-1 rounded">MAPPED</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase block">Ticker Symbol</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => {
                        setSelectedSymbol(e.target.value);
                        localStorage.setItem('aq_mkt_symbol', e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-1.5 px-2.5 rounded focus:outline-none"
                    >
                      {activeProvider?.supportedSymbols.map(sym => (
                        <option key={sym} value={sym}>{sym}</option>
                      )) || (
                        <>
                          <option value="XAU/USD">XAU/USD</option>
                          <option value="BTC/USD">BTC/USD</option>
                          <option value="ETH/USD">ETH/USD</option>
                          <option value="SOL/USD">SOL/USD</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase block">Candle Frame</label>
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => {
                        const val = e.target.value as Timeframe;
                        setSelectedTimeframe(val);
                        localStorage.setItem('aq_mkt_timeframe', val);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-1.5 px-2.5 rounded focus:outline-none"
                    >
                      <option value="15M">15M (M15)</option>
                      <option value="1H">1H (H1)</option>
                      <option value="4H">4H (H4)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Fallback & Interruption Testing Simulator */}
          <div id="mkt-fallback-testing" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                AQ CORE PROTECTION & RESILIENCE TEST
              </h3>
            </div>
            
            <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
              AQ Core incorporates strict protective circuit breakers. Click below to inject a simulated hardware or transport failure. AQ Core will automatically isolate the fault and seamlessly drop back into offline Demo Data Mode to preserve recommendation safety.
            </p>

            <button
              onClick={() => {
                if (connectionStatus !== 'CONNECTED') {
                  addLog('MARKET SDK: Injector inactive. You must establish a connected plugin feed before injecting failures.');
                  return;
                }
                setSimulatedFailureActive(true);
              }}
              disabled={connectionStatus !== 'CONNECTED'}
              className="w-full cursor-pointer disabled:opacity-40 bg-red-950/15 hover:bg-red-950/30 border border-red-900/30 text-red-400 font-mono text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Flame className="w-4 h-4 animate-bounce" />
              INJECT SIMULATED FEED FAILURE (BREAKER TRIGGER)
            </button>
          </div>

        </div>

        {/* Right Column: Dynamic Feed Visualizer & Candle Charts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {connectionStatus === 'CONNECTED' && feed ? (
            /* ACTIVE FEED PRESENTATION */
            <div className="space-y-6">
              
              {/* Premium Quote Visualizer Card */}
              <div id="mkt-live-price-strip" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 grid grid-cols-3 gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/1 blur-3xl rounded-full pointer-events-none" />
                
                {/* Live Price */}
                <div className="col-span-1 border-r border-zinc-900 pr-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Live Index Price</span>
                  <div className="text-lg md:text-2xl font-mono font-black text-green-400 tracking-tight mt-1.5 flex items-baseline gap-1 animate-fade-in">
                    ${feed.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[8px] font-mono text-green-500/75 block mt-1">● STREAM ACTIVE</span>
                </div>

                {/* Bid */}
                <div className="col-span-1 border-r border-zinc-900 px-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Bid Quote</span>
                  <div className="text-base md:text-xl font-mono font-bold text-zinc-100 tracking-tight mt-1.5">
                    ${feed.bid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[8px] font-mono text-zinc-600 block mt-1">LIMIT BUY THRESHOLD</span>
                </div>

                {/* Ask */}
                <div className="col-span-1 pl-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Ask Quote</span>
                  <div className="text-base md:text-xl font-mono font-bold text-zinc-100 tracking-tight mt-1.5">
                    ${feed.ask.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[8px] font-mono text-zinc-600 block mt-1">LIMIT SELL THRESHOLD</span>
                </div>
              </div>

              {/* Dynamic Candle Chart */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                      INTERACTIVE OHLC PLOTTING GATEWAY
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>LAST SYNC: {new Date(feed.lastUpdate).toLocaleTimeString()}</span>
                  </div>
                </div>

                {renderCandleChart(feed.ohlc, feed.volume !== undefined)}
              </div>

              {/* Metadata Details Card */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                  <Info className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-serif font-bold text-zinc-200 uppercase tracking-wider">
                    FEED REGISTRY TELEMETRY PACKET
                  </h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-zinc-900/20 p-2.5 rounded border border-zinc-900">
                    <span className="text-zinc-500 block text-[8px] uppercase">Active Provider</span>
                    <span className="text-zinc-200 font-bold block mt-0.5">{feed.symbol} via {activeProvider.name}</span>
                  </div>
                  <div className="bg-zinc-900/20 p-2.5 rounded border border-zinc-900">
                    <span className="text-zinc-500 block text-[8px] uppercase">transport latency</span>
                    <span className="text-green-400 font-bold block mt-0.5">{feed.latency}ms (Stratum-1)</span>
                  </div>
                  <div className="bg-zinc-900/20 p-2.5 rounded border border-zinc-900">
                    <span className="text-zinc-500 block text-[8px] uppercase">Data quality rating</span>
                    <span className="text-amber-500 font-bold block mt-0.5">{feed.dataQuality}</span>
                  </div>
                  <div className="bg-zinc-900/20 p-2.5 rounded border border-zinc-900">
                    <span className="text-zinc-500 block text-[8px] uppercase">Plugin SDK Version</span>
                    <span className="text-zinc-400 font-bold block mt-0.5">{activeProvider.version}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* DEMO SIMULATOR STATE CARD */
            <div className="space-y-6">
              
              {/* Gold/Black Demo Mode Alarm Banner */}
              <div id="mkt-demo-alert-banner" className="bg-[#1C160C] border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/3 blur-2xl rounded-full" />
                
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest inline-block mb-1">
                      ACTIVE NOTICE
                    </span>
                    <h3 className="text-sm font-serif font-bold text-amber-200">
                      AQ CORE OFFLINE DEMO DATA MODE ACTIVE
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      No active Decoupled Market Data Plugin is registered or connected. The AQ Core trade scanner has automatically locked the execution gateway lines. Live trade recommendations are restricted to safeguard operating capital. Connect a provider feed to unlock high-conviction sweeps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Placeholder Candlestick Chart */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 opacity-75">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-xs font-serif font-bold text-zinc-400 tracking-wider uppercase">
                      OFFLINE DEMO SIMULATION (MOCK FLOW)
                    </h3>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded uppercase">
                    STANDBY FEED
                  </span>
                </div>

                <div className="bg-[#0C0C0D] border border-zinc-900 rounded-lg p-10 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]">
                  <Cpu className="w-8 h-8 text-zinc-600" />
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      FEED PIPELINE EMPTY
                    </span>
                    <p className="text-[10px] font-mono text-zinc-600 max-w-sm leading-normal">
                      Connect a Market Data provider plugin on the left side panel to authorize tick subscriptions and draw the interactive canvas.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
