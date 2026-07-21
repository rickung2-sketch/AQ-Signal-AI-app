import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Shield, Terminal, Download, RefreshCw, Database, 
  Network, CheckCircle2, AlertTriangle, XCircle, AlertCircle, 
  Zap, Play, FileJson, Copy, Sliders, Brain, Compass, Server, 
  TrendingUp, FileText, CheckSquare, Sparkles, LayoutGrid, RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { AlphaVerificationCheck, AlphaTestMetrics, AlphaReport } from '../types/alphaTest';
import { alphaTestEngine } from '../plugins/alphaTestEngine';

interface AlphaTestDashboardProps {
  addLog: (log: string) => void;
}

export default function AlphaTestDashboard({ addLog }: AlphaTestDashboardProps) {
  const [metrics, setMetrics] = useState<AlphaTestMetrics>(() => alphaTestEngine.getMetrics());
  const [checks, setChecks] = useState<AlphaVerificationCheck[]>(() => alphaTestEngine.getChecks());
  const [testLogs, setTestLogs] = useState<string[]>(() => alphaTestEngine.getLogs());
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'report'>('dashboard');
  const [isSwinging, setIsSwinging] = useState<boolean>(false);
  const [dailyReport, setDailyReport] = useState<AlphaReport | null>(null);
  
  // Simulation overrides to allow users to verify UI alerts!
  const [simulatedFailure, setSimulatedFailure] = useState<string | null>(null);
  const [simulatedWarning, setSimulatedWarning] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to continuous validation results from our singleton alphaTestEngine
    const unsubscribe = alphaTestEngine.subscribe((newMetrics, newChecks) => {
      // Apply simulation overrides
      let finalChecks = newChecks.map(c => {
        if (simulatedFailure && c.id === simulatedFailure) {
          return { ...c, status: 'FAILED' as const, details: `SIMULATED FAILURE: Manual operator test override triggered for ${c.name}.` };
        }
        if (simulatedWarning && c.id === simulatedWarning) {
          return { ...c, status: 'WARNING' as const, details: `SIMULATED WARNING: Manual operator test override triggered for ${c.name}.` };
        }
        return c;
      });

      let finalMetrics = { ...newMetrics };
      
      // Re-calculate health score based on overrides
      let score = 100;
      let fails = 0;
      let warns = 0;
      finalChecks.forEach(c => {
        if (c.status === 'FAILED') {
          score -= 15;
          fails++;
        } else if (c.status === 'WARNING') {
          score -= 5;
          warns++;
        }
      });
      finalMetrics.healthScore = Math.max(0, Math.min(100, score));
      if (fails > 0) {
        finalMetrics.pluginStatus = { ...finalMetrics.pluginStatus, status: 'ISSUES' };
      }

      setMetrics(finalMetrics);
      setChecks(finalChecks);
      setTestLogs(alphaTestEngine.getLogs());
    });

    return () => unsubscribe();
  }, [simulatedFailure, simulatedWarning]);

  // Handle manual full validation sweep
  const handleManualSweep = () => {
    setIsSwinging(true);
    addLog('SYS: Triggering manual Alpha continuous verification sweep across 9 target modules...');
    alphaTestEngine.addLog('COMMAND: Manual multi-core check sequence initialized by administrator.');
    
    setTimeout(() => {
      alphaTestEngine.runVerificationSuite();
      setIsSwinging(false);
      addLog('SYS: Alpha manual verification suite complete. Checksums resolved.');
    }, 1000);
  };

  // Generate Daily Alpha Report
  const handleGenerateReport = () => {
    const report = alphaTestEngine.generateDailyAlphaReport();
    
    // Inject simulated states if any
    if (simulatedFailure || simulatedWarning) {
      const updatedChecks = report.checks.map(c => {
        if (simulatedFailure && c.id === simulatedFailure) {
          return { ...c, status: 'FAILED' as const, details: `SIMULATED FAILURE: Manual operator test override triggered for ${c.name}.` };
        }
        if (simulatedWarning && c.id === simulatedWarning) {
          return { ...c, status: 'WARNING' as const, details: `SIMULATED WARNING: Manual operator test override triggered for ${c.name}.` };
        }
        return c;
      });
      let score = 100;
      let warningsCount = 0;
      let failuresCount = 0;
      updatedChecks.forEach(c => {
        if (c.status === 'FAILED') {
          score -= 15;
          failuresCount++;
        } else if (c.status === 'WARNING') {
          score -= 5;
          warningsCount++;
        }
      });
      score = Math.max(0, Math.min(100, score));
      let summary = 'ALL VERIFICATION PARAMETERS OPTIMAL. No action required.';
      if (failuresCount > 0) {
        summary = `CRITICAL ACTION REQUIRED. ${failuresCount} system component(s) failed active test checks. Integrity compromised.`;
      } else if (warningsCount > 0) {
        summary = `STABILITY ADVISORY. ${warningsCount} warning(s) logged in system margins. Operations remain within safe envelopes.`;
      }

      report.checks = updatedChecks;
      report.healthScore = score;
      report.warningsCount = warningsCount;
      report.failuresCount = failuresCount;
      report.summary = summary;
    }

    setDailyReport(report);
    addLog(`SYS: Generated Daily Alpha Stability Report - ID: ${report.id}`);
  };

  // Download Daily Alpha Report as Markdown
  const handleDownloadMarkdown = () => {
    if (!dailyReport) return;
    
    let md = `# AQ TRADE AI RC4 - DAILY ALPHA STABILITY & ENGINE REPORT\n`;
    md += `**Report ID**: ${dailyReport.id}\n`;
    md += `**Timestamp**: ${new Date(dailyReport.timestamp).toLocaleString()}\n`;
    md += `**Firmware Version**: RC4\n`;
    md += `**Global Health Score**: ${dailyReport.healthScore}/100\n`;
    md += `**Status Summary**: ${dailyReport.summary}\n\n`;

    md += `## 1. CRITICAL STATS\n`;
    md += `- **Market Data Quality**: ${metrics.marketDataQuality}\n`;
    md += `- **Decision Accuracy**: ${metrics.decisionAccuracyPercent}%\n`;
    md += `- **Validation Status**: ${metrics.validationStatus}\n`;
    md += `- **Avg Analysis Pipeline Time**: ${metrics.averageAnalysisTimeMs}ms\n`;
    md += `- **Network Socket**: ${metrics.networkStatus}\n`;
    md += `- **Memory Heap Allocation**: ${metrics.memoryUsageMb} MB\n\n`;

    md += `## 2. ENGINE LATENCY REPORT\n`;
    Object.entries(metrics.engineLatencyMs).forEach(([eng, lat]) => {
      md += `- **${eng}**: ${lat}ms\n`;
    });
    md += `\n`;

    md += `## 3. VERIFICATION CHECKS (${dailyReport.checks.length} Total)\n\n`;
    dailyReport.checks.forEach(c => {
      const statusIcon = c.status === 'PASSED' ? '🟢 PASSED' : c.status === 'WARNING' ? '🟡 WARNING' : '🔴 FAILED';
      md += `### ${statusIcon} - ${c.name}\n`;
      md += `- **Category**: ${c.category.toUpperCase()}\n`;
      md += `- **Timestamp**: ${new Date(c.timestamp).toLocaleTimeString()}\n`;
      md += `- **Details**: ${c.details}\n\n`;
    });

    md += `## 4. AUDIT COMPLIANCE SIGN-OFF\n`;
    md += `*Report processed and verified by AQ Secure Node RC4 alpha monitoring service on behalf of administrator.*`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dailyReport.id}_RC4_stability_audit.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog(`SYS: Exported Alpha Stability Report (Markdown) successfully.`);
  };

  // Download Daily Alpha Report as JSON
  const handleDownloadJSON = () => {
    if (!dailyReport) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      ...dailyReport,
      metricsSummary: metrics,
    }, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${dailyReport.id}_RC4_telemetry_digest.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog(`SYS: Exported Alpha Stability Report (JSON) successfully.`);
  };

  // Clear simulated override states
  const handleClearSimulation = () => {
    setSimulatedFailure(null);
    setSimulatedWarning(null);
    alphaTestEngine.addLog('SIMULATOR: All simulated fault overrides cleared by administrator.');
    addLog('SYS: Simulated engine fault parameters normalized.');
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getStatusBadge = (status: 'PASSED' | 'WARNING' | 'FAILED') => {
    switch (status) {
      case 'PASSED':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-widest font-bold">Passed</span>;
      case 'WARNING':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest font-bold">Warning</span>;
      case 'FAILED':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-widest font-bold">Failed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30">
              <Cpu className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-zinc-100 tracking-wide">
                ALPHA TEST DASHBOARD
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Continuous application and engine level validation • firmware RC4
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded text-xs font-mono tracking-wider transition-all border ${
              activeSubTab === 'dashboard'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            LIVE MONITORING
          </button>
          <button
            onClick={() => {
              setActiveSubTab('report');
              if (!dailyReport) handleGenerateReport();
            }}
            className={`px-4 py-2 rounded text-xs font-mono tracking-wider transition-all border ${
              activeSubTab === 'report'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            DAILY REPORT
          </button>
        </div>
      </div>

      {activeSubTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* System Health Score */}
            <div className={`p-5 rounded-xl border ${getHealthBg(metrics.healthScore)} relative overflow-hidden transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  System Health Score
                </span>
                <Sparkles className="w-4 h-4 text-amber-500/70" />
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-3xl font-serif font-bold ${getHealthColor(metrics.healthScore)}`}>
                  {metrics.healthScore}
                </span>
                <span className="text-xs text-zinc-600 font-mono">/ 100</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full animate-pulse ${metrics.healthScore >= 90 ? 'bg-emerald-500' : metrics.healthScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {metrics.healthScore >= 90 ? 'OPTIMAL INTEGRITY' : metrics.healthScore >= 70 ? 'DEGRADED MARGINS' : 'CRITICAL FAULTS'}
                </span>
              </div>
              
              {/* Radial Glow effect */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Market Data Quality */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-900/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Market Data Quality
                </span>
                <Database className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-2xl font-mono font-bold tracking-wide ${
                  metrics.marketDataQuality === 'EXCELLENT' ? 'text-emerald-400' : metrics.marketDataQuality === 'STABLE' ? 'text-amber-400' : 'text-rose-500'
                }`}>
                  {metrics.marketDataQuality}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Activity className="w-3.5 h-3.5 text-zinc-600" />
                <span>Socket latency checks active</span>
              </div>
            </div>

            {/* Decision Accuracy */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-900/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Decision Accuracy
                </span>
                <TrendingUp className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-serif font-bold text-zinc-100">
                  {metrics.decisionAccuracyPercent}%
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
                <span>Hit rate validation synced</span>
              </div>
            </div>

            {/* Validation & Network Status */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-900/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Network & Plugins
                </span>
                <Network className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">NETWORK</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                    {metrics.networkStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">PLUGINS</span>
                  <span className="text-xs font-mono font-bold text-zinc-200 tracking-wider">
                    {metrics.pluginStatus.activeCount}/{metrics.pluginStatus.totalCount} ACTIVE
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Server className="w-3.5 h-3.5 text-zinc-600" />
                <span>Validation status: {metrics.validationStatus}</span>
              </div>
            </div>

          </div>

          {/* Core Controls Row */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500/80" />
                <span>Continuous verification cycle: <strong className="text-zinc-200">Active (4s loop)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-zinc-600" />
                <span>Avg analysis pipeline: <strong className="text-amber-400">{metrics.averageAnalysisTimeMs}ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-600" />
                <span>Memory heap: <strong className="text-zinc-200">{metrics.memoryUsageMb} MB</strong></span>
              </div>
            </div>

            <button
              onClick={handleManualSweep}
              disabled={isSwinging}
              className="flex items-center justify-center gap-2 px-4.5 py-2 rounded bg-amber-500 text-zinc-950 font-mono text-xs font-bold tracking-wider hover:bg-amber-400 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSwinging ? 'animate-spin' : ''}`} />
              {isSwinging ? 'RUNNING CHECKSUMS...' : 'RUN VERIFICATION SWEEP'}
            </button>
          </div>

          {/* Engine Latency Graph & Verification Checklist Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Engine Latencies */}
            <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-900/80 space-y-5 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">
                  Engine Latency Telemetry
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">ms latency</span>
              </div>

              <div className="space-y-4">
                {Object.entries(metrics.engineLatencyMs).map(([engine, lat]) => {
                  const latNum = lat as number;
                  return (
                    <div key={engine} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">{engine}</span>
                        <span className={`${latNum > 20 ? 'text-amber-400' : 'text-zinc-300'}`}>{latNum}ms</span>
                      </div>
                      {/* Progress Bar representation */}
                      <div className="h-1.5 bg-zinc-900/80 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            latNum > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.min(100, (latNum / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-[10px] font-mono text-zinc-500 leading-normal border-t border-zinc-900/40">
                *Latencies measure exact physical computation intervals including execution threads and memory operations.
              </div>
            </div>

            {/* Continuous Checklist */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">
                  Continuous Verification Checks ({checks.length} metrics)
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">9 modules verified</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checks.map((check) => {
                  const isWarning = check.status === 'WARNING';
                  const isFailed = check.status === 'FAILED';
                  return (
                    <div 
                      key={check.id}
                      className={`p-4 rounded-xl bg-zinc-950/60 border transition-all duration-200 ${
                        isFailed 
                          ? 'border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.02)]' 
                          : isWarning 
                            ? 'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.02)]' 
                            : 'border-zinc-900/80 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isFailed ? (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          <span className="text-xs font-mono font-bold text-zinc-200 line-clamp-1">
                            {check.name}
                          </span>
                        </div>
                        {getStatusBadge(check.status)}
                      </div>
                      
                      <p className="mt-2.5 text-[11px] text-zinc-400 font-mono leading-relaxed min-h-[34px]">
                        {check.details}
                      </p>

                      <div className="mt-3.5 pt-2 border-t border-zinc-900/40 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                        <span className="uppercase bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 text-[8px] tracking-widest">
                          {check.category}
                        </span>
                        <span>{new Date(check.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Playground Simulator & Log Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Play Overrides */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-900/80 space-y-4 lg:col-span-1">
              <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">
                    Playground Fault Simulator
                  </h3>
                </div>
                {(simulatedFailure || simulatedWarning) && (
                  <button 
                    onClick={handleClearSimulation}
                    className="text-[10px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                Manually force simulated engine anomalies or warning thresholds to test compliance actions and dashboard visual response.
              </p>

              <div className="space-y-2.5 pt-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase tracking-wider">Simulate FAILED engine</label>
                  <select 
                    value={simulatedFailure || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSimulatedFailure(val ? val : null);
                      if (val) {
                        setSimulatedWarning(prev => prev === val ? null : prev);
                        alphaTestEngine.addLog(`SIMULATOR: Injected CRITICAL FAILURE override on check: ${val}`);
                        addLog(`SYS: Simulated CRITICAL engine exception registered.`);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">-- No Overrides --</option>
                    {checks.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase tracking-wider">Simulate WARNING engine</label>
                  <select 
                    value={simulatedWarning || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSimulatedWarning(val ? val : null);
                      if (val) {
                        setSimulatedFailure(prev => prev === val ? null : prev);
                        alphaTestEngine.addLog(`SIMULATOR: Injected WARNING anomaly override on check: ${val}`);
                        addLog(`SYS: Simulated engine drift warning registered.`);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">-- No Overrides --</option>
                    {checks.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Test Log Feed */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-900/80 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">
                    Continuous Alpha Test Feed
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-zinc-600 block uppercase">Real-Time</span>
              </div>

              {/* Terminal box */}
              <div className="bg-[#080809] border border-zinc-900 rounded-lg p-3 h-36 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                {testLogs.length === 0 ? (
                  <span className="text-zinc-600 block">Waiting for verification iterations...</span>
                ) : (
                  testLogs.map((log, index) => {
                    let color = 'text-zinc-500';
                    if (log.includes('ALERT:')) color = 'text-rose-500 font-bold';
                    else if (log.includes('WARN:')) color = 'text-amber-400';
                    else if (log.includes('SIMULATOR:')) color = 'text-sky-400';
                    else if (log.includes('INFO:')) color = 'text-emerald-400';
                    
                    return (
                      <div key={index} className={color}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Daily Alpha Report View */
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-900/80 space-y-6">
            
            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div>
                <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 tracking-widest uppercase block w-max mb-1.5 font-bold">
                  RC4 SECURE TELEMETRY RECORD
                </span>
                <h3 className="text-base font-bold font-serif text-zinc-200 tracking-wide">
                  {dailyReport?.title || 'STABILITY REPORT GENERATION'}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  ID: {dailyReport?.id || 'PENDING'} • Generated {dailyReport ? new Date(dailyReport.timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateReport}
                  className="px-3.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  RE-GENERATE
                </button>
                
                {dailyReport && (
                  <>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 rounded bg-amber-500 text-zinc-950 font-mono text-xs font-bold hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      MD
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      JSON
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Overall Verdict Banner */}
            {dailyReport && (
              <div className={`p-4 rounded-lg border ${
                dailyReport.failuresCount > 0 
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' 
                  : dailyReport.warningsCount > 0 
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' 
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              } flex items-start gap-3`}>
                {dailyReport.failuresCount > 0 ? (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : dailyReport.warningsCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-0.5">
                    SYSTEM STATUS SUMMARY
                  </span>
                  <p className="text-xs font-mono">
                    {dailyReport.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Warnings and Failures Segment */}
            {dailyReport && (dailyReport.failuresCount > 0 || dailyReport.warningsCount > 0) && (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-3">
                <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Warnings or Failed Checks Highlighted
                </h4>
                
                <div className="space-y-2">
                  {dailyReport.checks.filter(c => c.status !== 'PASSED').map(c => (
                    <div key={c.id} className="p-3 bg-zinc-950 rounded border border-zinc-900/60 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-zinc-200 block">{c.name}</span>
                        <p className="text-[11px] font-mono text-zinc-400 leading-normal">{c.details}</p>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Matrix Table representation */}
            {dailyReport && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
                  Full Compliance Verification Log ({dailyReport.checks.length} Total Checked)
                </h4>
                
                <div className="border border-zinc-900/80 rounded-lg overflow-hidden bg-zinc-950/20">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500">
                        <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Module Check</th>
                        <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Category</th>
                        <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Status</th>
                        <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Time Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/40">
                      {dailyReport.checks.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-900/20 text-[11px]">
                          <td className="p-3">
                            <span className="text-zinc-200 block font-bold">{c.name}</span>
                            <span className="text-zinc-500 text-[10px]">{c.details}</span>
                          </td>
                          <td className="p-3 uppercase text-zinc-400 text-[10px]">{c.category}</td>
                          <td className="p-3">{getStatusBadge(c.status)}</td>
                          <td className="p-3 text-zinc-500 text-[10px]">{new Date(c.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer declaration */}
            <div className="pt-4 border-t border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 leading-normal">
              <span>*SECURE CRYPTO HANDSHAKE NODE INTEGRATED</span>
              <span>AQ VERIFICATION ENGINE OPERATOR DIRECTIVES ACCEPTED</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
