import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle2, PlayCircle, ShieldCheck, AlertTriangle, 
  HelpCircle, Info, ChevronRight, Zap, RefreshCw, Cpu, Database, 
  Layers, Sliders, MessageSquare, Brain, Eye, Search, Code, TrendingUp
} from 'lucide-react';
import { PipelineExecution, PipelineStage, StageId, StageStatus } from '../types/pipeline';

interface PipelineInspectorProps {
  addLog: (log: string) => void;
}

const DEFAULT_EXECUTIONS: PipelineExecution[] = [
  {
    id: 'exec-8401',
    timestamp: 'Just now',
    asset: 'XAU/USD',
    direction: 'LONG',
    overallConfidencePercent: 88,
    status: 'SUCCESS',
    stages: [
      {
        id: 'market-data',
        name: 'Market Data',
        status: 'COMPLETED',
        executionTimeMs: 14,
        confidencePercent: 99,
        resultSummary: 'Spread: 0.01% | Volume Spike: +18%',
        inspectDetails: {
          title: 'Market Data Sourcing Core',
          description: 'Ingests high-frequency tick data, orderbook depth spreads, and regional liquidations.',
          technicalOutput: JSON.stringify({
            ticker: 'XAU/USD',
            bid: 2420.1,
            ask: 2420.3,
            spread: 0.2,
            liquidityDepth: '28.4M USD within 1%',
            historicalVol30d: '42.5%'
          }, null, 2),
          metrics: [
            { label: 'Ticks Processed', value: '14,500/sec' },
            { label: 'Latency Check', value: '1.2ms' },
            { label: 'Source Integrity', value: '99.8%' }
          ]
        }
      },
      {
        id: 'market-intelligence',
        name: 'Market Intelligence',
        status: 'COMPLETED',
        executionTimeMs: 42,
        confidencePercent: 85,
        resultSummary: 'Multi-Timeframe Trend Bullish Alignment',
        inspectDetails: {
          title: 'Market Intelligence Aggregator',
          description: 'Calculates global correlation metrics, funding-rate pressure, and order flow imbalance.',
          technicalOutput: JSON.stringify({
            trendBias: 'BULLISH',
            fundingRate: '+0.012%',
            orderFlowImbalance: '+12.4%',
            rsi_1h: 58.2,
            macdBias: 'POS_HIST'
          }, null, 2),
          metrics: [
            { label: 'Calculated Indicators', value: 18 },
            { label: 'Funding Rate Bias', value: 'Moderate Long' },
            { label: 'Volume Profile', value: 'High Value Node' }
          ]
        }
      },
      {
        id: 'strategy-engine',
        name: 'Strategy Engine',
        status: 'COMPLETED',
        executionTimeMs: 22,
        confidencePercent: 90,
        resultSummary: 'Alpha Momentum Breakout Rules Triggered',
        inspectDetails: {
          title: 'Algorithmic Strategy Selector',
          description: 'Validates current market structure against registered active strategy templates.',
          technicalOutput: JSON.stringify({
            activeStrategy: 'Alpha Momentum Breakout (v3.3)',
            timeframeAlignment: '1H & 15M MATCH',
            supportLevel: 91800,
            resistanceLevel: 92400,
            breakoutConfirmed: true
          }, null, 2),
          metrics: [
            { label: 'Matched Strategies', value: '1 / 3 Active' },
            { label: 'Timeframe Match', value: 'TRUE' },
            { label: 'R:R Estimated', value: '3.1 R' }
          ]
        }
      },
      {
        id: 'rule-engine',
        name: 'Rule Engine',
        status: 'COMPLETED',
        executionTimeMs: 8,
        confidencePercent: 95,
        resultSummary: 'EMA 200 & Structure Bounds Match',
        inspectDetails: {
          title: 'Dynamic Rule Validation Node',
          description: 'Evaluates logical Boolean condition chains and critical threshold tolerances.',
          technicalOutput: JSON.stringify({
            rulesEvaluated: 12,
            rulesPassed: 12,
            rule_ema_200: 'PASSED (Price 92451 > EMA 91200)',
            rule_structure_low: 'PASSED (Stop Loss at Structure)',
            risk_reward_ok: 'PASSED'
          }, null, 2),
          metrics: [
            { label: 'Rules Processed', value: 12 },
            { label: 'Pass Ratio', value: '100%' },
            { label: 'Fails Triggered', value: 0 }
          ]
        }
      },
      {
        id: 'guardian',
        name: 'Guardian',
        status: 'COMPLETED',
        executionTimeMs: 18,
        confidencePercent: 98,
        resultSummary: 'Drawdown Caps & Maximum Size OK',
        inspectDetails: {
          title: 'AI Guardian Risk Gatekeeper',
          description: 'Enforces hard, mathematical drawdown caps, maximum trade size constraints, and circuit breaker handshakes.',
          technicalOutput: JSON.stringify({
            maxRiskPerTradePercent: 1.5,
            calculatedSizeBTC: 0.12,
            dailyDrawdownPercent: 0.4,
            maxOpenPositions: 3,
            circuitBreakerArmed: true
          }, null, 2),
          metrics: [
            { label: 'Max Risk Limit', value: '1.50%' },
            { label: 'Current Open Count', value: 1 },
            { label: 'Hedge Status', value: 'UNHEDGED' }
          ]
        }
      },
      {
        id: 'ai-debate',
        name: 'AI Debate',
        status: 'COMPLETED',
        executionTimeMs: 110,
        confidencePercent: 82,
        resultSummary: 'Optimistic Agent Defeats Bearish Agent',
        inspectDetails: {
          title: 'Adversarial AI Multi-Agent Debate',
          description: 'Pits optimistic breakout subagents against conservative mean-reversion critics to find strategic flaws.',
          technicalOutput: JSON.stringify({
            agentA_Bullish: 'Recommends Entry. Breakthrough of key structural resistance with volume profile backing.',
            agentB_Bearish: 'Warns of liquidity trap. Liquidation pools at 92600 are thin.',
            moderatorConsensus: 'Proceed with Long. Structure high holds. Limit size appropriately.'
          }, null, 2),
          metrics: [
            { label: 'Debate Rounds', value: 2 },
            { label: 'Consensus Score', value: '8.4 / 10' },
            { label: 'Veto Threshold', value: 'None' }
          ]
        }
      },
      {
        id: 'second-opinion',
        name: 'Second Opinion',
        status: 'COMPLETED',
        executionTimeMs: 85,
        confidencePercent: 89,
        resultSummary: 'External Quantitative Nodes Confirmed',
        inspectDetails: {
          title: 'Federated Consensus Engine',
          description: 'Polls supplementary isolated quantitative heuristics for consensus safety.',
          technicalOutput: JSON.stringify({
            externalHeuristic_1: 'BULLISH (Orderbook Imbalance)',
            externalHeuristic_2: 'NEUTRAL (Funding Rate Convergence)',
            externalHeuristic_3: 'BULLISH (Global Liquidations Flow)',
            cumulativeAgreementRate: '86.7%'
          }, null, 2),
          metrics: [
            { label: 'Supplementary Nodes', value: 3 },
            { label: 'Agreement Rate', value: '86.7%' },
            { label: 'Anomalies Spotted', value: 0 }
          ]
        }
      },
      {
        id: 'decision-engine',
        name: 'Decision Engine',
        status: 'COMPLETED',
        executionTimeMs: 12,
        confidencePercent: 91,
        resultSummary: 'EXECUTE LONG Order Dispatched',
        inspectDetails: {
          title: 'AQ Ultimate Decision Decider',
          description: 'Amalgamates debaters, rule chains, and guardian metrics to emit the final actionable order state.',
          technicalOutput: JSON.stringify({
            action: 'EXECUTE LONG',
            ticker: 'XAU/USD',
            entryPriceLimit: 2420.10,
            targetTP: 2468.50,
            targetSL: 2395.90,
            executionPriority: 'IMMEDIATE'
          }, null, 2),
          metrics: [
            { label: 'Action Decision', value: 'LONG' },
            { label: 'Decision Score', value: '91 / 100' },
            { label: 'Interrupt Lock', value: 'ARMED' }
          ]
        }
      },
      {
        id: 'validation',
        name: 'Validation',
        status: 'COMPLETED',
        executionTimeMs: 30,
        confidencePercent: 86,
        resultSummary: 'Simulated Execution Vectors Tracking',
        inspectDetails: {
          title: 'Validation Mode Vector Simulator',
          description: 'Calculates baseline Maximum Favorable Excursion (MFE) and Adverse Excursion (MAE) risk parameters.',
          technicalOutput: JSON.stringify({
            validationActive: true,
            trackingMfeTarget: 95500.0,
            trackingMaeLimit: 91400.0,
            statisticalConfidence: '86%'
          }, null, 2),
          metrics: [
            { label: 'Validation Tracking', value: 'ACTIVE' },
            { label: 'Expected Max Win', value: '3.1 R' },
            { label: 'Expected Max Loss', value: '1.0 R' }
          ]
        }
      },
      {
        id: 'decision-ledger',
        name: 'Decision Ledger',
        status: 'COMPLETED',
        executionTimeMs: 10,
        confidencePercent: 100,
        resultSummary: 'State Persisted to Firestore and Memory',
        inspectDetails: {
          title: 'Durable Ledger Auditer',
          description: 'Durable serialization of decision logs, debater outputs, and risk sizes to the localized database system.',
          technicalOutput: JSON.stringify({
            serializedUuid: 'b75f-2c09-408a-df12-9214',
            timestamp: '2026-07-18T22:15:00Z',
            fileSizeKb: 14.5,
            persistenceStatus: 'SYNCED_CLOUD'
          }, null, 2),
          metrics: [
            { label: 'Record ID', value: 'b75f-2c09' },
            { label: 'Cloud Handshake', value: 'SUCCESS' },
            { label: 'Storage State', value: 'DURABLE' }
          ]
        }
      }
    ]
  },
  {
    id: 'exec-8402',
    timestamp: '2m ago',
    asset: 'ETH/USD',
    direction: 'HOLD',
    overallConfidencePercent: 45,
    status: 'BLOCKED',
    stages: [
      {
        id: 'market-data',
        name: 'Market Data',
        status: 'COMPLETED',
        executionTimeMs: 15,
        confidencePercent: 99,
        resultSummary: 'Spread: 0.04% | Spread OK',
        inspectDetails: {
          title: 'Market Data Sourcing Core',
          description: 'Ingests high-frequency tick data, orderbook depth spreads, and regional liquidations.',
          technicalOutput: JSON.stringify({ spread: 0.0004 }, null, 2),
          metrics: [{ label: 'Ticks', value: 4500 }]
        }
      },
      {
        id: 'market-intelligence',
        name: 'Market Intelligence',
        status: 'COMPLETED',
        executionTimeMs: 38,
        confidencePercent: 78,
        resultSummary: 'Sideways Volatility Squeeze',
        inspectDetails: {
          title: 'Market Intelligence Aggregator',
          description: 'Calculates global correlation metrics.',
          technicalOutput: JSON.stringify({ bias: 'CONSOLIDATION' }, null, 2),
          metrics: [{ label: 'Calculated Indicators', value: 8 }]
        }
      },
      {
        id: 'strategy-engine',
        name: 'Strategy Engine',
        status: 'COMPLETED',
        executionTimeMs: 18,
        confidencePercent: 55,
        resultSummary: 'No Match across Breakout rules',
        inspectDetails: {
          title: 'Strategy Engine',
          description: 'Strategy Rule evaluations.',
          technicalOutput: JSON.stringify({ matches: [] }, null, 2),
          metrics: [{ label: 'Matched', value: '0' }]
        }
      },
      {
        id: 'rule-engine',
        name: 'Rule Engine',
        status: 'FAILED',
        executionTimeMs: 12,
        confidencePercent: 0,
        resultSummary: 'Blocked: Session filter threshold mismatch',
        inspectDetails: {
          title: 'Rule Engine Failure Inspector',
          description: 'Rule Engine evaluation caught a structural veto.',
          technicalOutput: JSON.stringify({
            vetoRule: 'rule-session-filter',
            failureReason: 'Session overlap volume is lower than threshold parameters.'
          }, null, 2),
          metrics: [{ label: 'Passed', value: '0 / 1' }]
        }
      },
      { id: 'guardian', name: 'Guardian', status: 'SKIPPED', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Bypassed due to earlier failures', inspectDetails: { title: 'Skipped Stage', description: 'Skipped', technicalOutput: '{}', metrics: [] } },
      { id: 'ai-debate', name: 'AI Debate', status: 'SKIPPED', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Bypassed due to earlier failures', inspectDetails: { title: 'Skipped Stage', description: 'Skipped', technicalOutput: '{}', metrics: [] } },
      { id: 'second-opinion', name: 'Second Opinion', status: 'SKIPPED', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Bypassed due to earlier failures', inspectDetails: { title: 'Skipped Stage', description: 'Skipped', technicalOutput: '{}', metrics: [] } },
      { id: 'decision-engine', name: 'Decision Engine', status: 'COMPLETED', executionTimeMs: 5, confidencePercent: 100, resultSummary: 'EMITTED: HOLD STATE', inspectDetails: { title: 'Decision Node', description: 'Veto caught.', technicalOutput: '{"decision": "HOLD"}', metrics: [] } },
      { id: 'validation', name: 'Validation', status: 'SKIPPED', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Skipped', inspectDetails: { title: 'Skipped Stage', description: 'Skipped', technicalOutput: '{}', metrics: [] } },
      { id: 'decision-ledger', name: 'Decision Ledger', status: 'COMPLETED', executionTimeMs: 8, confidencePercent: 100, resultSummary: 'HOLD State persisted to registries', inspectDetails: { title: 'Ledger Audit', description: 'Logged hold', technicalOutput: '{"logged": true}', metrics: [] } }
    ]
  }
];

export default function PipelineInspector({ addLog }: PipelineInspectorProps) {
  const [executions, setExecutions] = useState<PipelineExecution[]>(() => {
    const saved = localStorage.getItem('aq_pipeline_executions_v41');
    return saved ? JSON.parse(saved) : DEFAULT_EXECUTIONS;
  });

  const [activeExecId, setActiveExecId] = useState<string>(executions[0]?.id || 'exec-8401');
  const [selectedStageId, setSelectedStageId] = useState<StageId>('market-data');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState<number>(-1);

  useEffect(() => {
    localStorage.setItem('aq_pipeline_executions_v41', JSON.stringify(executions));
  }, [executions]);

  const activeExec = executions.find(e => e.id === activeExecId) || executions[0];
  const activeStage = activeExec?.stages.find(s => s.id === selectedStageId) || activeExec?.stages[0];

  const triggerLog = (msg: string) => {
    addLog(`PIPELINE: ${msg}`);
  };

  // Run dynamic pipeline simulation
  const handleTriggerSimulation = () => {
    if (isSimulating) return;

    triggerLog('Initiated live decision pipeline execution sweep...');
    setIsSimulating(true);
    setSimulationIndex(0);

    const newExecId = `exec-${Math.floor(Math.random() * 9000) + 1000}`;
    const directionChance = Math.random();
    const isLong = directionChance > 0.45;
    const isShort = directionChance > 0.15 && directionChance <= 0.45;
    const direction = isLong ? 'LONG' : isShort ? 'SHORT' : 'HOLD';

    const newExec: PipelineExecution = {
      id: newExecId,
      timestamp: 'Simulating...',
      asset: Math.random() > 0.5 ? 'SOL/USD' : 'ETH/USD',
      direction,
      overallConfidencePercent: direction === 'HOLD' ? 32 : Math.floor(Math.random() * 25) + 70,
      status: 'PROCESSING',
      stages: [
        { id: 'market-data', name: 'Market Data', status: 'PROCESSING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Awaiting feed...', inspectDetails: { title: 'Market Data Core', description: 'Ingesting feeds', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'market-intelligence', name: 'Market Intelligence', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Market Intelligence Core', description: 'Analyzing trend', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'strategy-engine', name: 'Strategy Engine', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Strategy Engine Selection', description: 'Aligning templates', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'rule-engine', name: 'Rule Engine', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Rule Engine', description: 'Assessing logic triggers', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'guardian', name: 'Guardian', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Guardian Engine', description: 'Risk size compliance limits', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'ai-debate', name: 'AI Debate', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'AI Adversarial Debate', description: 'Subagents trade off arguments', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'second-opinion', name: 'Second Opinion', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Second Opinion Federated Consensus', description: 'External node feedback', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'decision-engine', name: 'Decision Engine', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Ultimate Decision Engine', description: 'Consolidation nodes', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'validation', name: 'Validation', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Validation Modes Tracker', description: 'Maximum Excursion predictions', technicalOutput: 'Pending...', metrics: [] } },
        { id: 'decision-ledger', name: 'Decision Ledger', status: 'PENDING', executionTimeMs: 0, confidencePercent: 0, resultSummary: 'Queued', inspectDetails: { title: 'Durable Ledger Logging', description: 'Cloud sync', technicalOutput: 'Pending...', metrics: [] } },
      ]
    };

    setExecutions(prev => [newExec, ...prev].slice(0, 15));
    setActiveExecId(newExecId);
  };

  useEffect(() => {
    if (!isSimulating || simulationIndex < 0) return;

    const stagesInOrder: StageId[] = [
      'market-data', 'market-intelligence', 'strategy-engine', 'rule-engine',
      'guardian', 'ai-debate', 'second-opinion', 'decision-engine',
      'validation', 'decision-ledger'
    ];

    if (simulationIndex >= stagesInOrder.length) {
      setIsSimulating(false);
      setSimulationIndex(-1);
      // final status update
      setExecutions(prev => prev.map(ex => {
        if (ex.id === activeExecId) {
          const finalStatus = ex.direction === 'HOLD' ? 'BLOCKED' : 'SUCCESS';
          triggerLog(`Pipeline decision finalized! Status: [${finalStatus}] Direction: [${ex.direction}]`);
          return {
            ...ex,
            timestamp: 'Just now',
            status: finalStatus
          };
        }
        return ex;
      }));
      return;
    }

    const timer = setTimeout(() => {
      const currentStageId = stagesInOrder[simulationIndex];
      setSelectedStageId(currentStageId);

      setExecutions(prev => prev.map(ex => {
        if (ex.id === activeExecId) {
          const updatedStages = ex.stages.map((stage, idx) => {
            if (stage.id === currentStageId) {
              const execTime = Math.floor(Math.random() * 40) + 10;
              const confidence = ex.direction === 'HOLD' && simulationIndex >= 3 ? 0 : Math.floor(Math.random() * 20) + 78;
              let resSummary = 'Completed successfully.';
              
              if (currentStageId === 'market-data') {
                resSummary = 'Spread: 0.02% | Order Book Liquid';
              } else if (currentStageId === 'market-intelligence') {
                resSummary = ex.direction === 'LONG' ? 'Trend: Strong Bullish Shift' : ex.direction === 'SHORT' ? 'Trend: Heavy Bearish Momentum' : 'Consolidation Bias';
              } else if (currentStageId === 'strategy-engine') {
                resSummary = ex.direction === 'HOLD' ? 'No Strategy Match' : 'Hyperion Reversion Triggered';
              } else if (currentStageId === 'rule-engine') {
                resSummary = ex.direction === 'HOLD' ? 'Failed: EMA trend boundary veto' : 'All structural checkpoints pass';
              } else if (currentStageId === 'guardian') {
                resSummary = 'Risk size calculated: 1.0% | Max limits clear';
              } else if (currentStageId === 'ai-debate') {
                resSummary = 'Bullish debater overrides critics';
              } else if (currentStageId === 'second-opinion') {
                resSummary = 'Consensus node validates direction';
              } else if (currentStageId === 'decision-engine') {
                resSummary = ex.direction === 'HOLD' ? 'State emitted: HOLD' : `State emitted: ${ex.direction}`;
              } else if (currentStageId === 'validation') {
                resSummary = 'Real-time performance metric tracing attached';
              } else if (currentStageId === 'decision-ledger') {
                resSummary = 'Ledger cloud synchronization success';
              }

              // Build technical output dynamically based on direction
              const techJSON = {
                stageId: currentStageId,
                status: 'PASSED',
                timestamp: new Date().toISOString(),
                confidence,
                excursionTracking: {
                  expectedMFE: ex.direction === 'LONG' ? '+2.4%' : ex.direction === 'SHORT' ? '+1.8%' : 'N/A',
                  expectedMAE: ex.direction === 'LONG' ? '-0.8%' : ex.direction === 'SHORT' ? '-0.5%' : 'N/A'
                }
              };

              return {
                ...stage,
                status: (ex.direction === 'HOLD' && idx >= 4) ? ('SKIPPED' as StageStatus) : ('COMPLETED' as StageStatus),
                executionTimeMs: execTime,
                confidencePercent: confidence,
                resultSummary: (ex.direction === 'HOLD' && idx >= 4) ? 'Skipped due to earlier pipeline failures' : resSummary,
                inspectDetails: {
                  title: `${stage.name} Pipeline Stage`,
                  description: `Detailed real-time metrics captured during this operational processing interval.`,
                  technicalOutput: JSON.stringify(techJSON, null, 2),
                  metrics: [
                    { label: 'Calculated Latency', value: `${execTime}ms` },
                    { label: 'Confidence Coefficient', value: `${confidence}%` },
                    { label: 'Pipeline Interceptor', value: 'V4.1 COMPLIANT' }
                  ]
                }
              };
            }
            // Mark next one as processing
            if (idx === simulationIndex + 1 && !(ex.direction === 'HOLD' && idx >= 4)) {
              return { ...stage, status: 'PROCESSING' as StageStatus };
            }
            return stage;
          });

          return { ...ex, stages: updatedStages };
        }
        return ex;
      }));

      setSimulationIndex(prev => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isSimulating, simulationIndex, activeExecId]);

  const handleDeleteRecord = (id: string) => {
    if (executions.length <= 1) return;
    const filtered = executions.filter(e => e.id !== id);
    setExecutions(filtered);
    if (activeExecId === id) {
      setActiveExecId(filtered[0].id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Banner */}
      <div id="pipeline-title-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/2 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
              System Upgrade v4.1
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Unified Decision Path
            </span>
          </div>
          <h2 className="text-lg font-bold font-serif text-zinc-200 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Decision Pipeline Inspector
          </h2>
          <p className="text-xs font-serif text-zinc-400 max-w-xl leading-relaxed">
            Trace high-frequency trade evaluation chronologically across the 10 core logical stages. Inspect confidence rates, execution latencies, and adversarial model debates in a premium sandbox workspace.
          </p>
        </div>

        <button
          onClick={handleTriggerSimulation}
          disabled={isSimulating}
          className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-black font-mono font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all self-start md:self-center shrink-0 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        >
          <RefreshCw className={`w-4 h-4 text-black ${isSimulating ? 'animate-spin' : ''}`} />
          {isSimulating ? 'Processing Cycle...' : 'Simulate Decision Cycle'}
        </button>
      </div>

      {/* Primary Split: Pipeline Selector vs Main View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Log Registry of previous executions */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1.5">
            Execution Log Registry
          </h3>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {executions.map((exec) => {
              const isSel = exec.id === activeExecId;
              const isBlocked = exec.status === 'BLOCKED' || exec.status === 'ERROR';
              const isProc = exec.status === 'PROCESSING';

              return (
                <div
                  key={exec.id}
                  onClick={() => !isSimulating && setActiveExecId(exec.id)}
                  className={`border p-3.5 rounded-lg transition-all relative overflow-hidden ${
                    isSimulating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${
                    isSel 
                      ? 'bg-[#0e0e11] border-amber-500/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]' 
                      : 'bg-zinc-950/20 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-zinc-100 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-500" />
                      {exec.asset}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecord(exec.id);
                      }}
                      className="text-zinc-600 hover:text-red-400 font-mono text-[9px]"
                      disabled={isSimulating}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-2.5">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      exec.direction === 'LONG' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : exec.direction === 'SHORT' 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-zinc-900 text-zinc-400'
                    }`}>
                      {exec.direction}
                    </span>

                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isProc 
                        ? 'bg-amber-500/20 text-amber-400 animate-pulse' 
                        : isBlocked 
                        ? 'bg-red-500/15 text-red-400' 
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {exec.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-3 pt-2 border-t border-zinc-900/50">
                    <span>Conf: {exec.overallConfidencePercent}%</span>
                    <span>{exec.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Pipeline Workflow and Deep Inspector */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Visual Chronological pipeline flow (Left side: 7/12 cols) */}
          <div className="md:col-span-7 bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2.5">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
                Interactive Logical Sequence
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">
                Select any processing block node to inspect its internal states.
              </p>
            </div>

            {/* Stage Cards Flow stack */}
            <div className="space-y-3">
              {activeExec?.stages.map((stage, idx) => {
                const isSelected = stage.id === selectedStageId;
                const isCompleted = stage.status === 'COMPLETED';
                const isFailed = stage.status === 'FAILED';
                const isSkipped = stage.status === 'SKIPPED';
                const isProcessing = stage.status === 'PROCESSING';

                return (
                  <div key={stage.id} className="relative">
                    {/* Flow connector lines */}
                    {idx > 0 && (
                      <div className="absolute -top-3 left-6 h-3 w-0.5 bg-gradient-to-b from-amber-500/20 to-amber-500/5" />
                    )}

                    <div
                      onClick={() => setSelectedStageId(stage.id)}
                      className={`border p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                          : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {/* Left Block info */}
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 w-5 h-5 flex items-center justify-center rounded-full">
                          {idx + 1}
                        </span>

                        <div className="space-y-0.5">
                          <h4 className={`text-[11px] font-mono font-bold uppercase ${
                            isSelected ? 'text-amber-400' : 'text-zinc-200'
                          }`}>
                            {stage.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-serif leading-normal line-clamp-1">
                            {stage.resultSummary}
                          </p>
                        </div>
                      </div>

                      {/* Right Block indicators (Time, Confidence, Status) */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isCompleted && (
                          <div className="text-right text-[9px] font-mono text-zinc-500 hidden sm:block">
                            <div>{stage.executionTimeMs}ms</div>
                            <div className="text-amber-500">{stage.confidencePercent}% Conf</div>
                          </div>
                        )}

                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                          isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : isFailed 
                            ? 'bg-red-500/15 text-red-400' 
                            : isSkipped 
                            ? 'bg-zinc-900 text-zinc-500' 
                            : 'bg-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {stage.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deep Stage Inspector Panel (Right side: 5/12 cols) */}
          <div className="md:col-span-5 bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-2.5">
                <span className="text-[9px] font-mono text-amber-500 uppercase font-bold block">
                  STAGE DEEP-DIVE INSPECTOR
                </span>
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest mt-0.5">
                  {activeStage?.name || 'Selected Stage'}
                </h3>
              </div>

              {activeStage ? (
                <div className="space-y-4">
                  
                  {/* Stage description */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 space-y-1">
                    <h5 className="text-[10px] font-mono font-bold text-zinc-300 uppercase">
                      {activeStage.inspectDetails.title}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-serif leading-normal">
                      {activeStage.inspectDetails.description}
                    </p>
                  </div>

                  {/* Stage internal metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    {activeStage.inspectDetails.metrics.map((m, i) => (
                      <div key={i} className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/50 font-mono text-[9px]">
                        <span className="text-zinc-500 block uppercase">{m.label}</span>
                        <span className="text-zinc-200 font-bold block mt-0.5">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* JSON Output payload */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">
                      Technical JSON Payload
                    </span>
                    <pre className="bg-[#040405] text-[9px] font-mono text-amber-400/80 p-3 rounded-lg border border-zinc-900 max-h-[180px] overflow-auto leading-relaxed">
                      {activeStage.inspectDetails.technicalOutput}
                    </pre>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-zinc-600 font-mono text-xs uppercase">
                  Select any stage block to view state configurations.
                </div>
              )}
            </div>

            {/* Bottom info note */}
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-[9px] font-mono text-zinc-500 leading-normal uppercase">
              Pipeline integrity verified under AQ-OS Thread Safe Scheduler v4.1. Shared memory state locks confirmed.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
