import React, { useState, useEffect } from 'react';
import { 
  Zap, Cpu, CheckCircle2, AlertTriangle, Clock, Play, ArrowRight,
  Database, Activity, Layers, Sliders, CheckSquare, Shield,
  MessageSquare, Brain, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { engineIntegrationLayer, PipelineRunState, IntegratedEngineStage } from '../plugins/engineIntegrationLayer';

interface EngineFlowMonitorProps {
  addLog: (log: string) => void;
}

export default function EngineFlowMonitor({ addLog }: EngineFlowMonitorProps) {
  const [pipelineState, setPipelineState] = useState<PipelineRunState>(() => engineIntegrationLayer.getState());
  const [selectedStageId, setSelectedStageId] = useState<string>('market-data');
  const [marketPreset, setMarketPreset] = useState<'Bullish' | 'Bearish' | 'Sideways' | 'Extreme'>('Bullish');
  const [symbol, setSymbol] = useState('XAU/USD');
  const [timeframe, setTimeframe] = useState('15M');

  useEffect(() => {
    const unsubscribe = engineIntegrationLayer.subscribe((state) => {
      setPipelineState(state);
    });
    return () => unsubscribe();
  }, []);

  const selectedStage = pipelineState.stages.find(s => s.id === selectedStageId) || pipelineState.stages[0];

  const handleRunPipeline = async () => {
    if (pipelineState.status === 'RUNNING') return;
    
    // Add logs
    addLog(`SYS: Triggering live v6.1 Engine Integration Layer sweep on ${symbol} [${timeframe}] using [${marketPreset}] preset.`);
    
    await engineIntegrationLayer.executePipeline(
      symbol,
      timeframe,
      marketPreset,
      {}, // default rule toggles
      addLog
    );
  };

  const getStatusIcon = (status: IntegratedEngineStage['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'PROCESSING':
        return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'SKIPPED':
        return <Clock className="w-4 h-4 text-zinc-600" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-zinc-800" />;
    }
  };

  const getStatusBadgeClass = (status: IntegratedEngineStage['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PROCESSING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'SKIPPED':
        return 'bg-zinc-900 text-zinc-500 border-zinc-800';
      default:
        return 'bg-zinc-950 text-zinc-600 border-zinc-900';
    }
  };

  const getEngineIcon = (id: string) => {
    switch (id) {
      case 'market-data':
        return <Database className="w-3.5 h-3.5" />;
      case 'indicator-engine':
        return <Activity className="w-3.5 h-3.5" />;
      case 'market-structure':
        return <Layers className="w-3.5 h-3.5" />;
      case 'market-intelligence':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'strategy-engine':
        return <Sliders className="w-3.5 h-3.5" />;
      case 'rule-engine':
        return <CheckSquare className="w-3.5 h-3.5" />;
      case 'guardian':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'ai-debate':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      case 'second-opinion':
        return <Brain className="w-3.5 h-3.5 text-rose-400" />;
      case 'decision-engine':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'validation':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'decision-ledger':
        return <FileText className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Block */}
      <div id="flow-monitor-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/2 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
              Version 6.1 Engine Layer
            </span>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
              THREAD-SAFE CENTRAL PIPELINE
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Cpu className="w-5.5 h-5.5 text-amber-500" />
            AQ Core Engine Flow Monitor
          </h2>
          <p className="text-xs font-serif text-zinc-400 max-w-2xl leading-relaxed">
            Monitor, control, and audit the complete 12-engine decision pipeline in real-time. Every logical engine consumes outputs from the previous layer directly with zero computation duplicates.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={pipelineState.status === 'RUNNING'}
            className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50"
          >
            <option value="XAU/USD">XAU/USD</option>
            <option value="BTC/USD">BTC/USD</option>
            <option value="ETH/USD">ETH/USD</option>
            <option value="SOL/USD">SOL/USD</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            disabled={pipelineState.status === 'RUNNING'}
            className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50"
          >
            <option value="15M">15M</option>
            <option value="1H">1H</option>
            <option value="4H">4H</option>
          </select>

          <select
            value={marketPreset}
            onChange={(e) => setMarketPreset(e.target.value as any)}
            disabled={pipelineState.status === 'RUNNING'}
            className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50"
          >
            <option value="Bullish">Bullish Preset</option>
            <option value="Bearish">Bearish Preset</option>
            <option value="Sideways">Sideways Preset</option>
            <option value="Extreme">Extreme Volatility</option>
          </select>

          <button
            onClick={handleRunPipeline}
            disabled={pipelineState.status === 'RUNNING'}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-black font-mono font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] h-[34px]"
          >
            <Play className={`w-4 h-4 text-black ${pipelineState.status === 'RUNNING' ? 'animate-spin' : ''}`} />
            {pipelineState.status === 'RUNNING' ? 'Running Layer Sweep...' : 'Trigger Sweep'}
          </button>
        </div>
      </div>

      {/* Global Telemetry Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1 relative overflow-hidden">
          <div className="absolute right-2 top-2 text-zinc-800"><Cpu className="w-8 h-8" /></div>
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">Active Run Context</span>
          <span className="text-sm font-mono font-bold text-zinc-100 block">{pipelineState.runId}</span>
          <span className="text-[8px] font-mono text-zinc-600 block">{pipelineState.timestamp}</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1 relative overflow-hidden">
          <div className="absolute right-2 top-2 text-zinc-800"><Clock className="w-8 h-8" /></div>
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">Overall processing speed</span>
          <span className="text-sm font-mono font-bold text-amber-400 block">{pipelineState.overallProcessingTimeMs} ms</span>
          <span className="text-[8px] font-mono text-zinc-600 block">12 engines combined latency</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1 relative overflow-hidden">
          <div className="absolute right-2 top-2 text-zinc-800"><Zap className="w-8 h-8" /></div>
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">Overall pipeline status</span>
          <span className={`text-sm font-mono font-bold block ${
            pipelineState.status === 'SUCCESS' ? 'text-emerald-400' : pipelineState.status === 'RUNNING' ? 'text-amber-400 animate-pulse' : 'text-red-400'
          }`}>{pipelineState.status}</span>
          <span className="text-[8px] font-mono text-zinc-600 block">System state synchronization</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1 relative overflow-hidden">
          <div className="absolute right-2 top-2 text-zinc-800"><Brain className="w-8 h-8" /></div>
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">Average core confidence</span>
          <span className="text-sm font-mono font-bold text-zinc-100 block">{pipelineState.overallConfidence}%</span>
          <span className="text-[8px] font-mono text-zinc-600 block">Consensus confidence index</span>
        </div>
      </div>

      {/* Main Split: 12-Stage Timeline Flow vs Deep Engine Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: 12-Stage Visual Stack Map */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
              Sequential Logical Pipelines
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">
              Click any processing block to inspect exact inputs, outputs and errors.
            </p>
          </div>

          <div className="space-y-2">
            {pipelineState.stages.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;
              const isProcessing = stage.status === 'PROCESSING';

              return (
                <div key={stage.id} className="relative">
                  {/* Connection pipe line linking nodes */}
                  {idx > 0 && (
                    <div className="absolute -top-2 left-6 h-2 w-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900" />
                  )}

                  <div
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`border p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden ${
                      isSelected 
                        ? 'bg-[#121216] border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.06)]' 
                        : 'bg-[#09090b] border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-zinc-500 shrink-0">{getEngineIcon(stage.id)}</span>
                        <div className="space-y-0.5 truncate">
                          <h4 className={`text-[11px] font-mono font-bold uppercase truncate ${
                            isSelected ? 'text-amber-400' : 'text-zinc-200'
                          }`}>
                            {stage.name}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Stage Telemetry Stats mini */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">
                        {stage.processingTimeMs}ms
                      </span>
                      <span className="text-[9px] font-mono text-amber-500/80 font-bold hidden sm:inline">
                        {stage.confidence > 0 ? `${stage.confidence}%` : '--'}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded tracking-wide ${getStatusBadgeClass(stage.status)}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Deep Payload & Error Monitor Inspector */}
        <div className="lg:col-span-7 bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header detail info */}
            <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-amber-500 font-bold uppercase block tracking-widest">
                  STAGE DEEP PAYLOAD MONITORING
                </span>
                <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase mt-0.5 flex items-center gap-1.5">
                  {getEngineIcon(selectedStage.id)}
                  {selectedStage.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  Latency: <strong className="text-zinc-200">{selectedStage.processingTimeMs}ms</strong>
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Conf: <strong className="text-amber-500">{selectedStage.confidence}%</strong>
                </span>
              </div>
            </div>

            {/* Error banner block */}
            {selectedStage.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-red-400 font-bold block uppercase tracking-wider">
                    Execution Exception Alert
                  </span>
                  <p className="text-xs font-mono text-red-300 leading-normal">
                    {selectedStage.error}
                  </p>
                </div>
              </div>
            )}

            {/* Grid for Inputs and Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Input section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                    INJECTED INPUT PARAMETERS
                  </span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">Consumed state</span>
                </div>
                <pre className="bg-[#030304] text-[9px] font-mono text-zinc-300 p-3 rounded-lg border border-zinc-900 max-h-[300px] overflow-auto leading-relaxed">
                  {selectedStage.input}
                </pre>
              </div>

              {/* Output section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider block font-bold">
                    SERIALIZED ENGINE OUTPUTS
                  </span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">Synthesized block</span>
                </div>
                <pre className="bg-[#030304] text-[9px] font-mono text-amber-400/80 p-3 rounded-lg border border-zinc-900 max-h-[300px] overflow-auto leading-relaxed">
                  {selectedStage.output}
                </pre>
              </div>

            </div>

          </div>

          {/* Verification badge */}
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 text-[10px] font-mono text-zinc-500 flex justify-between items-center uppercase leading-none">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              INTEGRATION LAYER: AQ-V6.1 LOCK-FREE RECALCULATION
            </span>
            <span className="text-[8px] text-zinc-600 font-bold">Verified Strata-1</span>
          </div>

        </div>

      </div>

    </div>
  );
}
