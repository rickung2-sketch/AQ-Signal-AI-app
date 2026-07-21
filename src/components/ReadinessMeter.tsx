import React, { useState } from 'react';
import { Sliders, CheckCircle2, ShieldAlert, Award, Activity } from 'lucide-react';

interface ReadinessMeterProps {
  marketHealthScore: number;
  checklistReadinessScore: number;
  addLog: (log: string) => void;
}

export default function ReadinessMeter({ marketHealthScore, checklistReadinessScore, addLog }: ReadinessMeterProps) {
  const [mentalBalance, setMentalBalance] = useState(85);
  const [leverageCap, setLeverageCap] = useState(10); // user configured slider
  const [isSyncing, setIsSyncing] = useState(false);

  // Combine factors to determine overall trading readiness percentage
  // 35% Checklist, 35% Market Health, 30% Mental/Emotional state
  const aggregateReadiness = Math.round(
    (checklistReadinessScore * 0.35) +
    (marketHealthScore * 0.35) +
    (mentalBalance * 0.30)
  );

  const triggerResync = () => {
    setIsSyncing(true);
    addLog('SYS: Calibrating bio-metric and mechanical readiness levels with AQ Core...');
    setTimeout(() => {
      setIsSyncing(false);
      addLog(`SYS: Calibration finalized. Overall Readiness Factor is ${aggregateReadiness}%`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              INTEGRAL READINESS MONITOR
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Dual-source cognitive alignment and market confluence tracking
            </p>
          </div>
          <button
            onClick={triggerResync}
            disabled={isSyncing}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs tracking-widest px-4 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? 'SYNCING...' : 'FORCE CALIBRATION'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Circular gauge showing aggregate (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-zinc-900"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-amber-400 transition-all duration-500"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={263.8}
                  strokeDashoffset={263.8 - (263.8 * aggregateReadiness) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-bold font-mono text-zinc-100">{aggregateReadiness}%</span>
                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">READINESS RATIO</p>
              </div>
            </div>

            <div className="text-center mt-3">
              <span className={`text-xs font-mono font-bold tracking-widest ${
                aggregateReadiness >= 75 ? 'text-green-400' : 'text-amber-500'
              }`}>
                {aggregateReadiness >= 85 ? '👑 ABSOLUTE CONFLUENCE' : aggregateReadiness >= 70 ? '🟢 SAFE OPERATION' : '⚠️ HIGH SYSTEMIC BIAS'}
              </span>
            </div>
          </div>

          {/* Core factors sliders and numbers (7 cols) */}
          <div className="md:col-span-7 space-y-4 font-mono text-xs">
            
            {/* Checklist Score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-zinc-400 uppercase tracking-widest text-[10px]">
                <span>1. Checklist Protocol Sync (35% weight)</span>
                <span className="text-amber-400">{checklistReadinessScore}%</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${checklistReadinessScore}%` }}
                />
              </div>
            </div>

            {/* Market regime score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-zinc-400 uppercase tracking-widest text-[10px]">
                <span>2. Market Regime Confluence (35% weight)</span>
                <span className="text-amber-400">{marketHealthScore}%</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${marketHealthScore}%` }}
                />
              </div>
            </div>

            {/* Mental Focus Slider */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex justify-between text-zinc-400 uppercase tracking-widest text-[10px]">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  3. Mental & Emotional Balance (30% weight)
                </span>
                <span className="text-amber-400">{mentalBalance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={mentalBalance}
                onChange={(e) => {
                  setMentalBalance(parseInt(e.target.value));
                  if (parseInt(e.target.value) < 50) {
                    addLog('WARN: AI Guardian flagged low mental focus score.');
                  }
                }}
                className="w-full accent-amber-500 h-1 bg-zinc-900 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
                <span>Fatigued / Emotional</span>
                <span>Highly Focused</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Advisory Insight panel */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-serif text-zinc-300">PROTOCOL ADVISORY</h4>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              {aggregateReadiness >= 80 
                ? 'Your parameters align beautifully. Optimal context for high-conviction trades.' 
                : 'AQ Core recommends pausing execution or downscaling position sizing models.'}
            </p>
          </div>
        </div>

        <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-serif text-zinc-300">LEVERAGE MULTIPLIER</h4>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              Recommended Leverage Cap: <span className="text-amber-400 font-bold">{Math.round(aggregateReadiness / 10)}x</span>
              <br />
              (Dynamically scaled to your combined readiness parameters)
            </p>
          </div>
        </div>

        <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-serif text-zinc-300">RISK GUARDIAN</h4>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              System is locked in <span className="text-amber-400 font-bold">{aggregateReadiness >= 70 ? 'PREMIUM' : 'SAFETY CONSERVATIVE'}</span> mode. Over-trading protection is fully armed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
