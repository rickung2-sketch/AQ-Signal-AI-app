import React, { useState, useEffect } from 'react';
import { 
  Play, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, 
  Settings, History, Sliders, Trash2, HelpCircle, Activity, 
  ShieldAlert, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { regressionTestEngine } from '../plugins/regressionTestEngine';
import { RegressionTestRun, TestCaseResult, RegressionSettings } from '../types/regression';

interface RegressionTestDashboardProps {
  addLog: (msg: string) => void;
}

export default function RegressionTestDashboard({ addLog }: RegressionTestDashboardProps) {
  const [currentRun, setCurrentRun] = useState<RegressionTestRun | null>(null);
  const [history, setHistory] = useState<RegressionTestRun[]>([]);
  const [settings, setSettings] = useState<RegressionSettings>(() => regressionTestEngine.getSettings());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [filterEngine, setFilterEngine] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = regressionTestEngine.subscribe((latestRun, fullHistory) => {
      setCurrentRun(latestRun);
      setHistory(fullHistory);
      setSettings(regressionTestEngine.getSettings());
      if (latestRun && !selectedRunId) {
        setSelectedRunId(latestRun.id);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRunTests = async () => {
    setIsRunning(true);
    addLog('SYS: Initiating manual regression testing sweep across 8 core engines...');
    try {
      const result = await regressionTestEngine.runRegressionSuite(false);
      setSelectedRunId(result.id);
      if (result.status === 'SUCCESS') {
        addLog(`SYS: Regression tests passed successfully. ${result.passedCount} checks verified in ${result.executionTimeMs}ms.`);
      } else if (result.status === 'WARNINGS') {
        addLog(`SYS: Regression tests finished with ${result.warningCount} warnings in ${result.executionTimeMs}ms.`);
      } else {
        addLog(`SYS: Regression tests failed! ${result.failedCount} critical errors found.`);
      }
    } catch (e: any) {
      addLog(`ERR: Regression testing execution aborted: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleAutoRun = () => {
    const nextVal = !settings.autoRunEnabled;
    regressionTestEngine.updateSettings({ autoRunEnabled: nextVal });
    setSettings(prev => ({ ...prev, autoRunEnabled: nextVal }));
    addLog(`SYS: Background automated regression scheduled ${nextVal ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleChangeInterval = (seconds: number) => {
    regressionTestEngine.updateSettings({ autoRunIntervalSeconds: seconds });
    setSettings(prev => ({ ...prev, autoRunIntervalSeconds: seconds }));
    addLog(`SYS: Regression automation interval updated to ${seconds} seconds.`);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all regression test history?')) {
      regressionTestEngine.clearHistory();
      setCurrentRun(null);
      setSelectedRunId(null);
      addLog('SYS: Regression history cleared.');
    }
  };

  const toggleTestExpand = (testId: string) => {
    setExpandedTests(prev => ({ ...prev, [testId]: !prev[testId] }));
  };

  const activeRun = history.find(r => r.id === selectedRunId) || currentRun || (history.length > 0 ? history[0] : null);

  const enginesList = [
    'ALL',
    'Rule Engine',
    'Decision Engine',
    'Guardian',
    'Strategy Engine',
    'Indicator Engine',
    'Market Structure Engine',
    'Paper Trading',
    'Validation Mode'
  ];

  const filteredResults = activeRun
    ? activeRun.results.filter(r => filterEngine === 'ALL' || r.engine === filterEngine)
    : [];

  return (
    <div id="regression-test-dashboard" className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[10px] font-mono text-amber-500/80 tracking-widest block uppercase font-bold">
            CONTINUOUS INTEGRATION DEPLOYMENT RC5
          </span>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2 mt-1">
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
            REGRESSION TESTING MODULE
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Performs multi-point automated tests on our rule schemas, consensus engines, risk modules, portfolio calculations, and state transition pipelines.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            id="run-regression-btn"
            onClick={handleRunTests}
            disabled={isRunning}
            className={`px-4 py-2 text-xs font-mono font-medium rounded border transition-all flex items-center gap-2 ${
              isRunning 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-zinc-600' : 'text-amber-400'}`} />
            {isRunning ? 'RUNNING CHECKS...' : 'RUN TESTS MANUALLY'}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Automation & History */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Scheduler Settings Card */}
          <div className="bg-zinc-950 border border-zinc-900/60 rounded p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-zinc-500" />
              Test Automation Controls
            </h3>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded border border-zinc-900">
                <div>
                  <span className="text-xs font-medium text-zinc-300 block">Automatic Execution</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Runs suite on background threads</span>
                </div>
                <button
                  id="toggle-autorun-btn"
                  onClick={handleToggleAutoRun}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.autoRunEnabled ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                      settings.autoRunEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.autoRunEnabled && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide block">
                    Automation Sweep Interval
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleChangeInterval(sec)}
                        className={`py-1.5 px-2 text-[10px] font-mono rounded border transition-all ${
                          settings.autoRunIntervalSeconds === sec
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-zinc-500 leading-normal flex items-start gap-1.5 bg-zinc-900/20 p-2.5 rounded border border-zinc-900/40">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                <span>
                  The background executor runs on isolated sandboxes using non-destructive inputs, leaving active live positions and order history intact.
                </span>
              </div>
            </div>
          </div>

          {/* Test History Card */}
          <div className="bg-zinc-950 border border-zinc-900/60 rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Execution History
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-[10px] font-mono uppercase flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-900 rounded bg-zinc-900/10">
                <Activity className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <span className="text-xs text-zinc-600 block">No historic test runs found.</span>
                <span className="text-[10px] text-zinc-600 block mt-1">Run tests manually to populate logs.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {history.map((run) => {
                  const isSelected = run.id === selectedRunId;
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`p-3 rounded border text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-zinc-900/90 border-amber-500/30' 
                          : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-zinc-300">
                          ID: {run.id}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold ${
                          run.status === 'SUCCESS' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : run.status === 'WARNINGS' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {run.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2">
                        <span>{new Date(run.timestamp).toLocaleTimeString()}</span>
                        <span>Latency: {run.executionTimeMs}ms</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center mt-2.5 pt-2 border-t border-zinc-900 text-[10px] font-mono">
                        <div>
                          <span className="text-emerald-400 block font-semibold">{run.passedCount}</span>
                          <span className="text-zinc-600 text-[8px] uppercase tracking-wider block mt-0.5">Pass</span>
                        </div>
                        <div>
                          <span className="text-red-400 block font-semibold">{run.failedCount}</span>
                          <span className="text-zinc-600 text-[8px] uppercase tracking-wider block mt-0.5">Fail</span>
                        </div>
                        <div>
                          <span className="text-amber-400 block font-semibold">{run.warningCount}</span>
                          <span className="text-zinc-600 text-[8px] uppercase tracking-wider block mt-0.5">Warn</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Latest Test Summary & Case Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics summary card */}
          {activeRun ? (
            <div className="bg-zinc-950 border border-zinc-900/60 rounded p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4 mb-5">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Telemetry Report Summary
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-sm font-bold font-mono text-zinc-200">
                      Run ID: {activeRun.id}
                    </h3>
                    {activeRun.isAutoRun && (
                      <span className="text-[8px] font-mono text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                        Auto Run
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 text-right">
                  <div>Timestamp: {new Date(activeRun.timestamp).toLocaleString()}</div>
                </div>
              </div>

              {/* Banner */}
              <div className={`p-4 rounded border mb-6 flex items-start gap-3 ${
                activeRun.status === 'SUCCESS'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : activeRun.status === 'WARNINGS'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                    : 'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                {activeRun.status === 'SUCCESS' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : activeRun.status === 'WARNINGS' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wide">
                    {activeRun.status === 'SUCCESS' && 'ALL SYSTEM ENGINES COHERENT'}
                    {activeRun.status === 'WARNINGS' && 'TEST COMPLETED WITH SYSTEM WARNINGS'}
                    {activeRun.status === 'FAILURE' && 'CRITICAL ERROR: REGRESSION DETECTED'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {activeRun.status === 'SUCCESS' && 'Verified end-to-end alignment successfully across all 8 modular systems. State machines are operating inside predicted latency limits.'}
                    {activeRun.status === 'WARNINGS' && 'The test suite completed but encountered minor warnings in limits or thresholds. Review indicator calibrations or fallback configurations below.'}
                    {activeRun.status === 'FAILURE' && 'A critical test case failed! A system regression has been introduced that prevents compilation-free verification. Immediate investigation is required.'}
                  </p>
                </div>
              </div>

              {/* Major metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded text-center">
                  <span className="text-zinc-500 text-[9px] font-mono uppercase tracking-wide block">
                    Execution Latency
                  </span>
                  <span className="text-xl font-bold font-mono text-zinc-200 block mt-1">
                    {activeRun.executionTimeMs} <span className="text-xs text-zinc-500 font-normal">ms</span>
                  </span>
                </div>

                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded text-center">
                  <span className="text-emerald-500 text-[9px] font-mono uppercase tracking-wide block">
                    Checks Passed
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
                    {activeRun.passedCount} <span className="text-xs text-zinc-600 font-normal">/ {activeRun.totalTests}</span>
                  </span>
                </div>

                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded text-center">
                  <span className="text-red-400 text-[9px] font-mono uppercase tracking-wide block">
                    Checks Failed
                  </span>
                  <span className={`text-xl font-bold font-mono block mt-1 ${activeRun.failedCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {activeRun.failedCount}
                  </span>
                </div>

                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded text-center">
                  <span className="text-amber-500 text-[9px] font-mono uppercase tracking-wide block">
                    System Warnings
                  </span>
                  <span className={`text-xl font-bold font-mono block mt-1 ${activeRun.warningCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {activeRun.warningCount}
                  </span>
                </div>

              </div>

              {/* Warning Log Block if present */}
              {activeRun.warnings.length > 0 && (
                <div className="mt-5 p-4 bg-amber-500/5 border border-amber-500/10 rounded">
                  <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-wider block mb-2 font-semibold">
                    Warning Telemetry Feed
                  </span>
                  <ul className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                    {activeRun.warnings.map((warn, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-900/60 rounded p-12 text-center">
              <AlertCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-wider">
                Waiting For Test Sequence
              </h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                No active regression runs are loaded. Trigger a manual check or enable background automation to begin testing.
              </p>
            </div>
          )}

          {/* Test Case Breakdown Log */}
          {activeRun && (
            <div className="bg-zinc-950 border border-zinc-900/60 rounded overflow-hidden">
              <div className="p-5 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-zinc-500" />
                  Test Case Logs
                </h3>

                {/* Filter list */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">ENGINE:</span>
                  <select
                    value={filterEngine}
                    onChange={(e) => setFilterEngine(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-amber-500/40"
                  >
                    {enginesList.map(eng => (
                      <option key={eng} value={eng}>{eng.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y divide-zinc-900 max-h-[500px] overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <div className="py-12 text-center text-zinc-600 text-xs font-mono">
                    No matching test results for the current filter.
                  </div>
                ) : (
                  filteredResults.map((test) => {
                    const isExpanded = !!expandedTests[test.id];
                    return (
                      <div key={test.id} className="p-4 hover:bg-zinc-900/10 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {/* Icon status */}
                            <div className="mt-0.5 shrink-0">
                              {test.status === 'PASSED' && (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              )}
                              {test.status === 'WARNING' && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              {test.status === 'FAILED' && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-zinc-200">
                                  {test.name}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                                  {test.engine}
                                </span>
                                <span className="text-[8px] font-mono text-zinc-600">
                                  ID: {test.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                                {test.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleTestExpand(test.id)}
                            className="text-zinc-600 hover:text-zinc-400 p-1"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expandable debug panel */}
                        {isExpanded && (
                          <div className="mt-3 ml-6 p-3 bg-zinc-950 border border-zinc-900 rounded font-mono text-[10px] space-y-2 text-zinc-400">
                            <div>
                              <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5">Test Case Outcome:</span>
                              <span className={test.status === 'PASSED' ? 'text-emerald-400' : test.status === 'WARNING' ? 'text-amber-400' : 'text-red-400'}>
                                {test.status}
                              </span>
                            </div>

                            {test.message && (
                              <div>
                                <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5">Error/Warning message:</span>
                                <span className="text-red-300 block bg-red-950/20 p-2 rounded border border-red-950/30">
                                  {test.message}
                                </span>
                              </div>
                            )}

                            {test.details && (
                              <div>
                                <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5">Internal Telemetry Details:</span>
                                <pre className="text-zinc-300 block bg-zinc-900 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                                  {test.details}
                                </pre>
                              </div>
                            )}

                            <div>
                              <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5 font-sans">Verification Method:</span>
                              <span className="text-zinc-500 italic block font-sans">
                                Isolated simulated sandbox pipeline verification. No external read/write mutations.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
