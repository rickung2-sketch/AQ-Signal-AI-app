import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Activity, RefreshCw, Layers, ShieldCheck, Zap, Server, 
  Terminal, Play, Pause, AlertTriangle, CheckCircle, Clock, Plus, 
  ArrowRight, ToggleLeft, ToggleRight, Trash2, Sliders, Bell, Share2, CornerDownRight
} from 'lucide-react';
import { 
  EngineId, EngineStatus, EngineInfo, OSTask, OSBackgroundJob, OSTimelineEvent, OSMetrics, TaskPriority 
} from '../types/aqOS';

interface AQOSDashboardProps {
  addLog: (log: string) => void;
}

const INITIAL_ENGINES: EngineInfo[] = [
  { id: 'market-data', name: 'Market Data Engine', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: 'Just Now', processedCount: 14592, priority: 'CRITICAL', threads: 4 },
  { id: 'rule-engine', name: 'Rule Engine', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: 'Just Now', processedCount: 29184, priority: 'CRITICAL', threads: 2 },
  { id: 'decision-engine', name: 'Decision Engine', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: '3s ago', processedCount: 1845, priority: 'CRITICAL', threads: 2 },
  { id: 'guardian-engine', name: 'Guardian Engine', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: '3s ago', processedCount: 1845, priority: 'CRITICAL', threads: 1 },
  { id: 'strategy-engine', name: 'Strategy Engine', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: '12s ago', processedCount: 924, priority: 'HIGH', threads: 2 },
  { id: 'scanner', name: 'Smart Scanner', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: '1s ago', processedCount: 7420, priority: 'HIGH', threads: 2 },
  { id: 'validation-mode', name: 'Validation Mode', status: 'ONLINE', uptimeSeconds: 12400, lastActiveTime: '15s ago', processedCount: 312, priority: 'MEDIUM', threads: 1 },
  { id: 'plugin-manager', name: 'Plugin Manager', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: '1m ago', processedCount: 8, priority: 'LOW', threads: 1 },
  { id: 'broker-manager', name: 'Broker Manager', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: 'Just Now', processedCount: 312, priority: 'HIGH', threads: 1 },
  { id: 'mission-control', name: 'Mission Control', status: 'ONLINE', uptimeSeconds: 24500, lastActiveTime: 'Just Now', processedCount: 45, priority: 'HIGH', threads: 1 },
];

const INITIAL_BACKGROUND_JOBS: OSBackgroundJob[] = [
  { id: 'job-health', name: 'Engine Heartbeat Checker', intervalMs: 3000, lastRunTime: '2s ago', nextRunTime: 'In 1s', status: 'RUNNING', executionCount: 8166 },
  { id: 'job-telemetry', name: 'Telemetry Collector', intervalMs: 5000, lastRunTime: '4s ago', nextRunTime: 'In 1s', status: 'RUNNING', executionCount: 4900 },
  { id: 'job-purge', name: 'Task Queue Garbage Collection', intervalMs: 30000, lastRunTime: '18s ago', nextRunTime: 'In 12s', status: 'RUNNING', executionCount: 816 },
  { id: 'job-mfe-mae', name: 'MFE/MAE Vector Processor', intervalMs: 15000, lastRunTime: '8s ago', nextRunTime: 'In 7s', status: 'RUNNING', executionCount: 1632 }
];

const INITIAL_TIMELINE: OSTimelineEvent[] = [
  { id: 'ev-1', timestamp: new Date(Date.now() - 300000).toISOString(), category: 'SYSTEM', severity: 'SUCCESS', message: 'AQ OS kernel initialized successfully.', source: 'Kernel' },
  { id: 'ev-2', timestamp: new Date(Date.now() - 250000).toISOString(), category: 'ENGINE', severity: 'INFO', message: 'All 10 core engines attached to unified OS communication bus.', source: 'CoreBus' },
  { id: 'ev-3', timestamp: new Date(Date.now() - 180000).toISOString(), category: 'COMMUNICATION', severity: 'INFO', message: 'Engine-to-engine shared memory queues instantiated.', source: 'MemoryController' },
  { id: 'ev-4', timestamp: new Date(Date.now() - 120000).toISOString(), category: 'SECURITY', severity: 'SUCCESS', message: 'AI Guardian safety circuit breaker synchronized with OS core interrupt.', source: 'GuardianEngine' },
];

export default function AQOSDashboard({ addLog }: AQOSDashboardProps) {
  const [engines, setEngines] = useState<EngineInfo[]>(INITIAL_ENGINES);
  const [backgroundJobs, setBackgroundJobs] = useState<OSBackgroundJob[]>(INITIAL_BACKGROUND_JOBS);
  const [timeline, setTimeline] = useState<OSTimelineEvent[]>(INITIAL_TIMELINE);
  const [tasks, setTasks] = useState<OSTask[]>([
    { id: 'task-101', name: 'Scan Solana Liquidity', targetEngine: 'scanner', priority: 'NORMAL', status: 'PROCESSING', payloadSizeKb: 24, queuedTime: '2s ago' },
    { id: 'task-102', name: 'Sanitize Order Payload', targetEngine: 'guardian-engine', priority: 'CRITICAL', status: 'PENDING', payloadSizeKb: 8, queuedTime: 'Just now' },
    { id: 'task-103', name: 'Sync Broker Order Book', targetEngine: 'broker-manager', priority: 'IMMEDIATE', status: 'PENDING', payloadSizeKb: 12, queuedTime: 'Just now' }
  ]);

  const [metrics, setMetrics] = useState<OSMetrics>({
    cpuLoadPercent: 28,
    memoryUsedMb: 412,
    memoryMaxMb: 1024,
    pluginCount: 8,
    activeTasksCount: 3,
    lastDecisionTime: '3s ago',
    decisionRatePerMin: 18.5,
    uptimeSeconds: 24500
  });

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);

  // Task queue form
  const [customTaskName, setCustomTaskName] = useState('');
  const [customTaskEngine, setCustomTaskEngine] = useState<EngineId>('decision-engine');
  const [customTaskPriority, setCustomTaskPriority] = useState<TaskPriority>('NORMAL');

  // Trigger timeline event helper
  const triggerEvent = (category: OSTimelineEvent['category'], severity: OSTimelineEvent['severity'], message: string, source: string) => {
    const newEvent: OSTimelineEvent = {
      id: `ev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      severity,
      message,
      source
    };
    setTimeline(prev => [newEvent, ...prev].slice(0, 50));
    addLog(`AQOS [${category} / ${source}]: ${message}`);
  };

  // Engine control: RESTART
  const handleRestartEngine = (id: EngineId, name: string) => {
    setEngines(prev => prev.map(eng => {
      if (eng.id === id) {
        return { ...eng, status: 'RESTARTING' as const };
      }
      return eng;
    }));

    triggerEvent('ENGINE', 'WARNING', `Restart command issued to engine node: ${name}. Re-allocating worker thread pool.`, name);

    setTimeout(() => {
      setEngines(prev => prev.map(eng => {
        if (eng.id === id) {
          triggerEvent('ENGINE', 'SUCCESS', `Engine node [${name}] re-initialized online, memory cache hot and synchronized.`, name);
          return { 
            ...eng, 
            status: 'ONLINE' as const, 
            uptimeSeconds: 0,
            processedCount: eng.processedCount + 1 
          };
        }
        return eng;
      }));
    }, 1500);
  };

  // Engine control: TOGGLE
  const handleToggleEngine = (id: EngineId, currentStatus: EngineStatus) => {
    const nextStatus: EngineStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setEngines(prev => prev.map(eng => {
      if (eng.id === id) {
        return { ...eng, status: nextStatus };
      }
      return eng;
    }));
    triggerEvent('ENGINE', nextStatus === 'ONLINE' ? 'SUCCESS' : 'CRITICAL', `Engine node [${id}] set to ${nextStatus} by operator override request.`, 'OperatorConsole');
  };

  // Run dynamic queue processor simulation
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      // 1. Progress current task
      setTasks(prev => {
        let modified = false;
        const next = prev.map(t => {
          if (t.status === 'PROCESSING') {
            modified = true;
            return { ...t, status: 'COMPLETED' as const, executionTimeMs: 45 + Math.floor(Math.random() * 200) };
          }
          if (t.status === 'PENDING') {
            modified = true;
            return { ...t, status: 'PROCESSING' as const };
          }
          return t;
        });

        // Filter out completed tasks if list is getting long
        const activeAndRecent = next.filter(t => t.status !== 'COMPLETED' || Math.random() > 0.3);
        
        // Add a mock random task
        if (activeAndRecent.length < 5 && Math.random() > 0.4) {
          const taskTemplates = [
            { name: 'Assess MFE/MAE thresholds', engine: 'validation-mode', priority: 'NORMAL' as const },
            { name: 'Update Spread Health Matrix', engine: 'market-data', priority: 'CRITICAL' as const },
            { name: 'Verify Block Signature', engine: 'guardian-engine', priority: 'IMMEDIATE' as const },
            { name: 'Update Decision Vector Grid', engine: 'decision-engine', priority: 'CRITICAL' as const },
            { name: 'Check Broker Balance Settle', engine: 'broker-manager', priority: 'NORMAL' as const },
            { name: 'Recalculate Kelly Leverage', engine: 'strategy-engine', priority: 'BACKGROUND' as const },
          ];
          const chosen = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
          activeAndRecent.push({
            id: `task-${Math.floor(Math.random() * 900) + 100}`,
            name: chosen.name,
            targetEngine: chosen.engine as EngineId,
            priority: chosen.priority,
            status: 'PENDING',
            payloadSizeKb: Math.floor(Math.random() * 45) + 1,
            queuedTime: 'Just now'
          });
        }
        return activeAndRecent;
      });

      // 2. Fluctuating metrics
      setMetrics(prev => {
        const nextCpu = Math.max(12, Math.min(84, prev.cpuLoadPercent + (Math.random() > 0.5 ? 4 : -4)));
        const nextMem = Math.max(380, Math.min(620, prev.memoryUsedMb + (Math.random() > 0.5 ? 6 : -6)));
        const nextRate = Math.max(12, Math.min(32, prev.decisionRatePerMin + (Math.random() > 0.5 ? 0.8 : -0.8)));
        return {
          ...prev,
          cpuLoadPercent: nextCpu,
          memoryUsedMb: nextMem,
          decisionRatePerMin: Math.round(nextRate * 10) / 10,
          activeTasksCount: tasks.filter(t => t.status !== 'COMPLETED').length,
          uptimeSeconds: prev.uptimeSeconds + 3
        };
      });

      // 3. Random background jobs executions counter
      setBackgroundJobs(prev => prev.map(job => {
        if (Math.random() > 0.5) {
          return {
            ...job,
            executionCount: job.executionCount + 1,
            lastRunTime: 'Just now'
          };
        }
        return job;
      }));

    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulationRunning, tasks]);

  // Handle manual task submissions
  const handleEnqueueTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskName.trim()) return;

    const newTask: OSTask = {
      id: `task-${Date.now().toString().slice(-4)}`,
      name: customTaskName,
      targetEngine: customTaskEngine,
      priority: customTaskPriority,
      status: 'PENDING',
      payloadSizeKb: Math.floor(Math.random() * 32) + 2,
      queuedTime: 'Just now'
    };

    setTasks(prev => [newTask, ...prev]);
    setCustomTaskName('');
    triggerEvent('QUEUE', 'INFO', `User operator pushed task [${newTask.name}] manually to [${customTaskEngine}] engine node. Priority: ${customTaskPriority}`, 'TaskQueue');
  };

  const handlePauseSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning);
    triggerEvent('SYSTEM', 'WARNING', `Dynamic OS loop telemetry updates ${isSimulationRunning ? 'PAUSED' : 'RESUMED'}.`, 'KernelController');
  };

  const filteredTimeline = timeline.filter(ev => {
    if (filterCategory === 'ALL') return true;
    return ev.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* OS Banner */}
      <div id="aqos-banner-header" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
              AQ OS KERNEL v4.0
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Unified OS Orchestrator
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-200 uppercase tracking-wide flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-500" />
            AQ Operating System (AQ OS)
          </h2>
          <p className="text-xs font-serif text-zinc-400 max-w-2xl leading-relaxed">
            A secure full-stack multi-threaded event coordinator independent of custom trading logic. Monitored engines are coordinated through thread limits, priority tasks scheduling, isolated memory boundaries, and hot-swappable recovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={handlePauseSimulation}
            className={`font-mono text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSimulationRunning 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isSimulationRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Telemetry
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Telemetry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resource Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: CPU load */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">CPU Threads Pool</span>
            <Cpu className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.cpuLoadPercent}%</span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">● CORES OK</span>
          </div>
          {/* visual bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                metrics.cpuLoadPercent > 75 ? 'bg-red-500' : metrics.cpuLoadPercent > 50 ? 'bg-amber-500' : 'bg-amber-400'
              }`}
              style={{ width: `${metrics.cpuLoadPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Uptime: {Math.floor(metrics.uptimeSeconds / 3600)}h {Math.floor((metrics.uptimeSeconds % 3600) / 60)}m</span>
            <span>Freq: 4.80 GHz</span>
          </div>
        </div>

        {/* Card 2: Memory Load */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">SRAM Allocations</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.memoryUsedMb} MB</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">/ {metrics.memoryMaxMb} MB</span>
          </div>
          {/* visual bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500/80 transition-all duration-1000"
              style={{ width: `${(metrics.memoryUsedMb / metrics.memoryMaxMb) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Garbage Coll: AUTO</span>
            <span>Alloc blocks: 1,422</span>
          </div>
        </div>

        {/* Card 3: Decision telemetry */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Interrupt Decision Rate</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.decisionRatePerMin}</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">DECISIONS/MIN</span>
          </div>
          <div className="h-1 flex items-end gap-0.5 pt-1">
            {/* mock mini sparkline bar chart */}
            {[24, 30, 45, 12, 18, 30, 24, 36, 40, 50, 42, 38, 20, 28, 32].map((val, i) => (
              <div key={i} className="flex-1 bg-amber-500/25 hover:bg-amber-400 h-full" style={{ height: `${val}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Last Decision: {metrics.lastDecisionTime}</span>
            <span>Latency: 1.45ms</span>
          </div>
        </div>

        {/* Card 4: Operating metrics overview */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Queue Metrics</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-zinc-100">{tasks.filter(t => t.status !== 'COMPLETED').length}</span>
            <span className="text-[9px] font-mono text-yellow-500 uppercase font-bold">RUNNING</span>
          </div>
          {/* text stats stack */}
          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-zinc-500 pt-1 border-t border-zinc-900/60">
            <div>PLUGINS: <span className="text-zinc-300 font-bold">{metrics.pluginCount} Active</span></div>
            <div>STATUS: <span className="text-emerald-400 font-bold">HEALTHY</span></div>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Priority Caps: ACTIVE</span>
            <span>Interrupts: v4.1</span>
          </div>
        </div>

      </div>

      {/* CORE ENGINES ORCHESTRATION TERMINAL */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/60 pb-3">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-500" />
              Engine Nodes Registry & Recovery Control
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">
              Allow restarting individual core engines independently without causing overall application interruption.
            </p>
          </div>
        </div>

        {/* Interactive Engine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {engines.map((eng) => {
            const isOnline = eng.status === 'ONLINE';
            const isRestarting = eng.status === 'RESTARTING';
            const isDegraded = eng.status === 'DEGRADED';

            return (
              <div 
                key={eng.id}
                className={`border rounded-lg p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                  isRestarting 
                    ? 'bg-amber-500/5 border-amber-500/30 animate-pulse'
                    : isOnline 
                    ? 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                {/* Header state */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-100 truncate pr-1" title={eng.name}>
                    {eng.name}
                  </span>
                  
                  {/* Status pills */}
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                    isOnline 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : isRestarting 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {eng.status}
                  </span>
                </div>

                {/* mini telemetry indicators */}
                <div className="space-y-1 text-[9px] font-mono text-zinc-500">
                  <div className="flex justify-between">
                    <span>Priority</span>
                    <span className="text-zinc-400 font-bold">{eng.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workers</span>
                    <span className="text-zinc-400 font-bold">{eng.threads} Thr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed</span>
                    <span className="text-zinc-300 font-bold">{eng.processedCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Control Action Area */}
                <div className="pt-2 border-t border-zinc-900/60 flex gap-1.5">
                  <button
                    onClick={() => handleRestartEngine(eng.id, eng.name)}
                    disabled={isRestarting}
                    className="flex-1 py-1 px-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-amber-400 disabled:opacity-50 text-[9px] font-mono rounded flex items-center justify-center gap-1 cursor-pointer transition-all border border-zinc-850"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRestarting ? 'animate-spin' : ''}`} />
                    RESTART
                  </button>
                  <button
                    onClick={() => handleToggleEngine(eng.id, eng.status)}
                    className="p-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-red-400 text-[9px] rounded cursor-pointer transition-all border border-zinc-850"
                    title={isOnline ? 'Force Disable Engine' : 'Enable Engine'}
                  >
                    OFF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TASK QUEUE SCHEDULER & BACKGROUND JOBS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Task Priority Queue Manager (Left: 7/12 cols) */}
        <div className="lg:col-span-7 bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
                Priority Task Queue Scheduler
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">
                AQ OS prioritizes high interrupt cycles and allocates runtime execution queues.
              </p>
            </div>
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
              ACTIVE PRIORITY QUEUE
            </span>
          </div>

          {/* Form to enqueue task manually */}
          <form onSubmit={handleEnqueueTask} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
            <input
              type="text"
              value={customTaskName}
              onChange={(e) => setCustomTaskName(e.target.value)}
              placeholder="Custom Task Name (e.g. Audit Spanner Logs)"
              className="sm:col-span-2 bg-zinc-900 border border-zinc-850 rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50 uppercase placeholder-zinc-600"
            />
            <select
              value={customTaskEngine}
              onChange={(e) => setCustomTaskEngine(e.target.value as EngineId)}
              className="bg-zinc-900 border border-zinc-850 rounded px-1.5 py-1 text-xs font-mono text-zinc-400 focus:outline-none"
            >
              {engines.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-[10px] rounded py-1 px-2.5 uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-black" strokeWidth={3} /> Enqueue
            </button>
          </form>

          {/* Task table / list */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="bg-zinc-950 border border-zinc-900 p-2 rounded flex items-center justify-between text-[11px] font-mono"
              >
                <div className="flex items-center gap-2">
                  {/* Priority Indicators */}
                  <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wide ${
                    task.priority === 'IMMEDIATE' 
                      ? 'bg-red-500 text-white' 
                      : task.priority === 'CRITICAL' 
                      ? 'bg-amber-600 text-black' 
                      : task.priority === 'NORMAL' 
                      ? 'bg-zinc-800 text-zinc-400' 
                      : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {task.priority}
                  </span>
                  
                  <span className="text-zinc-200 font-bold uppercase">{task.name}</span>
                  <span className="text-[10px] text-zinc-500">&mdash; target: {task.targetEngine}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-zinc-600">{task.payloadSizeKb} kb</span>
                  
                  {/* Task Status badge */}
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : task.status === 'PROCESSING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {task.status}
                  </span>

                  {task.executionTimeMs && (
                    <span className="text-[9px] text-zinc-500 font-mono font-bold text-amber-500">{task.executionTimeMs}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Jobs Controller (Right: 5/12 cols) */}
        <div className="lg:col-span-5 bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
                OS Background Cron Jobs
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">
                Cyclic automated routines managed independently of thread stacks.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {backgroundJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex flex-col justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200 font-bold uppercase tracking-wide">{job.name}</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded uppercase font-bold">
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <div>Cycles: <span className="text-zinc-300 font-bold">{job.executionCount.toLocaleString()}</span></div>
                  <div>Period: <span className="text-zinc-300 font-bold">{job.intervalMs}ms</span></div>
                  <div>Next: <span className="text-amber-500 font-bold">{job.nextRunTime}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SYSTEM TIMELINE IN CHRONOLOGICAL SEQUENCE */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/60 pb-3">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Unified OS Chronological System Timeline
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">
              Sequenced tracking of scheduling, engine switches, safety checks, and queue recovery mechanisms.
            </p>
          </div>

          {/* Timeline filter category */}
          <div className="flex flex-wrap gap-1">
            {['ALL', 'SYSTEM', 'ENGINE', 'SECURITY', 'COMMUNICATION', 'QUEUE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase cursor-pointer transition-all ${
                  filterCategory === cat 
                    ? 'bg-amber-500 text-black font-bold' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Stack Container */}
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
          {filteredTimeline.length > 0 ? (
            filteredTimeline.map((ev) => {
              const isCrit = ev.severity === 'CRITICAL';
              const isWarn = ev.severity === 'WARNING';
              const isSucc = ev.severity === 'SUCCESS';

              return (
                <div 
                  key={ev.id}
                  className={`p-3 rounded border text-[11px] font-mono flex items-start gap-3 relative transition-all ${
                    isCrit 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : isWarn 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : isSucc 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-zinc-950 border-zinc-900'
                  }`}
                >
                  {/* Status Indicator circle */}
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : isSucc ? 'bg-emerald-400' : 'bg-zinc-600'
                  }`} />

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] font-bold text-amber-500/80 uppercase">
                        [{ev.category}]
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase font-serif">
                        source: {ev.source}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-serif leading-relaxed uppercase tracking-wide">
                      {ev.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-zinc-600 font-mono text-xs uppercase">
              No system timeline events found matching the selected filter query.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
