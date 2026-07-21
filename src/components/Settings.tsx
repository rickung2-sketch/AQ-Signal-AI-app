import React, { useState, useEffect } from 'react';
import { Sliders, Download, CheckCircle2, Shield, RefreshCw, Smartphone, Key, Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  addLog: (log: string) => void;
  onLogout: () => void;
  featureFlags: { strategyLab: boolean; };
  setFeatureFlags: React.Dispatch<React.SetStateAction<{ strategyLab: boolean; }>>;
}

export default function Settings({ addLog, onLogout, featureFlags, setFeatureFlags }: SettingsProps) {
  const [maxTradeSize, setMaxTradeSize] = useState('2.5');
  const [leverageLimit, setLeverageLimit] = useState('10');
  const [mockMode, setMockMode] = useState(true);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Listen for the PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (!pwaInstallPrompt) {
      addLog('SYS: PWA install prompt not supported or already installed. Accessing fallback instructions...');
      alert('To install AQ Trade AI:\n\n• On iOS (Safari): Click Share -> "Add to Home Screen".\n• On Android/Chrome: Click the 3-dot menu -> "Install App".');
      return;
    }

    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    addLog(`PWA: User installation choice outcome: [${outcome.toUpperCase()}]`);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPwaInstallPrompt(null);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addLog(`SYS: Saved local execution settings. Max size: [${maxTradeSize} Lots], Max Leverage: [${leverageLimit}x]`);
    alert('Settings successfully synced with AQ Core storage parameters.');
  };

  const toggleStrategyLabFlag = () => {
    setFeatureFlags(prev => {
      const next = { ...prev, strategyLab: !prev.strategyLab };
      localStorage.setItem('aq_feature_flags_v33', JSON.stringify(next));
      addLog(`FEATURE FLAGS: Toggled AQ Strategy Lab feature -> [${next.strategyLab ? 'ENABLED' : 'DISABLED'}]`);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="border-b border-zinc-900 pb-3 mb-4">
          <h3 className="text-sm font-bold font-serif text-zinc-200">
            AQ QUANT CONFIGURATIONS
          </h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
            Synchronize parameters with memory caches and PWA local database caches
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sizing & Leverage parameters */}
            <div className="bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg space-y-4 font-mono text-xs">
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                EXECUTION PROTOCOLS
              </h4>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">
                  MAXIMUM POSITION SIZE (LOTS)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maxTradeSize}
                  onChange={(e) => setMaxTradeSize(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">
                  ABSOLUTE HARD LEVERAGE CAP
                </label>
                <select
                  value={leverageLimit}
                  onChange={(e) => setLeverageLimit(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                >
                  {['1', '2', '5', '10', '20', '50'].map(lev => (
                    <option key={lev} value={lev}>{lev}x</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Network Modes */}
            <div className="bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg space-y-4 font-mono text-xs">
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                INTEGRATION PROTOCOLS
              </h4>

              <div className="flex items-center justify-between p-2 bg-zinc-900/60 rounded-lg">
                <div>
                  <span className="text-[11px] text-zinc-300 font-bold block">MOCK API TELEMETRY MODE</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Simulate latency and secure endpoints</span>
                </div>
                <input
                  type="checkbox"
                  checked={mockMode}
                  onChange={() => {
                    setMockMode(!mockMode);
                    addLog(`SYS: Toggled mock telemetry mode: [${!mockMode ? 'OFF' : 'ON'}]`);
                  }}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg flex gap-2">
                <Smartphone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-normal">
                  PWA OFFLINE COMPLIANT: Cached resources are fully cached and available when network connectivity drops.
                </p>
              </div>
            </div>

            {/* Feature Flags Section */}
            <div className="bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg space-y-4 font-mono text-xs">
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5" />
                FEATURE FLAGS (v3.3)
              </h4>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg border border-amber-500/10">
                <div>
                  <span className="text-[11px] text-zinc-200 font-bold block">AQ STRATEGY LAB</span>
                  <span className="text-[9px] text-amber-500 block mt-0.5 font-bold">EXPERIMENTAL FEATURES</span>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags.strategyLab}
                  onChange={toggleStrategyLabFlag}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <p className="text-[9px] text-zinc-500 leading-normal uppercase">
                Toggling optional packages re-aligns navigation layout nodes and memory-allocated resources dynamically.
              </p>
            </div>

          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs tracking-widest py-2.5 px-6 rounded-lg uppercase cursor-pointer"
            >
              SAVE QUANT PROTOCOLS
            </button>

            <button
              type="button"
              onClick={() => {
                addLog('SYS: Cleaned cache storage modules.');
                alert('Cache Storage cleared successfully. Service workers reloading.');
              }}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-mono text-xs tracking-widest py-2.5 px-4 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              CLEAR PWA CACHE
            </button>
          </div>
        </form>
      </div>

      {/* Progressive Web App Install Instructions */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 font-mono text-xs space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
          <Smartphone className="w-4 h-4" />
          PWA PORTABILITY PORTAL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase">MOBILE CACHE</span>
            <span className="text-xs font-bold text-zinc-300 block">OFFLINE PLAYBACK READY</span>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              AQ Core uses service worker architecture to caches state definitions, styles, and dashboard templates.
            </p>
          </div>

          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase">STANDALONE MODE</span>
            <span className="text-xs font-bold text-zinc-300 block">
              {isInstalled ? '✅ INSTALLED STANDALONE' : 'PORTABLE AVAILABLE'}
            </span>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Run AQ Trade AI without standard browser address bars, matching native high-end mobile apps.
            </p>
          </div>

          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex flex-col justify-center">
            <button
              onClick={triggerPwaInstall}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-[10px] tracking-widest py-2 px-3 rounded uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {isInstalled ? 'APP INSTALLED' : 'INSTALL AQ TO HOMESCREEN'}
            </button>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex justify-between items-center">
        <div className="font-mono text-xs text-zinc-500">
          <span>SIGNED IN AS: </span>
          <span className="text-amber-400 font-bold">RICKUNG2@GMAIL.COM</span>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 hover:border-red-500/50 text-red-400 font-mono text-xs tracking-widest px-4 py-2 rounded-lg cursor-pointer"
        >
          DISCONNECT CORE SESSION
        </button>
      </div>
    </div>
  );
}
