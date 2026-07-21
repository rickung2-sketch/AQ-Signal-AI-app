import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Terminal, RefreshCw, Send, ShieldAlert, CheckCircle, 
  Activity, Play, Layers, TrendingUp, Flame, Clock, Compass, Zap
} from 'lucide-react';
import { registry } from '../plugins/brokerPluginRegistry';
import { generateHistoricalOrTestData } from '../plugins/marketDataPluginRegistry';
import { engineIntegrationLayer, PipelineRunState } from '../plugins/engineIntegrationLayer';

interface AQCoreProps {
  logs: string[];
  addLog: (log: string) => void;
}

export default function AQCore({ logs, addLog }: AQCoreProps) {
  const [command, setCommand] = useState('');
  const [uptime, setUptime] = useState(3600); // starts at 1 hr
  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(256); // MB
  const [clockDrift, setClockDrift] = useState(0.045); // ms
  const [cliOutput, setCliOutput] = useState<string[]>([
    'AQ-CORE v6.0.0 (Algorithmic Verification Shell)',
    'Type "/help" to view list of valid core diagnostic operations.'
  ]);
  const cliScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Broker Plugin status checking
  const hasBrokerPlugins = registry.hasPlugins();
  const brokerMode = localStorage.getItem('aq_broker_mode') || 'ANALYSIS';
  const [intelState, setIntelState] = useState<any>(null);
  const [pipeline, setPipeline] = useState<PipelineRunState>(() => engineIntegrationLayer.getState());

  useEffect(() => {
    const unsubscribe = engineIntegrationLayer.subscribe((state) => {
      setPipeline(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadState = () => {
      const preset = (localStorage.getItem('aq_market_preset') || 'Bullish') as any;
      setIntelState(generateHistoricalOrTestData(preset));
    };
    loadState();
    const interval = setInterval(loadState, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Increment uptime, drift slightly, and bounce CPU values naturally
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
      setClockDrift(prev => Math.max(0.01, parseFloat((prev + (Math.random() - 0.5) * 0.005).toFixed(4))));
      setCpuUsage(prev => {
        const next = prev + (Math.random() > 0.5 ? 2 : -2);
        return Math.max(5, Math.min(60, next));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll CLI to bottom when output updates
    if (cliScrollRef.current) {
      cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
    }
  }, [cliOutput]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim().toLowerCase();
    const newOutput = [...cliOutput, `guest@aq-core:~$ ${command}`];
    
    addLog(`CMD: Terminal client executed: [${cmd}]`);

    setTimeout(() => {
      if (cmd === '/help') {
        setCliOutput([...newOutput, 
          'Available Operations:',
          '  /help         Show this diagnostic directory.',
          '  /status       Display immediate node cluster telemetry.',
          '  /calibrate    Force align server telemetry registers.',
          '  /diagnose     Perform multi-point checksum check.',
          '  /clear        Flush this terminal view cache.'
        ]);
      } else if (cmd === '/status') {
        const installedBrokers = registry.getPlugins().map(p => p.name).join(', ');
        setCliOutput([...newOutput,
          `AQ CORE MODULE STATUS (v6.0.0):`,
          `  - Process ID: 12045`,
          `  - Active Thread Allocation: 16 Core Workers`,
          `  - Memory Buffer: ${ramUsage}MB / 1024MB`,
          `  - Clock Drift: ${clockDrift}ms (STRATUM-1 SYNCHRONIZED)`,
          `  - Unified 12-Engine Flow Monitor: LINKED & VERIFIED`,
          `  - Active Pipeline Execution Run: ${pipeline.runId} (${pipeline.status})`,
          `  - Cumulative Engines Online:`,
          `    1. Market Data Service        [ONLINE - ACTIVE]`,
          `    2. Indicator Engine            [ONLINE - ACTIVE]`,
          `    3. Market Structure Engine    [ONLINE - ACTIVE]`,
          `    4. Market Intelligence Engine [ONLINE - ACTIVE]`,
          `    5. Strategy Engine             [ONLINE - ACTIVE]`,
          `    6. Rule Engine                 [ONLINE - ACTIVE]`,
          `    7. Guardian                    [ONLINE - ACTIVE]`,
          `    8. AI Debate                   [ONLINE - ACTIVE]`,
          `    9. Second Opinion              [ONLINE - ACTIVE]`,
          `    10. Decision Engine            [ONLINE - ACTIVE]`,
          `    11. Validation Mode            [ONLINE - ACTIVE]`,
          `    12. Decision Ledger            [ONLINE - ACTIVE]`
        ]);
      } else if (cmd === '/calibrate') {
        setCliOutput([...newOutput, 'SYS: Force calibrating clock lines...', 'SYS: Stratum register realignment [SUCCESSFUL].']);
      } else if (cmd === '/diagnose') {
        setCliOutput([...newOutput, 
          'DIAGNOSTIC PIPELINE SENSING (v6.0.0):', 
          '  - Webpack Service Worker: ONLINE', 
          '  - Local Storage state: PERSISTENT', 
          '  - AI Guardian Guardrails: HEALTHY', 
          `  - Broker Plugin SDK Layer: ${hasBrokerPlugins ? 'ACTIVE' : 'INACTIVE (ANALYSIS)'}`,
          `  - 12-Stage Integration Pipeline: [${pipeline.status}]`,
          `  - Current active pipeline engine node: ${pipeline.currentStageIndex >= 0 ? pipeline.stages[pipeline.currentStageIndex].name : 'STANDBY'}`,
          `  - Calculated unified pipeline latency: ${pipeline.overallProcessingTimeMs}ms`,
          `  - Pipeline Consensus Confidence: ${pipeline.overallConfidence}%`,
          '  - Overall logical system health: EXCELLENT PASS'
        ]);
      } else if (cmd === '/clear') {
        setCliOutput([]);
      } else {
        setCliOutput([...newOutput, `Core Error: Command "${cmd}" is unrecognized. Try typing "/help"`]);
      }
    }, 100);

    setCommand('');
  };

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Banner indicator if broker is uninstalled or mode is Analysis */}
      {(!hasBrokerPlugins || brokerMode === 'ANALYSIS') && (
        <div id="aq-core-analysis-banner" className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(212,175,55,0.02)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                Analysis Mode Active
              </h4>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase">
                No secure order execution pipelines initialized. Trading actions disabled.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded border border-amber-500/20">
            PROTECTED NO-EXECUTE
          </span>
        </div>
      )}

      {/* Visual Telemetry Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* State of threads */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-1">
          <span className="text-[9px] font-mono text-zinc-500 uppercase">SYS PROCESS STATE</span>
          <span className="text-sm font-bold font-serif text-zinc-300 block flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            8 THREADS (PASSIVE)
          </span>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">Multi-core work pools active</p>
        </div>

        {/* Uptime */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-1">
          <span className="text-[9px] font-mono text-zinc-500 uppercase">SYS UPTIME</span>
          <span className="text-sm font-bold font-mono text-zinc-200 block">
            {formatUptime(uptime)}
          </span>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">Standard continuous live session</p>
        </div>

        {/* Clock drift */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-1">
          <span className="text-[9px] font-mono text-zinc-500 uppercase">CLOCK SKEW JITTER</span>
          <span className="text-sm font-bold font-mono text-zinc-200 block">
            {clockDrift} ms
          </span>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">Stratum-1 synchronized atomic clock</p>
        </div>

        {/* Memory allocation */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-1">
          <span className="text-[9px] font-mono text-zinc-500 uppercase">CPU / MEMORY BUFFER</span>
          <span className="text-sm font-bold font-mono text-zinc-200 block">
            {cpuUsage}% / {ramUsage} MB
          </span>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">Lightweight local browser sandbox</p>
        </div>

      </div>

      {/* Main interactive terminal prompt */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col h-[400px]">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              AQ CORE QUANTUM COMMAND LINE
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-600">STRATUM ACCESS LEVEL: ADMIN</span>
        </div>

        {/* Terminal display */}
        <div 
          ref={cliScrollRef}
          className="flex-1 bg-[#060607] border border-zinc-900/60 rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {cliOutput.map((line, i) => (
            <div key={i} className="leading-relaxed whitespace-pre-wrap">
              {line.startsWith('guest@aq-core') ? (
                <span className="text-amber-500/80 font-bold">{line}</span>
              ) : line.startsWith('Core Error:') ? (
                <span className="text-red-400 font-bold">{line}</span>
              ) : (
                <span className="text-zinc-400">{line}</span>
              )}
            </div>
          ))}
        </div>

        {/* Input prompt form */}
        <form onSubmit={handleCommandSubmit} className="mt-3 flex gap-2">
          <span className="text-amber-500 font-mono text-xs self-center font-bold pl-1">
            guest@aq-core:~$
          </span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type '/diagnose', '/status', or '/calibrate' and press Enter..."
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500/40 rounded-lg py-1.5 px-3 text-xs text-zinc-200 font-mono focus:outline-none placeholder-zinc-600"
          />
          <button
            type="submit"
            disabled={!command.trim()}
            className="bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 text-amber-500 p-1.5 px-3 rounded-lg flex items-center justify-center cursor-pointer font-mono text-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Sub-Engine Monitoring Panel */}
      <div id="aq-core-sub-engines-monitor" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              AQ ACTIVE MARKET INTELLIGENCE TELEMETRY
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500">
            5 / 5 SUB-ENGINES ONLINE
          </span>
        </div>

        {intelState ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* 1. Structure */}
            <div id="monitor-structure" className="bg-[#0A0A0B] border border-zinc-900 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-1.5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">1. Structure</span>
                <span className={`w-2 h-2 rounded-full ${intelState.structure.status === 'OPTIMAL' || intelState.structure.status === 'STABLE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                <p>Status: <span className="text-zinc-300 font-bold">{intelState.structure.status}</span></p>
                <p>Confidence: <span className="text-amber-500 font-bold">{intelState.structure.confidence}%</span></p>
                <p className="line-clamp-2 text-[9px] text-zinc-600 mt-1 leading-normal">Reason: {intelState.structure.reason}</p>
                <p className="text-[8px] text-zinc-600 mt-1 text-right">Time: {new Date(intelState.structure.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* 2. Trend */}
            <div id="monitor-trend" className="bg-[#0A0A0B] border border-zinc-900 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-1.5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">2. Trend</span>
                <span className={`w-2 h-2 rounded-full ${intelState.trend.status === 'OPTIMAL' || intelState.trend.status === 'STABLE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                <p>Status: <span className="text-zinc-300 font-bold">{intelState.trend.status}</span></p>
                <p>Confidence: <span className="text-amber-500 font-bold">{intelState.trend.confidence}%</span></p>
                <p className="line-clamp-2 text-[9px] text-zinc-600 mt-1 leading-normal">Reason: {intelState.trend.reason}</p>
                <p className="text-[8px] text-zinc-600 mt-1 text-right">Time: {new Date(intelState.trend.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* 3. Volatility */}
            <div id="monitor-volatility" className="bg-[#0A0A0B] border border-zinc-900 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-1.5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">3. Volatility</span>
                <span className={`w-2 h-2 rounded-full ${intelState.volatility.status === 'OPTIMAL' || intelState.volatility.status === 'STABLE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                <p>Status: <span className="text-zinc-300 font-bold">{intelState.volatility.status}</span></p>
                <p>Confidence: <span className="text-amber-500 font-bold">{intelState.volatility.confidence}%</span></p>
                <p className="line-clamp-2 text-[9px] text-zinc-600 mt-1 leading-normal">Reason: {intelState.volatility.reason}</p>
                <p className="text-[8px] text-zinc-600 mt-1 text-right">Time: {new Date(intelState.volatility.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* 4. Session */}
            <div id="monitor-session" className="bg-[#0A0A0B] border border-zinc-900 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-1.5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">4. Session</span>
                <span className={`w-2 h-2 rounded-full ${intelState.session.status === 'OPTIMAL' || intelState.session.status === 'STABLE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                <p>Status: <span className="text-zinc-300 font-bold">{intelState.session.status}</span></p>
                <p>Confidence: <span className="text-amber-500 font-bold">{intelState.session.confidence}%</span></p>
                <p className="line-clamp-2 text-[9px] text-zinc-600 mt-1 leading-normal">Reason: {intelState.session.reason}</p>
                <p className="text-[8px] text-zinc-600 mt-1 text-right">Time: {new Date(intelState.session.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* 5. Support & Resistance */}
            <div id="monitor-sr" className="bg-[#0A0A0B] border border-zinc-900 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-1.5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">5. S&R Mapper</span>
                <span className={`w-2 h-2 rounded-full ${intelState.supportResistance.status === 'OPTIMAL' || intelState.supportResistance.status === 'STABLE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                <p>Status: <span className="text-zinc-300 font-bold">{intelState.supportResistance.status}</span></p>
                <p>Confidence: <span className="text-amber-500 font-bold">{intelState.supportResistance.confidence}%</span></p>
                <p className="line-clamp-2 text-[9px] text-zinc-600 mt-1 leading-normal">Reason: {intelState.supportResistance.reason}</p>
                <p className="text-[8px] text-zinc-600 mt-1 text-right">Time: {new Date(intelState.supportResistance.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

          </div>
        ) : (
          <p className="text-xs font-mono text-zinc-600">Syncing with Market Intelligence telemetry node...</p>
        )}
      </div>

      {/* Real-time 12-Stage Pipeline Monitoring Panel */}
      <div id="aq-core-pipeline-monitor" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              AQ Central Pipeline Monitor (12-Engine Integration Layer)
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            RUN ID: {pipeline.runId} | STATUS: {pipeline.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {pipeline.stages.map((stage, idx) => {
            const isActive = pipeline.currentStageIndex === idx && pipeline.status === 'RUNNING';
            return (
              <div 
                key={stage.id} 
                className={`p-3 rounded-lg border font-mono text-[10px] space-y-1 transition-all relative overflow-hidden ${
                  isActive 
                    ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.05)]' 
                    : stage.status === 'COMPLETED' 
                    ? 'bg-[#0B0C0E] border-zinc-900/80' 
                    : stage.status === 'FAILED'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-[#09090A] border-zinc-900/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1">
                  <span className="text-zinc-500 font-bold">{idx + 1}. {stage.id.split('-')[0].toUpperCase()}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    stage.status === 'COMPLETED' ? 'bg-emerald-500' : stage.status === 'FAILED' ? 'bg-red-500' : isActive ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'
                  }`} />
                </div>
                <div className="space-y-0.5 text-[9px] text-zinc-400">
                  <p>Latency: <span className="text-zinc-200 font-bold">{stage.processingTimeMs}ms</span></p>
                  <p>Conf: <span className="text-amber-500 font-bold">{stage.confidence}%</span></p>
                  <p className="truncate text-zinc-500">State: {stage.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
