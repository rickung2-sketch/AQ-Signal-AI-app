import React, { useState, useEffect } from 'react';
import { Activity, Flame, Droplets, TrendingUp, Info } from 'lucide-react';
import { MarketMetrics } from '../types/dashboard';

interface MarketHealthProps {
  metrics: MarketMetrics;
  onMetricsChange: (newMetrics: MarketMetrics) => void;
  addLog: (log: string) => void;
}

export default function MarketHealth({ metrics, onMetricsChange, addLog }: MarketHealthProps) {
  const [selectedPreset, setSelectedPreset] = useState<'Standard' | 'Panic' | 'Bull' | 'Choppy'>('Standard');

  const presets = {
    Standard: { volatility: 42, liquidity: 75, sentiment: 58, volumeTrend: 'ASCENDING' as const, healthScore: 68 },
    Panic: { volatility: 91, liquidity: 15, sentiment: 11, volumeTrend: 'ASCENDING' as const, healthScore: 19 },
    Bull: { volatility: 25, liquidity: 88, sentiment: 84, volumeTrend: 'ASCENDING' as const, healthScore: 89 },
    Choppy: { volatility: 15, liquidity: 40, sentiment: 49, volumeTrend: 'FLAT' as const, healthScore: 45 },
  };

  const handlePresetSelect = (presetKey: 'Standard' | 'Panic' | 'Bull' | 'Choppy') => {
    setSelectedPreset(presetKey);
    const chosen = presets[presetKey];
    onMetricsChange(chosen);
    addLog(`SYS: Calibrated Market Health metrics to predefined state: [${presetKey.toUpperCase()}]`);
  };

  const calculateAggregateScore = (v: number, l: number, s: number) => {
    // High volatility drops health slightly if liquidity is low, high liquidity boosts health, high sentiment boosts health
    const volPenalty = v > 70 ? (v - 70) * 0.5 : 0;
    const base = (l * 0.4) + (s * 0.4) + ((100 - v) * 0.2);
    return Math.max(0, Math.min(100, Math.round(base - volPenalty)));
  };

  const handleSliderChange = (key: 'volatility' | 'liquidity' | 'sentiment', val: number) => {
    const updated = { ...metrics, [key]: val };
    updated.healthScore = calculateAggregateScore(updated.volatility, updated.liquidity, updated.sentiment);
    onMetricsChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Configurer */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              MARKET HEALTH SENSORS
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Simulate dynamic market regimes to test AQ decision paths
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['Standard', 'Panic', 'Bull', 'Choppy'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all cursor-pointer ${
                  selectedPreset === preset
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Indicator Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volatility */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                VOLATILITY (VIX)
              </span>
              <span className={`text-xs font-mono font-bold ${metrics.volatility > 70 ? 'text-red-400' : 'text-amber-400'}`}>
                {metrics.volatility}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={metrics.volatility}
              onChange={(e) => handleSliderChange('volatility', parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>QUIET</span>
              <span>STABLE</span>
              <span>EXTREME</span>
            </div>
          </div>

          {/* Liquidity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-amber-500" />
                ORDER DEPTH LIQUIDITY
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {metrics.liquidity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={metrics.liquidity}
              onChange={(e) => handleSliderChange('liquidity', parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>ILLIQUID</span>
              <span>BALANCED</span>
              <span>DEEP</span>
            </div>
          </div>

          {/* Sentiment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                DIVERGENT SENTIMENT
              </span>
              <span className={`text-xs font-mono font-bold ${metrics.sentiment > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.sentiment}% {metrics.sentiment > 50 ? 'BULL' : 'BEAR'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={metrics.sentiment}
              onChange={(e) => handleSliderChange('sentiment', parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>PANIC BEAR</span>
              <span>NEUTRAL</span>
              <span>GREED BULL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview & Metrics breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Health Factor Dial card (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
            AGGREGATE MARKET HEALTH COEFFICIENT
          </span>

          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-zinc-900"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`transition-all duration-300 ${
                  metrics.healthScore < 30 ? 'stroke-red-500' : metrics.healthScore < 60 ? 'stroke-amber-600' : 'stroke-amber-400'
                }`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={263.8}
                strokeDashoffset={263.8 - (263.8 * metrics.healthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold font-mono text-zinc-100">
                {metrics.healthScore}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                AQ RATING
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <h4 className="text-sm font-bold font-serif text-zinc-300">
              {metrics.healthScore < 35 
                ? '⚠️ REGIME THREAT LEVEL HIGH' 
                : metrics.healthScore < 65 
                  ? '⚖️ EQUILIBRIUM REGIME' 
                  : '⭐ GOLDEN TRADING STATE'}
            </h4>
            <p className="text-[10px] font-mono text-zinc-500 max-w-xs leading-relaxed">
              {metrics.healthScore < 35 
                ? 'High systemic volatility and thin order book depth. Absolute capital safety protocols advised.' 
                : metrics.healthScore < 65 
                  ? 'Normalized environment. Deploy focused swing strategies matching the micro-trend.' 
                  : 'Exceptional liquidity with healthy trend volume. Optimal window for larger sizing templates.'}
            </p>
          </div>
        </div>

        {/* Informative Indicators breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            REGIME CLASSIFICATION DETAILS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0D0D0E] border border-zinc-900 p-4 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                VOLUME VELOCITY STATE
              </span>
              <div className="text-sm font-serif font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                CONVEX ASCENDING VOLUME
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                Volume spikes verify breakout conviction across top spot clusters.
              </p>
            </div>

            <div className="bg-[#0D0D0E] border border-zinc-900 p-4 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                DEVIATION SPREAD FACTOR
              </span>
              <div className="text-sm font-serif font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                STABLE BASIS ALIGNMENT
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                No major basis arbitrage divergence detected between top order desks.
              </p>
            </div>

            <div className="bg-[#0D0D0E] border border-zinc-900 p-4 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                PREMIUM SCALPING CORRELATION
              </span>
              <div className="text-sm font-serif font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                0.94 SYNC COEFFICIENT
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                Index assets strongly support asset correlations, reducing noise factor.
              </p>
            </div>

            <div className="bg-[#0D0D0E] border border-zinc-900 p-4 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                SYS INTEGRITY BUFFER
              </span>
              <div className="text-sm font-serif font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                128MS API HEARTBEAT
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                Ultra-low simulated frame jitter confirms responsive ledger feeds.
              </p>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex gap-2.5">
            <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              <span className="text-amber-400 font-bold">AQ Core Notice</span>: Changes to these sliders will dynamically update calculations in your <span className="text-amber-400 font-bold">Readiness Meter</span> and trigger protective AI Guardian audits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
