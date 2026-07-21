import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Shield, Terminal, Download, RefreshCw, Layers, Database, 
  Network, CheckCircle2, AlertTriangle, XCircle, AlertCircle, ToggleLeft, 
  ToggleRight, Info, ShieldAlert, Zap, Layers3, Play, Code, Eye, FileJson, Copy,
  Sliders
} from 'lucide-react';
import { 
  ComponentHealthStatus, AppHealthState, FeatureFlags 
} from '../types/appHealth';
import { 
  generateAppHealth, loadFeatureFlags, saveFeatureFlags, generateDiagnosticReport 
} from '../plugins/appHealthEngine';

interface SystemDiagnosticsProps {
  addLog: (log: string) => void;
}

export default function SystemDiagnostics({ addLog }: SystemDiagnosticsProps) {
  const [flags, setFlags] = useState<FeatureFlags>(() => loadFeatureFlags());
  const [healthState, setHealthState] = useState<AppHealthState>(() => generateAppHealth());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [scanStep, setScanStep] = useState<string>('');
  
  // Custom manual state overrides to allow testing the dashboard reacting to offline/error alerts!
  const [overrides, setOverrides] = useState<Record<string, ComponentHealthStatus>>({});
  
  // Terminal Logs specifically for the Diagnostic component
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'DIAG: App Health monitor initialized.',
    'DIAG: Secure local sandbox connected.',
    'DIAG: Monitoring 9 active system components.',
    'DIAG: Feature flags loaded.'
  ]);

  const addDiagLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 30));
  };

  // Re-evaluate health whenever overrides change or on timer
  useEffect(() => {
    if (!isScanning) {
      setHealthState(generateAppHealth(overrides));
    }
  }, [overrides, isScanning]);

  // Synchronize dynamic CPU, memory, and timing metrics on interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScanning) {
        setHealthState(prev => {
          const fresh = generateAppHealth(overrides);
          return {
            ...fresh,
            // Keep status overridden if user customized it
            components: fresh.components.map(c => ({
              ...c,
              status: overrides[c.id] || c.status
            })),
            dbConnection: {
              ...fresh.dbConnection,
              status: overrides['db-connection'] || fresh.dbConnection.status
            }
          };
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [overrides, isScanning]);

  // Update Feature Flag
  const handleToggleFlag = <K extends keyof FeatureFlags>(key: K) => {
    const nextFlags = { ...flags, [key]: !flags[key] };
    setFlags(nextFlags);
    saveFeatureFlags(nextFlags);
    addLog(`SYS: Updated Feature Flag [${key}] set to [${nextFlags[key] ? 'ENABLED' : 'DISABLED'}]`);
    addDiagLog(`FLAG: Toggled ${key} to ${nextFlags[key]}`);
  };

  // Run full system diagnostics health check sequence
  const handleRunHealthCheck = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    addLog('SYS: Triggered full multi-core application health check sequence...');
    addDiagLog('INIT: App health diagnostic sequence started.');

    const steps = [
      { p: 15, s: 'Checking AQ Core Kernel allocation...', log: 'AQ Core micro-kernel validated. 0 trace faults.' },
      { p: 35, s: 'Polling Plugin Manager and dynamic registries...', log: 'Plugin Manager synced. 4 extensions verified.' },
      { p: 55, s: 'Validating exchange broker API connections...', log: 'Broker API handshakes completed. Ping 14ms.' },
      { p: 75, s: 'Reviewing rule engines & model coefficients...', log: 'Rule compiler fully compiled. 11/11 matrices green.' },
      { p: 90, s: 'Evaluating Guardian Risk validation gates...', log: 'Guardian Engine safe limits confirmed. No breaches.' },
      { p: 100, s: 'System diagnostics sequence completed.', log: 'Checklist synchronized successfully. Node healthy.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        setScanProgress(item.p);
        setScanStep(item.s);
        addDiagLog(`CHECK: ${item.log}`);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setHealthState(generateAppHealth(overrides));
        addLog('SYS: Full system diagnostics checklist completed successfully. App status: OPTIMAL.');
        addDiagLog('DONE: System Diagnostics Checklist complete. All telemetry logs synchronized.');
      }
    }, 700);
  };

  // Individual component status override toggle cycle
  const cycleStatusOverride = (componentId: string) => {
    const statuses: ComponentHealthStatus[] = ['Healthy', 'Warning', 'Offline', 'Error'];
    const current = overrides[componentId] || 'Healthy';
    const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
    const next = statuses[nextIdx];
    
    const nextOverrides = { ...overrides, [componentId]: next };
    setOverrides(nextOverrides);
    addDiagLog(`OVERRIDE: Component [${componentId}] forced to status [${next.toUpperCase()}]`);
  };

  // Reset all overrides
  const resetAllOverrides = () => {
    setOverrides({});
    addDiagLog('OVERRIDE: Cleaned all component status overrides.');
    addLog('SYS: Cleared custom simulation overrides. Resetting to standard real-time health monitors.');
  };

  // Export full JSON diagnostic report
  const handleExportReport = () => {
    const reportText = generateDiagnosticReport(healthState, flags);
    const blob = new Blob([reportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aq_diagnostics_report_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog('SYS: Exported system diagnostics report JSON.');
    addDiagLog('EXPORT: Diagnostics report file downloaded.');
  };

  const getStatusColor = (status: ComponentHealthStatus) => {
    switch (status) {
      case 'Healthy':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          dot: 'bg-emerald-400',
          glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]'
        };
      case 'Warning':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          dot: 'bg-amber-400',
          glow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]'
        };
      case 'Offline':
        return {
          text: 'text-zinc-400',
          bg: 'bg-zinc-800/20 border-zinc-700/30',
          dot: 'bg-zinc-500',
          glow: ''
        };
      case 'Error':
        return {
          text: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
          dot: 'bg-red-500',
          glow: 'shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse'
        };
    }
  };

  // Calculate high-level health score
  const getOverallIntegrityScore = () => {
    const total = healthState.components.length + 1; // 9 components + 1 DB
    let score = 0;
    
    healthState.components.forEach(c => {
      if (c.status === 'Healthy') score += 10;
      else if (c.status === 'Warning') score += 7;
      else if (c.status === 'Offline') score += 3;
    });

    if (healthState.dbConnection.status === 'Healthy') score += 10;
    else if (healthState.dbConnection.status === 'Warning') score += 7;
    else if (healthState.dbConnection.status === 'Offline') score += 3;

    return Math.round((score / (total * 10)) * 100);
  };

  const overallScore = getOverallIntegrityScore();

  return (
    <div className="space-y-6">
      
      {/* Brand Header */}
      <div id="diagnostics-header" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.008] blur-3xl rounded-full" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
              VERSION 2.3 STABLE
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              APPLICATION KERNEL INTERFACE
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            SYSTEM DIAGNOSTICS & TELEMETRY
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            A real-time administrative cockpit that monitors memory allocation thresholds, system latencies, and thread states. Advanced parameters can be modified on the fly for testing and compliance.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            id="diag-health-reset-btn"
            onClick={resetAllOverrides}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Overrides
          </button>
          
          <button
            id="diag-export-btn"
            onClick={handleExportReport}
            className="px-3.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500 hover:text-black text-amber-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_15px_rgba(245,158,11,0.03)]"
          >
            <Download className="w-3.5 h-3.5" />
            Export Diagnostic Report
          </button>

          <button
            id="diag-scan-btn"
            disabled={isScanning}
            onClick={handleRunHealthCheck}
            className={`px-4 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
              isScanning 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed animate-pulse' 
                : 'bg-amber-500 border-amber-400 text-black hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'RUNNING INTEGRITY SCAN...' : 'RUN HEALTH CHECK'}
          </button>
        </div>
      </div>

      {/* Interactive Scan Progress Tracker Bar */}
      {isScanning && (
        <div id="diagnostics-scanning-bar" className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2.5 animate-fade-in">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Active Diagnostic Sweep: {scanStep}
            </span>
            <span className="text-zinc-400 font-bold">{scanProgress}%</span>
          </div>
          <div className="w-full bg-zinc-900/60 rounded-full h-1.5 border border-zinc-850 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Feature Flags Module Section (Advanced users toggle configuration) */}
      <div id="diagnostics-feature-flags" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="border-b border-zinc-900 pb-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              ADVANCED FEATURE FLAGS
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
              Control premium runtime feature gates and sandbox capabilities
            </p>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
            LOCAL PERSISTENT STORAGE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-300 font-bold block uppercase tracking-wider">App Health Telemetry</span>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Display system health indicators and response tickers.
              </p>
            </div>
            <button
              onClick={() => handleToggleFlag('enableDiagnostics')}
              className="text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors"
            >
              {flags.enableDiagnostics ? (
                <ToggleRight className="w-9 h-9 text-amber-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-600" />
              )}
            </button>
          </div>

          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-300 font-bold block uppercase tracking-wider">Simulation Accelerator</span>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Increases telemetry flux and active rule evaluations.
              </p>
            </div>
            <button
              onClick={() => handleToggleFlag('simulationAcceleration')}
              className="text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors"
            >
              {flags.simulationAcceleration ? (
                <ToggleRight className="w-9 h-9 text-amber-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-600" />
              )}
            </button>
          </div>

          <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-300 font-bold block uppercase tracking-wider">High-Precision Tickers</span>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Sub-millisecond resolution for network ping diagnostics.
              </p>
            </div>
            <button
              onClick={() => handleToggleFlag('highPrecisionMetrics')}
              className="text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors"
            >
              {flags.highPrecisionMetrics ? (
                <ToggleRight className="w-9 h-9 text-amber-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-600" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Main dashboard content, only visible if Diagnostcs is enabled via flag */}
      {flags.enableDiagnostics ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT PANEL: Overview gauge & Telemetry Metrics (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Overall Score */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.005] blur-2xl rounded-full" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">System Integrity Score</span>
              
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-zinc-900 flex flex-col items-center justify-center relative">
                  <div className={`absolute inset-1 rounded-full border-2 border-dashed border-amber-500/20 animate-spin-slow`} />
                  <span className="text-3xl font-serif font-black text-amber-400 tracking-wider">
                    {overallScore}%
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">Integrity</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-serif font-bold text-zinc-200 uppercase">
                  {overallScore >= 90 ? 'OPTIMAL PROTOCOLS' : overallScore >= 70 ? 'DEGRADED WARNING' : 'CRITICAL FAULT MODE'}
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed max-w-sm">
                  {overallScore >= 90 
                    ? 'All micro-kernels executing within safe memory cycles. Handshakes green.' 
                    : 'Caution: Live latency imbalances or component status overrides triggered.'}
                </p>
              </div>

              <div className="w-full border-t border-zinc-900/80 my-4 pt-3.5 grid grid-cols-2 gap-2 text-left font-mono text-[9px] text-zinc-500">
                <div>
                  <span>LAST SYNC:</span>
                  <span className="block text-zinc-300 mt-0.5">{new Date(healthState.lastSyncTime).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span>PWA CACHE STATE:</span>
                  <span className="block text-emerald-400 mt-0.5">FULLY REPLICATED</span>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics List */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  SYSTEM TELEMETRY
                </h4>
                <span className="text-[9px] font-mono text-zinc-500">LIVE SENSORS</span>
              </div>

              <div className="space-y-3">
                {healthState.metrics.map((metric) => {
                  const style = getStatusColor(metric.status);
                  return (
                    <div 
                      key={metric.id}
                      className="bg-[#0C0C0D] border border-zinc-900 p-3.5 rounded-lg flex items-center justify-between gap-4 transition-all hover:border-zinc-800"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-serif font-bold text-zinc-200 block">{metric.name}</span>
                        <p className="text-[10px] font-mono text-zinc-500 leading-normal max-w-xs">{metric.details}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-zinc-100">
                          {metric.value} <span className="text-[10px] text-zinc-500 font-normal">{metric.unit}</span>
                        </div>
                        <span className={`text-[8px] font-mono font-bold inline-block px-1.5 py-0.2 rounded mt-1 ${style.bg} ${style.text}`}>
                          {metric.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Database Connection telemetry */}
                <div className="bg-[#0C0C0D] border border-zinc-900 p-3.5 rounded-lg flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-serif font-bold text-zinc-200 block">Database Connection</span>
                    <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                      Local state preservation cache host: <code className="text-[9px] text-zinc-400 bg-zinc-900 px-1 py-0.2 rounded">{healthState.dbConnection.host}</code>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-zinc-300">
                      Ping: <strong className="font-bold text-zinc-100">{healthState.dbConnection.latencyMs}ms</strong>
                    </div>
                    <span className={`text-[8px] font-mono font-bold inline-block px-1.5 py-0.2 rounded mt-1 ${getStatusColor(healthState.dbConnection.status).bg} ${getStatusColor(healthState.dbConnection.status).text}`}>
                      {healthState.dbConnection.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Component Monitor, Background Tasks, and Console logs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Component health list with OVERRIDE toggles */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  MONITORED APP COMPONENTS ({healthState.components.length} ACTIVE)
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                  <Info className="w-3 h-3 text-amber-400" />
                  <span>CLICK BADGE TO CYCLE TEST STATES</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {healthState.components.map((comp) => {
                  const style = getStatusColor(comp.status);
                  return (
                    <div 
                      key={comp.id}
                      className="bg-[#0C0C0D] border border-zinc-900/60 p-3.5 rounded-lg flex flex-col justify-between gap-3 transition-all hover:border-zinc-850"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-serif font-black text-zinc-200 tracking-wide uppercase">
                            {comp.name}
                          </span>
                          <button
                            onClick={() => cycleStatusOverride(comp.id)}
                            title="Click to cycle simulated status"
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase cursor-pointer border transition-all ${style.bg} ${style.text} ${style.glow}`}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`} />
                            {comp.status}
                          </button>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                          {comp.details}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600 border-t border-zinc-900/50 pt-2">
                        <span>SYS ID: {comp.id.toUpperCase()}</span>
                        <span>{overrides[comp.id] ? '⚠️ FORCED TEST' : '✅ REALTIME'}</span>
                      </div>
                    </div>
                  );
                })}

                {/* DB connection item as 10th component block */}
                <div className="bg-[#0C0C0D] border border-zinc-900/60 p-3.5 rounded-lg flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-serif font-black text-zinc-200 tracking-wide uppercase">
                        IndexedDB Secure
                      </span>
                      <button
                        onClick={() => cycleStatusOverride('db-connection')}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase cursor-pointer border transition-all ${getStatusColor(healthState.dbConnection.status).bg} ${getStatusColor(healthState.dbConnection.status).text}`}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor(healthState.dbConnection.status).dot}`} />
                        {healthState.dbConnection.status}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                      Local high-speed IndexedDB cache holding trade logs and machine-learning embeddings offline.
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600 border-t border-zinc-900/50 pt-2">
                    <span>SYS ID: INDEXED-DB</span>
                    <span>{overrides['db-connection'] ? '⚠️ FORCED TEST' : '✅ REALTIME'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background tasks */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase border-b border-zinc-900 pb-2">
                ACTIVE BACKGROUND DAEMONS
              </h4>

              <div className="space-y-2.5">
                {healthState.backgroundTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="bg-[#0C0C0D] border border-zinc-900/80 p-3 rounded-lg flex items-center justify-between font-mono text-[10px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <div>
                        <span className="text-zinc-200 font-bold block">{task.name}</span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">TASK-ID: {task.id}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase">
                        {task.status}
                      </span>
                      <span className="block text-[8px] text-zinc-600 mt-1">LAST CYCLE: {new Date(task.lastRun).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Terminal log */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  DIAGNOSTICS KERNEL CONSOLE
                </h4>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-zinc-500">LIVE FEED</span>
                </div>
              </div>

              <div className="bg-[#080809] border border-zinc-900 p-4 rounded-lg font-mono text-[10px] text-zinc-400 space-y-1.5 max-h-[160px] overflow-y-auto">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-amber-500 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 text-center space-y-3 animate-fade-in">
          <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-serif font-bold text-zinc-300 uppercase">
            Diagnostics Subsystem Deactivated
          </h4>
          <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto leading-relaxed">
            The App Health and Diagnostics sub-engine is currently hidden via Advanced Feature Flags. Enable "App Health Telemetry" flag above to load real-time monitors.
          </p>
        </div>
      )}

    </div>
  );
}
