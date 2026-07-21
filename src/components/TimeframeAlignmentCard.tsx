import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, AlertCircle, Clock, Percent, 
  Layers, Compass, Flame, Activity, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { TimeframeAlignmentState, TimeframeData } from '../types/multiTimeframe';

interface TimeframeAlignmentCardProps {
  alignmentState: TimeframeAlignmentState;
  onRefresh?: () => void;
}

export default function TimeframeAlignmentCard({ alignmentState, onRefresh }: TimeframeAlignmentCardProps) {
  const [expandedTf, setExpandedTf] = useState<'4H' | '1H' | '15M' | null>('4H');

  const { overallAlignment, percentageAlignment, timeframes } = alignmentState;

  // Custom colors and indicators depending on overall alignment
  const getThemeConfig = () => {
    switch (overallAlignment) {
      case 'Bullish Alignment':
        return {
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.05)] border-emerald-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-emerald-950/10',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          icon: <TrendingUp className="w-5 h-5 text-emerald-400 animate-bounce" />,
          desc: 'Primary timeframes have synchronized into an upward trend bias. Favorable buying conditions.'
        };
      case 'Bearish Alignment':
        return {
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.05)] border-red-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/10',
          text: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
          badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
          icon: <TrendingDown className="w-5 h-5 text-red-400 animate-bounce" />,
          desc: 'Primary timeframes have synchronized into a downward trend bias. High risk of sell-side pressure.'
        };
      default:
        return {
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.05)] border-amber-500/15 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/5',
          text: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
          desc: 'Conflict detected between high and low timeframe structures. Standard range rules apply.'
        };
    }
  };

  const theme = getThemeConfig();

  const toggleExpand = (tf: '4H' | '1H' | '15M') => {
    setExpandedTf(expandedTf === tf ? null : tf);
  };

  return (
    <div id="timeframe-alignment-card" className={`border rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${theme.glow}`}>
      
      {/* Decorative pulse indicator background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.01] rounded-full blur-2xl pointer-events-none" />

      {/* Header section with live stats */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
              UPGRADE v2.1
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              COGNITIVE ALIGNMENT SENSORS
            </span>
          </div>
          <h3 className="text-sm font-bold font-serif text-zinc-200 flex items-center gap-2">
            TIMEFRAME CONFORMANCE ALIGNMENT
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Force alignment re-computation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Big Conformance Alignment Alert Block */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl">
        
        {/* Metric gauge (4 cols) */}
        <div className="md:col-span-5 flex items-center gap-4 border-r border-zinc-900/80 pr-4">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
            {theme.icon}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">ALIGNMENT VECTOR</span>
            <h4 className={`text-sm font-bold font-serif ${theme.text}`}>
              {overallAlignment}
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Synchronicity:</span>
              <span className={`text-[11px] font-bold font-mono ${theme.text}`}>{percentageAlignment}%</span>
            </div>
          </div>
        </div>

        {/* Sync Status description and dynamic progress bar (7 cols) */}
        <div className="md:col-span-7 space-y-2">
          <p className="text-[11px] font-mono text-zinc-400 leading-normal">
            {theme.desc}
          </p>
          
          {/* Progress bar representer */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
              <span>CONFORMANCE RATIO</span>
              <span>{percentageAlignment}% SYNCED</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-850">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAlignment === 'Bullish Alignment' ? 'bg-emerald-500' :
                  overallAlignment === 'Bearish Alignment' ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${percentageAlignment}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Timeframes Deep-Dive Drawer list */}
      <div className="mt-5 space-y-3">
        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block border-b border-zinc-900 pb-1.5">
          TIMEFRAME SPECIFICATIONS (4H, 1H, 15M)
        </span>

        {Object.values(timeframes).map((tf: TimeframeData) => {
          const isTfExpanded = expandedTf === tf.timeframe;
          const isBullish = tf.trend === 'Bullish';
          const isBearish = tf.trend === 'Bearish';
          
          // Get specific color profiles for each sub-row
          const tfTextColor = isBullish ? 'text-emerald-400' : isBearish ? 'text-red-400' : 'text-amber-400';
          const tfBgColor = isBullish ? 'bg-emerald-500/5 border-emerald-500/10' : isBearish ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10';

          return (
            <div 
              key={tf.timeframe}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isTfExpanded ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-950/10 border-zinc-900/60 hover:border-zinc-850'
              }`}
            >
              
              {/* Row Header Trigger */}
              <div 
                onClick={() => toggleExpand(tf.timeframe)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-bold font-mono text-zinc-100">{tf.timeframe} Interval</span>
                  </div>
                  
                  {/* Quick indicators status pills */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${tfTextColor} ${tfBgColor}`}>
                      Trend: {tf.trend}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase hidden sm:inline-block ${
                      tf.marketStructure === 'Bullish' ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' :
                      tf.marketStructure === 'Bearish' ? 'text-red-400 bg-red-500/5 border border-red-500/10' :
                      'text-amber-400 bg-amber-500/5 border border-amber-500/10'
                    }`}>
                      Structure: {tf.marketStructure}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">CONFIDENCE</span>
                    <span className="text-xs font-bold font-mono text-zinc-200">{tf.confidenceScore}%</span>
                  </div>
                  {isTfExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </div>

              {/* Expansion Panel content */}
              {isTfExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-900/60 bg-zinc-950/60 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                  
                  {/* Block 1: Trend Indicators */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-500" />
                      EMAs Alignment
                    </span>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">EMA 50:</span>
                        <span className="text-zinc-200">${tf.ema50.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">EMA 200:</span>
                        <span className="text-zinc-200">${tf.ema200.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-0.5 border-t border-zinc-900/60 text-[9px]">
                        <span className="text-zinc-500 font-bold">STATE:</span>
                        <span className={tf.ema50 > tf.ema200 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {tf.ema50 > tf.ema200 ? 'GOLDEN CROSS' : 'DEATH CROSS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Support / Resistance Channels */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                      <Compass className="w-3 h-3 text-amber-500" />
                      S&R Boundaries
                    </span>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Support:</span>
                        <span className="text-emerald-400 font-semibold">${tf.support.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Resistance:</span>
                        <span className="text-red-400 font-semibold">${tf.resistance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-0.5 border-t border-zinc-900/60 text-[9px]">
                        <span className="text-zinc-500">SPREAD:</span>
                        <span className="text-zinc-400">${(tf.resistance - tf.support).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Volatility Metrics */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      ATR Volatility
                    </span>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ATR Range:</span>
                        <span className="text-zinc-200 font-bold">${tf.atr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Percent ATR:</span>
                        <span className="text-zinc-400">{((tf.atr / tf.ema50) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between pt-0.5 border-t border-zinc-900/60 text-[9px]">
                        <span className="text-zinc-500 font-bold">STATE:</span>
                        <span className="text-amber-500">ACTIVE FLUID</span>
                      </div>
                    </div>
                  </div>

                  {/* Block 4: Momentum Oscillators */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-500" />
                      RSI Momentum
                    </span>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">RSI (14):</span>
                        <span className={`font-bold ${
                          tf.rsi > 70 ? 'text-red-400 font-black' :
                          tf.rsi < 30 ? 'text-emerald-400 font-black' :
                          'text-zinc-200'
                        }`}>{tf.rsi}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1 mt-0.5">
                        <div 
                          className={`h-full rounded-full ${
                            tf.rsi > 70 ? 'bg-red-500' :
                            tf.rsi < 30 ? 'bg-emerald-500' :
                            'bg-amber-500'
                          }`}
                          style={{ width: `${tf.rsi}%` }}
                        />
                      </div>
                      <div className="flex justify-between pt-0.5 border-t border-zinc-900/60 text-[9px]">
                        <span className="text-zinc-500 font-bold">BIAS:</span>
                        <span className={`${
                          tf.rsi > 70 ? 'text-red-400' :
                          tf.rsi < 30 ? 'text-emerald-400' :
                          'text-zinc-400'
                        }`}>
                          {tf.rsi > 70 ? 'OVERBOUGHT' : tf.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL ZONE'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
