import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react';

interface RadarAsset {
  symbol: string;
  name: string;
  regime: 'BREAKOUT' | 'SQUEEZE' | 'STABLE' | 'DIVERGENCE';
  angle: number; // degrees for radar positioning
  distance: number; // radius distance from center
  price: string;
  change: string;
  trend: 'UP' | 'DOWN';
  conviction: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TradeRadarProps {
  addLog: (log: string) => void;
  marketDataConnected?: boolean;
}

export default function TradeRadar({ addLog, marketDataConnected = false }: TradeRadarProps) {
  const [selectedAsset, setSelectedAsset] = useState<RadarAsset | null>(null);
  const [sweepAngle, setSweepAngle] = useState(0);

  const assets: RadarAsset[] = [
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', regime: 'BREAKOUT', angle: 45, distance: 35, price: '98,240.00', change: '+4.52%', trend: 'UP', conviction: 'HIGH' },
    { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', regime: 'SQUEEZE', angle: 135, distance: 75, price: '3,120.50', change: '-1.22%', trend: 'DOWN', conviction: 'MEDIUM' },
    { symbol: 'SOLUSD', name: 'Solana / US Dollar', regime: 'BREAKOUT', angle: 280, distance: 50, price: '184.25', change: '+8.14%', trend: 'UP', conviction: 'HIGH' },
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', regime: 'STABLE', angle: 210, distance: 60, price: '2,425.80', change: '+0.12%', trend: 'UP', conviction: 'MEDIUM' },
    { symbol: 'NVDA', name: 'Nvidia Corp Common', regime: 'DIVERGENCE', angle: 320, distance: 85, price: '127.40', change: '-3.85%', trend: 'DOWN', conviction: 'LOW' }
  ];

  useEffect(() => {
    // Select first asset initially
    if (!selectedAsset) {
      setSelectedAsset(assets[0]);
    }

    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + 3) % 360);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleSelectAsset = (asset: RadarAsset) => {
    if (!marketDataConnected) {
      addLog(`RADAR NOTICE: Asset analysis for $${asset.symbol} is running on OFFLINE simulation.`);
      return;
    }
    setSelectedAsset(asset);
    addLog(`RADAR: Locked target scanning coordinates onto $${asset.symbol} (${asset.regime} setup)`);
  };

  return (
    <div className="space-y-6">
      
      {/* Demo Data Mode Warning Banner */}
      {!marketDataConnected && (
        <div id="radar-demo-warning-banner" className="bg-[#1C160C] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
              <Compass className="w-4 h-4" />
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-serif font-bold text-amber-200">DEMO DATA MODE ACTIVE</h4>
              <p className="text-[10px] font-mono text-zinc-400 leading-normal">
                Live trade recommendations are locked. Connect an active Market Data Plugin in the Market Data Manager to enable live coordinate sweeps.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 px-2 py-1 rounded uppercase tracking-wider font-bold">
            RESTRICTED FEED
          </span>
        </div>
      )}

      {/* Overview Block */}
      <div className={`bg-zinc-950 border border-zinc-900 rounded-xl p-5 relative overflow-hidden ${!marketDataConnected ? 'opacity-65' : ''}`}>
        
        {/* Transparent Lock Overlay */}
        {!marketDataConnected && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-full text-amber-500 mb-2 shadow-lg">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">COORDINATES LOCKED IN DEMO MODE</h4>
            <p className="text-[10px] font-mono text-zinc-500 max-w-md mt-1 leading-normal">
              Continuous scan sweeps are using static placeholder data. Re-route your telemetry lines to a premium Market Data Plugin to authorize real-time entry recommendations.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              AQ TRADE SCANNING RADAR
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Live coordinates of premium algorithmic setups across digital asset classes
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-1 rounded">
            <Compass className="w-3 h-3 animate-spin" />
            SWEEPING RANGE Active
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Radar Interactive Display (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
            <div className="relative w-64 h-64 bg-[#070708] border border-amber-500/10 rounded-full flex items-center justify-center shadow-[inset_0_0_20px_rgba(212,175,55,0.02)] overflow-hidden">
              
              {/* Concentric grid rings */}
              <div className="absolute w-4/5 h-4/5 border border-zinc-900/60 rounded-full" />
              <div className="absolute w-3/5 h-3/5 border border-zinc-900/40 rounded-full" />
              <div className="absolute w-2/5 h-2/5 border border-zinc-900/20 rounded-full" />
              
              {/* Crosshair axis */}
              <div className="absolute w-full h-[1px] bg-zinc-900/60" />
              <div className="absolute h-full w-[1px] bg-zinc-900/60" />

              {/* Glowing Radar Sweep line */}
              <div 
                className="absolute top-1/2 left-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent to-amber-500 origin-left pointer-events-none"
                style={{ transform: `rotate(${sweepAngle}deg)` }}
              />

              {/* Render Assets inside Radar */}
              {assets.map((asset) => {
                // Convert polar to cartesian
                const rad = (asset.angle * Math.PI) / 180;
                // Scale distance parameter (distance 0-100 mapped to center-to-edge radius 110px)
                const radius = (asset.distance / 100) * 110;
                const x = radius * Math.cos(rad);
                const y = radius * Math.sin(rad);

                const isSelected = selectedAsset?.symbol === asset.symbol;

                return (
                  <button
                    key={asset.symbol}
                    onClick={() => handleSelectAsset(asset)}
                    className="absolute group z-10 transition-transform duration-300 transform hover:scale-125 focus:outline-none"
                    style={{
                      left: `calc(50% + ${x}px - 6px)`,
                      top: `calc(50% + ${y}px - 6px)`
                    }}
                  >
                    {/* Ring glow */}
                    <span className={`absolute -inset-1.5 rounded-full animate-ping duration-1000 ${
                      isSelected ? 'bg-amber-500/40' : 'bg-amber-500/10 group-hover:bg-amber-500/20'
                    }`} />
                    {/* Pin dot */}
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      isSelected 
                        ? 'bg-amber-400 border-black' 
                        : 'bg-zinc-950 border-amber-500/60 group-hover:border-amber-400'
                    }`} />
                    {/* Symbol Tag */}
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-950/90 border border-zinc-900 text-[8px] font-mono text-zinc-400 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                      ${asset.symbol}
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-2 text-[9px] font-mono text-zinc-600 tracking-wider">
                AQ SCANNED FIELD
              </div>
            </div>
          </div>

          {/* Targets details layout (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              ASSET RADAR PROTOCOLS
            </h4>

            {/* List block */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.symbol === asset.symbol;
                return (
                  <button
                    key={asset.symbol}
                    onClick={() => handleSelectAsset(asset)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/5 border-amber-500/30' 
                        : 'bg-zinc-900/30 border-zinc-900/60 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        isSelected ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}>
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono text-zinc-100">
                            ${asset.symbol}
                          </span>
                          <span className={`text-[9px] font-mono px-1 rounded-sm ${
                            asset.regime === 'BREAKOUT' 
                              ? 'bg-green-950/40 text-green-400 border border-green-900/40' 
                              : asset.regime === 'SQUEEZE' 
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                                : 'bg-zinc-900 text-zinc-400'
                          }`}>
                            {asset.regime}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-serif block mt-0.5">
                          {asset.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-zinc-200">${asset.price}</span>
                      <div className={`text-[10px] flex items-center justify-end gap-0.5 ${
                        asset.trend === 'UP' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.trend === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {asset.change}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Ticker Deep Scan View panel */}
      {selectedAsset && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border-r border-zinc-900/80 pr-2 space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">SELECTED SCAN PROFILE</span>
            <h4 className="text-sm font-bold font-serif text-zinc-200">{selectedAsset.name}</h4>
            <span className="text-xs font-mono text-amber-500 font-bold">${selectedAsset.symbol}</span>
          </div>

          <div className="border-r border-zinc-900/80 pr-2 space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">QUANT REGIME MODEL</span>
            <p className="text-xs text-zinc-300 font-mono">
              <span className="text-amber-400 font-bold">{selectedAsset.regime}</span> setup detected.
            </p>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              {selectedAsset.regime === 'BREAKOUT' && 'Sustained momentum crossing historical volume shelf nodes.'}
              {selectedAsset.regime === 'SQUEEZE' && 'Compressed volatility band, explosive resolution expected shortly.'}
              {selectedAsset.regime === 'STABLE' && 'Normalized swing behavior inside macro horizontal parameters.'}
              {selectedAsset.regime === 'DIVERGENCE' && 'RSI momentum diverges from price, possible mean reversion.'}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">RECOMMENDED CONVICTION RISK</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedAsset.conviction === 'HIGH' 
                  ? 'bg-green-950 text-green-400 border border-green-900' 
                  : selectedAsset.conviction === 'MEDIUM' 
                    ? 'bg-amber-950 text-amber-400 border border-amber-900' 
                    : 'bg-red-950 text-red-400 border border-red-900'
              }`}>
                {selectedAsset.conviction} CONVICTION
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Target confidence</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              AI Guardian considers this layout <span className="text-amber-400 font-bold">READY</span> for trade entry consideration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
