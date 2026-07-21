import React, { useState, useEffect } from 'react';
import { 
  Plus, Copy, Download, Upload, Check, X, Sliders, Play, TrendingUp, 
  Trash2, Award, Activity, ShieldAlert, Cpu, Info, RefreshCw, Key, 
  Settings, ArrowUpRight, CheckCircle, HelpCircle, Layers, FileText, 
  Compass, Coins, User, Edit3, HeartPulse, Sparkles, Scale, GitBranch,
  ArrowRight, ShieldCheck, ChevronRight, CheckCircle2, AlertTriangle, PlayCircle
} from 'lucide-react';
import { Strategy } from '../types/strategies';
import { Recommendation } from '../types/validationMode';

// Extend Strategy type for Version History
export interface StrategyVersion {
  id: string;
  version: string;
  timestamp: string;
  author: string;
  description: string;
  entryRules: string[];
  exitRules: string[];
  riskSettings: {
    maxRiskPerTradePercent: number;
    maxOpenPositions: number;
    dailyDrawdownCapPercent: number;
  };
  takeProfitRules: {
    type: 'Fixed R:R' | 'ATR Multiplier' | 'S/R Level Lock' | 'Trailing Threshold';
    value: number;
  };
  stopLossRules: {
    type: 'Hard Stop' | 'Structure Low/High' | 'ATR Based' | 'Indicator Exit';
    value: number;
  };
  trailingStopRules: {
    isEnabled: boolean;
    activationThresholdRR: number;
    stepRR: number;
  };
}

export interface ExtendedStrategy extends Strategy {
  versions: StrategyVersion[];
  // comparison stats overrides
  customStats?: {
    winRatePercent: number;
    averageR: number;
    profitFactor: number;
    maxDrawdownPercent: number;
    tradeCount: number;
    validationScore: number;
    guardianApprovalRatePercent: number;
  };
}

interface AQStrategyLabProps {
  addLog: (log: string) => void;
  recommendations: Recommendation[];
}

const AVAILABLE_RULE_BLOCKS = [
  { id: 'rule-ema-200', name: '200 EMA Trend Match', category: 'Trend', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' },
  { id: 'rule-market-structure', name: 'Structure Highs/Lows', category: 'Structure', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
  { id: 'rule-session-filter', name: 'Session Liquidity Cap', category: 'Timing', color: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/5' },
  { id: 'rule-breakout', name: 'Key Level Breakout', category: 'Trigger', color: 'border-yellow-400/30 text-yellow-300 bg-yellow-400/5' },
  { id: 'rule-retest', name: 'S&R Boundary Retest', category: 'Trigger', color: 'border-amber-400/30 text-amber-300 bg-amber-400/5' },
  { id: 'rule-bullish-engulfing', name: 'Bullish Engulfing', category: 'Trigger', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
  { id: 'rule-bearish-engulfing', name: 'Bearish Engulfing', category: 'Trigger', color: 'border-red-500/30 text-red-400 bg-red-500/5' },
  { id: 'rule-min-rr', name: 'Risk Reward Threshold', category: 'Risk', color: 'border-amber-600/30 text-amber-500 bg-amber-600/5' },
  { id: 'rule-guardian-approval', name: 'AI Guardian Approved', category: 'Safety', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' },
  { id: 'rule-market-health', name: 'Market Spread Check', category: 'Safety', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' }
];

const BASE_STRATEGIES: ExtendedStrategy[] = [
  {
    id: 'lab-str-alpha-breakout',
    name: 'Alpha Momentum Breakout',
    description: 'Consolidates 200 EMA and Session filter alignment with high-volume breakouts across prime overlapping liquidity sessions.',
    version: '3.3.0',
    author: 'AQ Intelligence',
    isEnabled: true,
    isDefault: true,
    markets: ['BTC/USD', 'ETH/USD'],
    timeframes: ['1H', '15M'],
    entryRules: ['rule-ema-200', 'rule-market-structure', 'rule-breakout'],
    exitRules: ['rule-min-rr', 'rule-guardian-approval'],
    riskSettings: { maxRiskPerTradePercent: 1.5, maxOpenPositions: 3, dailyDrawdownCapPercent: 4.5 },
    positionSizing: 'Fixed Fractional',
    takeProfitRules: { type: 'Fixed R:R', value: 3.0 },
    stopLossRules: { type: 'Structure Low/High', value: 1.0 },
    trailingStopRules: { isEnabled: true, activationThresholdRR: 1.0, stepRR: 0.5 },
    performance: { cumulativeReturnPercent: 114.5, winRatePercent: 64.2, totalTradesCount: 120, profitFactor: 2.15, maxDrawdownPercent: 6.2 },
    strategyHealth: 'Optimal',
    strategyScore: 92,
    versions: [
      {
        id: 'v-1',
        version: '3.2.0',
        timestamp: '2026-07-10T12:00:00Z',
        author: 'AQ Intelligence',
        description: 'Pre-Validation Mode release with baseline metrics.',
        entryRules: ['rule-ema-200', 'rule-breakout'],
        exitRules: ['rule-min-rr'],
        riskSettings: { maxRiskPerTradePercent: 2.0, maxOpenPositions: 3, dailyDrawdownCapPercent: 5.0 },
        takeProfitRules: { type: 'Fixed R:R', value: 2.5 },
        stopLossRules: { type: 'Hard Stop', value: 1.2 },
        trailingStopRules: { isEnabled: false, activationThresholdRR: 0, stepRR: 0 }
      },
      {
        id: 'v-2',
        version: '3.1.0',
        timestamp: '2026-06-28T09:30:00Z',
        author: 'AQ Intelligence',
        description: 'First proof of breakout rules core.',
        entryRules: ['rule-breakout'],
        exitRules: ['rule-min-rr'],
        riskSettings: { maxRiskPerTradePercent: 2.5, maxOpenPositions: 5, dailyDrawdownCapPercent: 10.0 },
        takeProfitRules: { type: 'Fixed R:R', value: 2.0 },
        stopLossRules: { type: 'Hard Stop', value: 1.5 },
        trailingStopRules: { isEnabled: false, activationThresholdRR: 0, stepRR: 0 }
      }
    ],
    customStats: {
      winRatePercent: 64.2,
      averageR: 2.45,
      profitFactor: 2.15,
      maxDrawdownPercent: 6.2,
      tradeCount: 120,
      validationScore: 92,
      guardianApprovalRatePercent: 95.8
    }
  },
  {
    id: 'lab-str-mean-reversion',
    name: 'Hyperion Reversion Protocol',
    description: 'Captures sideways range exhaustion points at extreme ATR and support/resistance bounds, optimized for short hold times.',
    version: '1.2.4',
    author: 'Quant Labs',
    isEnabled: true,
    isDefault: false,
    markets: ['ETH/USD', 'SOL/USD'],
    timeframes: ['15M'],
    entryRules: ['rule-retest', 'rule-market-health'],
    exitRules: ['rule-session-filter'],
    riskSettings: { maxRiskPerTradePercent: 1.0, maxOpenPositions: 2, dailyDrawdownCapPercent: 3.0 },
    positionSizing: 'Kelly Criterion',
    takeProfitRules: { type: 'S/R Level Lock', value: 2.0 },
    stopLossRules: { type: 'Hard Stop', value: 1.2 },
    trailingStopRules: { isEnabled: false, activationThresholdRR: 0, stepRR: 0 },
    performance: { cumulativeReturnPercent: 48.2, winRatePercent: 54.8, totalTradesCount: 82, profitFactor: 1.48, maxDrawdownPercent: 4.1 },
    strategyHealth: 'Optimal',
    strategyScore: 84,
    versions: [
      {
        id: 'mr-v-1',
        version: '1.1.0',
        timestamp: '2026-07-02T15:45:00Z',
        author: 'Quant Labs',
        description: 'Added S/R Level Lock target integration.',
        entryRules: ['rule-retest'],
        exitRules: ['rule-session-filter'],
        riskSettings: { maxRiskPerTradePercent: 1.0, maxOpenPositions: 2, dailyDrawdownCapPercent: 3.0 },
        takeProfitRules: { type: 'Fixed R:R', value: 1.5 },
        stopLossRules: { type: 'Hard Stop', value: 1.0 },
        trailingStopRules: { isEnabled: false, activationThresholdRR: 0, stepRR: 0 }
      }
    ],
    customStats: {
      winRatePercent: 54.8,
      averageR: 1.62,
      profitFactor: 1.48,
      maxDrawdownPercent: 4.1,
      tradeCount: 82,
      validationScore: 84,
      guardianApprovalRatePercent: 88.4
    }
  },
  {
    id: 'lab-str-guardian-hedged',
    name: 'Secure Stratum Hedged',
    description: 'Ultra conservative hedging system with direct circuit breaker loopback to AI Guardian risk vectors.',
    version: '2.1.0',
    author: 'Risk Officer',
    isEnabled: false,
    isDefault: false,
    markets: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    timeframes: ['4H', '1H'],
    entryRules: ['rule-ema-200', 'rule-guardian-approval', 'rule-market-health'],
    exitRules: ['rule-min-rr'],
    riskSettings: { maxRiskPerTradePercent: 0.5, maxOpenPositions: 1, dailyDrawdownCapPercent: 1.5 },
    positionSizing: 'Fixed Lot Size',
    takeProfitRules: { type: 'Fixed R:R', value: 1.8 },
    stopLossRules: { type: 'Hard Stop', value: 0.5 },
    trailingStopRules: { isEnabled: true, activationThresholdRR: 0.5, stepRR: 0.25 },
    performance: { cumulativeReturnPercent: 29.4, winRatePercent: 78.5, totalTradesCount: 140, profitFactor: 1.95, maxDrawdownPercent: 1.4 },
    strategyHealth: 'Optimal',
    strategyScore: 89,
    versions: [
      {
        id: 'sh-v-1',
        version: '2.0.0',
        timestamp: '2026-06-15T08:00:00Z',
        author: 'Risk Officer',
        description: 'First version with circuit-breaker lock.',
        entryRules: ['rule-guardian-approval'],
        exitRules: ['rule-min-rr'],
        riskSettings: { maxRiskPerTradePercent: 0.5, maxOpenPositions: 1, dailyDrawdownCapPercent: 2.0 },
        takeProfitRules: { type: 'Fixed R:R', value: 1.5 },
        stopLossRules: { type: 'Hard Stop', value: 0.5 },
        trailingStopRules: { isEnabled: false, activationThresholdRR: 0, stepRR: 0 }
      }
    ],
    customStats: {
      winRatePercent: 78.5,
      averageR: 1.92,
      profitFactor: 1.95,
      maxDrawdownPercent: 1.4,
      tradeCount: 140,
      validationScore: 89,
      guardianApprovalRatePercent: 99.1
    }
  }
];

export default function AQStrategyLab({ addLog, recommendations }: AQStrategyLabProps) {
  const [strategies, setStrategies] = useState<ExtendedStrategy[]>(() => {
    const saved = localStorage.getItem('aq_strategy_lab_registry');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return BASE_STRATEGIES;
      }
    }
    return BASE_STRATEGIES;
  });

  const [activeTab, setActiveTab] = useState<'build' | 'compare'>('build');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || 'lab-str-alpha-breakout');
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);

  // Form parameters
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVersion, setFormVersion] = useState('1.0.0');
  const [formAuthor, setFormAuthor] = useState('Operator');
  const [formMarkets, setFormMarkets] = useState<string[]>(['XAU/USD']);
  const [formTimeframes, setFormTimeframes] = useState<('4H' | '1H' | '15M')[]>(['1H']);
  const [formEntryRules, setFormEntryRules] = useState<string[]>([]);
  const [formExitRules, setFormExitRules] = useState<string[]>([]);
  const [formMaxRisk, setFormMaxRisk] = useState(1.0);
  const [formMaxPositions, setFormMaxPositions] = useState(3);
  const [formDrawdownCap, setFormDrawdownCap] = useState(5.0);
  const [formSizingType, setFormSizingType] = useState<Strategy['positionSizing']>('Fixed Fractional');
  const [formTPType, setFormTPType] = useState<Strategy['takeProfitRules']['type']>('Fixed R:R');
  const [formTPValue, setFormTPValue] = useState(2.5);
  const [formSLType, setFormSLType] = useState<Strategy['stopLossRules']['type']>('Hard Stop');
  const [formSLValue, setFormSLValue] = useState(1.0);
  const [formTrailingEnabled, setFormTrailingEnabled] = useState(true);
  const [formTrailingActivation, setFormTrailingActivation] = useState(1.0);
  const [formTrailingStep, setFormTrailingStep] = useState(0.5);

  // Compare selection ids
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Serialization String
  const [ioBuffer, setIoBuffer] = useState('');
  const [showIoDrawer, setShowIoDrawer] = useState(false);
  const [ioError, setIoError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('aq_strategy_lab_registry', JSON.stringify(strategies));
  }, [strategies]);

  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[0];

  const triggerLog = (msg: string) => {
    addLog(`STRATEGY LAB: ${msg}`);
  };

  const handleCreateNew = () => {
    setEditModeId(null);
    setFormName('Custom Delta Sniper');
    setFormDesc('Tactical short-term momentum sweeps optimized for rapid confirmations.');
    setFormVersion('1.0.0');
    setFormAuthor('Operator Node');
    setFormMarkets(['XAU/USD']);
    setFormTimeframes(['15M']);
    setFormEntryRules(['rule-ema-200', 'rule-min-rr']);
    setFormExitRules(['rule-session-filter']);
    setFormMaxRisk(1.0);
    setFormMaxPositions(3);
    setFormDrawdownCap(5.0);
    setFormSizingType('Fixed Fractional');
    setFormTPType('Fixed R:R');
    setFormTPValue(2.5);
    setFormSLType('Hard Stop');
    setFormSLValue(1.0);
    setFormTrailingEnabled(true);
    setFormTrailingActivation(1.0);
    setFormTrailingStep(0.5);
    setIsFormOpen(true);
    triggerLog('Opened creation wizard for new quantitative strategy.');
  };

  const handleEdit = (str: ExtendedStrategy) => {
    setEditModeId(str.id);
    setFormName(str.name);
    setFormDesc(str.description);
    setFormVersion(str.version);
    setFormAuthor(str.author);
    setFormMarkets(str.markets);
    setFormTimeframes(str.timeframes);
    setFormEntryRules(str.entryRules);
    setFormExitRules(str.exitRules);
    setFormMaxRisk(str.riskSettings.maxRiskPerTradePercent);
    setFormMaxPositions(str.riskSettings.maxOpenPositions);
    setFormDrawdownCap(str.riskSettings.dailyDrawdownCapPercent);
    setFormSizingType(str.positionSizing);
    setFormTPType(str.takeProfitRules.type);
    setFormTPValue(str.takeProfitRules.value);
    setFormSLType(str.stopLossRules.type);
    setFormSLValue(str.stopLossRules.value);
    setFormTrailingEnabled(str.trailingStopRules.isEnabled);
    setFormTrailingActivation(str.trailingStopRules.activationThresholdRR);
    setFormTrailingStep(str.trailingStopRules.stepRR);
    setIsFormOpen(true);
    triggerLog(`Initiated edit terminal for strategy [${str.name}]`);
  };

  const handleClone = (str: ExtendedStrategy) => {
    const newId = `lab-copy-${Date.now()}`;
    const cloned: ExtendedStrategy = {
      ...str,
      id: newId,
      name: `${str.name} (Clone)`,
      isEnabled: true,
      isDefault: false,
      version: `${str.version}-clone`,
      performance: {
        cumulativeReturnPercent: 0,
        winRatePercent: 0,
        totalTradesCount: 0,
        profitFactor: 0,
        maxDrawdownPercent: 0
      },
      customStats: str.customStats ? {
        ...str.customStats,
        tradeCount: 0,
        validationScore: Math.round(str.customStats.validationScore * 0.95)
      } : undefined,
      versions: [
        {
          id: `cv-${Date.now()}`,
          version: str.version,
          timestamp: new Date().toISOString(),
          author: str.author,
          description: `Cloned snapshot from [${str.name}]`,
          entryRules: [...str.entryRules],
          exitRules: [...str.exitRules],
          riskSettings: { ...str.riskSettings },
          takeProfitRules: { ...str.takeProfitRules },
          stopLossRules: { ...str.stopLossRules },
          trailingStopRules: { ...str.trailingStopRules }
        }
      ]
    };
    setStrategies([...strategies, cloned]);
    setSelectedStrategyId(newId);
    triggerLog(`Successfully cloned [${str.name}] to design pipeline.`);
  };

  const handleExport = (str: ExtendedStrategy) => {
    const serialized = JSON.stringify(str, null, 2);
    setIoBuffer(serialized);
    setShowIoDrawer(true);
    setIoError(null);
    navigator.clipboard?.writeText(serialized);
    triggerLog(`Active strategy [${str.name}] schema copied to clipboard buffer.`);
  };

  const handleImport = () => {
    setIoError(null);
    if (!ioBuffer.trim()) {
      setIoError('Buffer payload is empty.');
      return;
    }
    try {
      const parsed = JSON.parse(ioBuffer);
      if (!parsed.name || !parsed.entryRules || !parsed.riskSettings) {
        setIoError('Invalid schema payload. Name, Entry Rules, and Risk configurations are mandatory.');
        return;
      }
      const imported: ExtendedStrategy = {
        ...parsed,
        id: `lab-import-${Date.now()}`,
        isEnabled: true,
        isDefault: false,
        versions: parsed.versions || []
      };
      setStrategies([...strategies, imported]);
      setSelectedStrategyId(imported.id);
      setShowIoDrawer(false);
      setIoBuffer('');
      triggerLog(`Imported external strategy [${imported.name}] into local workspace.`);
    } catch (e: any) {
      setIoError(`De-serialization failed: ${e.message}`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (strategies.length <= 1) {
      triggerLog('Registry integrity block. Core node requires at least 1 design strategy.');
      return;
    }
    const filtered = strategies.filter(s => s.id !== id);
    if (activeStrategy.id === id) {
      setSelectedStrategyId(filtered[0].id);
    }
    setStrategies(filtered);
    triggerLog(`Deleted strategy [${name}] from system registries.`);
  };

  const toggleStrategyEnabled = (id: string) => {
    setStrategies(strategies.map(s => {
      if (s.id === id) {
        const next = !s.isEnabled;
        triggerLog(`Toggled execution state for [${s.name}] -> [${next ? 'ENABLED' : 'DISABLED'}].`);
        return { ...s, isEnabled: next };
      }
      return s;
    }));
  };

  // Rollback to specific version snapshot
  const handleRollback = (targetVer: StrategyVersion) => {
    setStrategies(strategies.map(s => {
      if (s.id === selectedStrategyId) {
        // Save current as a version history snapshot
        const currentSnapshot: StrategyVersion = {
          id: `v-snap-${Date.now()}`,
          version: s.version,
          timestamp: new Date().toISOString(),
          author: s.author,
          description: `Snapshot before rollback to version ${targetVer.version}`,
          entryRules: [...s.entryRules],
          exitRules: [...s.exitRules],
          riskSettings: { ...s.riskSettings },
          takeProfitRules: { ...s.takeProfitRules },
          stopLossRules: { ...s.stopLossRules },
          trailingStopRules: { ...s.trailingStopRules }
        };

        triggerLog(`Rolled back [${s.name}] configuration to version ${targetVer.version}. Saved snapshot of previous.`);

        return {
          ...s,
          version: targetVer.version,
          entryRules: [...targetVer.entryRules],
          exitRules: [...targetVer.exitRules],
          riskSettings: { ...targetVer.riskSettings },
          takeProfitRules: { ...targetVer.takeProfitRules },
          stopLossRules: { ...targetVer.stopLossRules },
          trailingStopRules: { ...targetVer.trailingStopRules },
          versions: [currentSnapshot, ...s.versions].slice(0, 10) // cap to 10 versions
        };
      }
      return s;
    }));
  };

  // Save creation/modification
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Calculate simulated dynamic metrics score out of 100
    const ruleWeight = (formEntryRules.length + formExitRules.length) * 6;
    const riskFactor = formMaxRisk <= 1.5 ? 20 : formMaxRisk <= 3.0 ? 10 : 0;
    const tpRatio = (formTPValue / (formSLValue || 1)) >= 2 ? 20 : 10;
    const score = Math.min(98, Math.max(45, 40 + ruleWeight + riskFactor + tpRatio));

    if (editModeId) {
      // Modify existing
      setStrategies(strategies.map(s => {
        if (s.id === editModeId) {
          // Push old configuration as a historic version snapshot
          const currentSnapshot: StrategyVersion = {
            id: `v-snap-${Date.now()}`,
            version: s.version,
            timestamp: new Date().toISOString(),
            author: s.author,
            description: `Auto-saved snapshot before edits`,
            entryRules: [...s.entryRules],
            exitRules: [...s.exitRules],
            riskSettings: { ...s.riskSettings },
            takeProfitRules: { ...s.takeProfitRules },
            stopLossRules: { ...s.stopLossRules },
            trailingStopRules: { ...s.trailingStopRules }
          };

          const nextVersions = [currentSnapshot, ...s.versions].slice(0, 10);

          triggerLog(`Modified and recompiled configuration [${formName}] (v${formVersion}). Version snapshot created.`);

          return {
            ...s,
            name: formName,
            description: formDesc,
            version: formVersion,
            author: formAuthor,
            markets: formMarkets,
            timeframes: formTimeframes,
            entryRules: formEntryRules,
            exitRules: formExitRules,
            riskSettings: {
              maxRiskPerTradePercent: formMaxRisk,
              maxOpenPositions: formMaxPositions,
              dailyDrawdownCapPercent: formDrawdownCap
            },
            positionSizing: formSizingType,
            takeProfitRules: { type: formTPType, value: formTPValue },
            stopLossRules: { type: formSLType, value: formSLValue },
            trailingStopRules: {
              isEnabled: formTrailingEnabled,
              activationThresholdRR: formTrailingActivation,
              stepRR: formTrailingStep
            },
            strategyScore: score,
            strategyHealth: score >= 75 ? 'Optimal' : score >= 50 ? 'Degraded' : 'Critical',
            versions: nextVersions
          };
        }
        return s;
      }));
    } else {
      // Create new
      const newId = `lab-str-${Date.now()}`;
      const newStr: ExtendedStrategy = {
        id: newId,
        name: formName,
        description: formDesc,
        version: formVersion,
        author: formAuthor,
        isEnabled: true,
        isDefault: false,
        markets: formMarkets,
        timeframes: formTimeframes,
        entryRules: formEntryRules,
        exitRules: formExitRules,
        riskSettings: {
          maxRiskPerTradePercent: formMaxRisk,
          maxOpenPositions: formMaxPositions,
          dailyDrawdownCapPercent: formDrawdownCap
        },
        positionSizing: formSizingType,
        takeProfitRules: { type: formTPType, value: formTPValue },
        stopLossRules: { type: formSLType, value: formSLValue },
        trailingStopRules: {
          isEnabled: formTrailingEnabled,
          activationThresholdRR: formTrailingActivation,
          stepRR: formTrailingStep
        },
        performance: {
          cumulativeReturnPercent: 0,
          winRatePercent: 0,
          totalTradesCount: 0,
          profitFactor: 0,
          maxDrawdownPercent: 0
        },
        strategyScore: score,
        strategyHealth: score >= 75 ? 'Optimal' : score >= 50 ? 'Degraded' : 'Critical',
        versions: [],
        customStats: {
          winRatePercent: 50.0 + Math.random() * 18,
          averageR: 1.5 + Math.random() * 1.2,
          profitFactor: 1.2 + Math.random() * 0.8,
          maxDrawdownPercent: 2.0 + Math.random() * 5,
          tradeCount: 15 + Math.floor(Math.random() * 30),
          validationScore: score,
          guardianApprovalRatePercent: 80.0 + Math.random() * 19
        }
      };
      setStrategies([...strategies, newStr]);
      setSelectedStrategyId(newId);
      triggerLog(`Created new strategy workspace: [${formName}]`);
    }
    setIsFormOpen(false);
    setEditModeId(null);
  };

  // Drag-and-drop mechanics
  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggedRuleId(ruleId);
    e.dataTransfer.setData('text/plain', ruleId);
  };

  const handleDropOnList = (e: React.DragEvent, targetType: 'ENTRY' | 'EXIT') => {
    e.preventDefault();
    const id = draggedRuleId || e.dataTransfer.getData('text/plain');
    if (!id) return;

    setStrategies(strategies.map(s => {
      if (s.id === selectedStrategyId) {
        const nextEntry = [...s.entryRules];
        const nextExit = [...s.exitRules];

        if (targetType === 'ENTRY') {
          if (!nextEntry.includes(id)) {
            nextEntry.push(id);
            triggerLog(`Visually connected [${id}] to Entry Rule workflow.`);
          }
        } else {
          if (!nextExit.includes(id)) {
            nextExit.push(id);
            triggerLog(`Visually connected [${id}] to Exit/Safety Rule workflow.`);
          }
        }

        return { ...s, entryRules: nextEntry, exitRules: nextExit };
      }
      return s;
    }));
    setDraggedRuleId(null);
  };

  const handleRemoveRuleFromStrategy = (ruleId: string, targetType: 'ENTRY' | 'EXIT') => {
    setStrategies(strategies.map(s => {
      if (s.id === selectedStrategyId) {
        const nextEntry = s.entryRules.filter(r => r !== ruleId);
        const nextExit = s.exitRules.filter(r => r !== ruleId);
        triggerLog(`Disconnected block [${ruleId}] from workspace.`);
        return {
          ...s,
          entryRules: nextEntry,
          exitRules: nextExit
        };
      }
      return s;
    }));
  };

  const handleCheckboxCompareToggle = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(c => c !== id));
    } else {
      setCompareIds([...compareIds, id]);
    }
  };

  // Gather stats override (using real ValidationMode signals matching the strategy's markets if any exist, otherwise elegant fallback)
  const getStrategyStatistics = (str: ExtendedStrategy) => {
    const statsObj = str.customStats || {
      winRatePercent: str.performance.winRatePercent || 62.4,
      averageR: 2.14,
      profitFactor: str.performance.profitFactor || 1.84,
      maxDrawdownPercent: str.performance.maxDrawdownPercent || 5.2,
      tradeCount: str.performance.totalTradesCount || 45,
      validationScore: str.strategyScore || 85,
      guardianApprovalRatePercent: 92.5
    };

    // If active validation mode contains resolved recommendation matches for this strategy ticker/markets, dynamically incorporate!
    const matches = recommendations.filter(rec => {
      const matchMarket = str.markets.some(m => rec.ticker.toUpperCase() === m.toUpperCase());
      return matchMarket && rec.status !== 'TRACKING';
    });

    if (matches.length >= 3) {
      const wins = matches.filter(r => r.status === 'HIT_TP');
      const losses = matches.filter(r => r.status === 'HIT_SL');
      const winRate = (wins.length / matches.length) * 100;
      const totalR = matches.reduce((sum, r) => sum + r.rAchieved, 0);
      const avgR = totalR / matches.length;

      // Real Profit Factor for this strategy matches
      const grossProfit = wins.reduce((sum, r) => sum + r.pnlPercent, 0);
      const grossLoss = losses.reduce((sum, r) => sum + Math.abs(r.pnlPercent), 0);
      const strategyProfitFactor = grossLoss > 0 
        ? Math.round((grossProfit / grossLoss) * 100) / 100 
        : (grossProfit > 0 ? 9.99 : 1.84);

      // Real Max Drawdown for this strategy matches
      let balance = 100000;
      let peak = balance;
      let maxDrawdown = 0;
      const sortedMatches = [...matches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      sortedMatches.forEach(r => {
        const sizeFactor = 0.05;
        const tradeReturn = r.pnlPercent / 100 * sizeFactor * balance;
        balance += tradeReturn;
        if (balance > peak) peak = balance;
        const dd = ((peak - balance) / peak) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      });

      return {
        winRatePercent: Math.round(winRate * 10) / 10,
        averageR: Math.round(avgR * 100) / 100,
        profitFactor: strategyProfitFactor,
        maxDrawdownPercent: Math.round(maxDrawdown * 100) / 100 || 1.2,
        tradeCount: matches.length,
        validationScore: Math.round((winRate * 0.8) + 20),
        guardianApprovalRatePercent: statsObj.guardianApprovalRatePercent
      };
    }

    return statsObj;
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Core Banner v3.3 */}
      <div id="strategy-lab-title-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/2 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
              System Upgrade v3.3
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Strategic Playground Workspace
            </span>
          </div>
          <h2 className="text-lg font-bold font-serif text-zinc-200 uppercase tracking-wide flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            AQ Strategy Lab
          </h2>
          <p className="text-xs font-serif text-zinc-400 max-w-xl leading-relaxed">
            Design and construct algorithmic strategies with drag-and-drop triggers. Roll back versions dynamically, compare live and baseline model statistics, and manage version registries seamlessly.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all self-start md:self-center shrink-0 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        >
          <Plus className="w-4 h-4 text-black" strokeWidth={3} />
          Create New Strategy
        </button>
      </div>

      {/* Mode Switches */}
      <div className="flex border-b border-zinc-900 gap-4">
        <button
          onClick={() => setActiveTab('build')}
          className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase transition-all relative cursor-pointer ${
            activeTab === 'build' ? 'text-amber-400 font-bold border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            Visual Workspace Builder
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('compare');
            // Populate comparison with current keys as default
            if (compareIds.length === 0) {
              setCompareIds(strategies.map(s => s.id));
            }
          }}
          className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase transition-all relative cursor-pointer ${
            activeTab === 'compare' ? 'text-amber-400 font-bold border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            Side-By-Side Comparison
          </span>
        </button>
      </div>

      {/* IO Drawer */}
      {showIoDrawer && (
        <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
              <Download className="w-4 h-4 text-amber-500" />
              Strategy Import/Export Console (JSON Payload)
            </h4>
            <button onClick={() => setShowIoDrawer(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={ioBuffer}
            onChange={(e) => setIoBuffer(e.target.value)}
            placeholder='{ "name": "Institutional Breakout", "entryRules": ["rule-ema-200"] ... }'
            className="w-full h-32 bg-zinc-900/60 border border-zinc-850 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/40"
          />
          {ioError && (
            <p className="text-xs font-mono text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10">{ioError}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleImport} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs py-2 px-4 rounded cursor-pointer">
              Ingest Payload
            </button>
            <button onClick={() => setIoBuffer('')} className="border border-zinc-800 text-zinc-400 font-mono text-xs py-2 px-4 rounded">
              Clear Buffer
            </button>
          </div>
        </div>
      )}

      {/* BUILD TAB */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left panel: Active strategies registry selection */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1.5">
              Strategy Registry
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {strategies.map((str) => {
                const isSel = str.id === selectedStrategyId;
                const statsObj = getStrategyStatistics(str);
                return (
                  <div 
                    key={str.id}
                    onClick={() => setSelectedStrategyId(str.id)}
                    className={`border p-3.5 rounded-lg cursor-pointer transition-all ${
                      isSel 
                        ? 'bg-[#0e0e11] border-amber-500/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]' 
                        : 'bg-zinc-950/20 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-zinc-100 truncate pr-2">{str.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-mono bg-zinc-900 text-zinc-500 px-1.5 rounded">v{str.version}</span>
                        <input
                          type="checkbox"
                          checked={str.isEnabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleStrategyEnabled(str.id)}
                          className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-normal font-serif">
                      {str.description}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-zinc-900/50 mt-3 pt-2 text-[9px] font-mono text-zinc-500">
                      <div>Score: <span className="text-amber-500 font-bold">{str.strategyScore || 85}</span></div>
                      <div>Win: <span className="text-emerald-400 font-bold">{statsObj.winRatePercent}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Workspace canvas */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Strategy Header summary */}
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-serif text-zinc-200">
                      {activeStrategy.name}
                    </h3>
                    <span className="text-[8px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 rounded uppercase">
                      Active Workspace
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-serif leading-relaxed">
                    {activeStrategy.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => handleEdit(activeStrategy)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 cursor-pointer text-[10px] font-mono uppercase flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button 
                    onClick={() => handleClone(activeStrategy)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 cursor-pointer text-[10px] font-mono uppercase flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Clone
                  </button>
                  <button 
                    onClick={() => handleExport(activeStrategy)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 cursor-pointer text-[10px] font-mono uppercase flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Ingest/Out
                  </button>
                  <button 
                    onClick={() => handleDelete(activeStrategy.id, activeStrategy.name)}
                    className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded border border-red-950/40 cursor-pointer text-[10px] font-mono"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sub parameters row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Markets</span>
                  <span className="text-zinc-300 font-bold block">{activeStrategy.markets.join(', ')}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Timeframes</span>
                  <span className="text-zinc-300 font-bold block">{activeStrategy.timeframes.join(', ')}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Take Profit Limit</span>
                  <span className="text-emerald-400 font-bold block">{activeStrategy.takeProfitRules.value} ({activeStrategy.takeProfitRules.type})</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Stop Loss Limit</span>
                  <span className="text-red-400 font-bold block">{activeStrategy.stopLossRules.value}% ({activeStrategy.stopLossRules.type})</span>
                </div>
              </div>
            </div>

            {/* DRAG AND DROP WORKSPACE CANVAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Palette: Left blocks library */}
              <div className="space-y-3 bg-[#0a0a0c] border border-zinc-900 rounded-xl p-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Rules Repository
                  </h4>
                  <p className="text-[9px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
                    Drag blocks to target boards, or click target arrows
                  </p>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {AVAILABLE_RULE_BLOCKS.map(block => {
                    const inEntry = activeStrategy.entryRules.includes(block.id);
                    const inExit = activeStrategy.exitRules.includes(block.id);

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        className={`border p-2.5 rounded-lg text-[10px] font-mono cursor-grab active:cursor-grabbing transition-all flex flex-col gap-2 ${block.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{block.name}</span>
                          <span className="text-[8px] opacity-60 uppercase">{block.category}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-zinc-900/30">
                          <span className="text-[8px] text-zinc-500 uppercase">
                            {inEntry ? '● Entry' : ''} {inExit ? '● Exit' : ''}
                          </span>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const next = [...activeStrategy.entryRules];
                                if (!next.includes(block.id)) {
                                  next.push(block.id);
                                  setStrategies(strategies.map(s => s.id === selectedStrategyId ? { ...s, entryRules: next } : s));
                                  triggerLog(`Added [${block.name}] to entry workflow.`);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded border border-zinc-850 cursor-pointer text-[8px]"
                              title="Add to Entry rules"
                            >
                              + Entry
                            </button>
                            <button
                              onClick={() => {
                                const next = [...activeStrategy.exitRules];
                                if (!next.includes(block.id)) {
                                  next.push(block.id);
                                  setStrategies(strategies.map(s => s.id === selectedStrategyId ? { ...s, exitRules: next } : s));
                                  triggerLog(`Added [${block.name}] to exit workflow.`);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded border border-zinc-850 cursor-pointer text-[8px]"
                              title="Add to Exit rules"
                            >
                              + Exit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Boards: Middle & Right */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Entry rules board */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnList(e, 'ENTRY')}
                  className="bg-[#0a0a0c] border border-dashed border-zinc-800 rounded-xl p-4 min-h-[180px] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900/80 pb-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                      📥 ENTRY RULES CONVERGENCE CANVAS
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">DROP RULE HERE</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeStrategy.entryRules.length > 0 ? (
                      activeStrategy.entryRules.map(rid => {
                        const blockObj = AVAILABLE_RULE_BLOCKS.find(r => r.id === rid) || { id: rid, name: rid, color: 'border-zinc-800 text-zinc-400 bg-zinc-900' };
                        return (
                          <div 
                            key={rid} 
                            className={`border px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-2 ${blockObj.color}`}
                          >
                            <span>{blockObj.name}</span>
                            <button 
                              onClick={() => handleRemoveRuleFromStrategy(rid, 'ENTRY')}
                              className="text-zinc-500 hover:text-red-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 w-full text-zinc-600 font-mono text-[10px] uppercase">
                        No Entry rules configured. Drag and drop rules from palette.
                      </div>
                    )}
                  </div>
                </div>

                {/* Exit rules board */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnList(e, 'EXIT')}
                  className="bg-[#0a0a0c] border border-dashed border-zinc-800 rounded-xl p-4 min-h-[140px] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900/80 pb-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                      📤 EXIT & SAFETY RULES CANVAS
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">DROP RULE HERE</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeStrategy.exitRules.length > 0 ? (
                      activeStrategy.exitRules.map(rid => {
                        const blockObj = AVAILABLE_RULE_BLOCKS.find(r => r.id === rid) || { id: rid, name: rid, color: 'border-zinc-800 text-zinc-400 bg-zinc-900' };
                        return (
                          <div 
                            key={rid} 
                            className={`border px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-2 ${blockObj.color}`}
                          >
                            <span>{blockObj.name}</span>
                            <button 
                              onClick={() => handleRemoveRuleFromStrategy(rid, 'EXIT')}
                              className="text-zinc-500 hover:text-red-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 w-full text-zinc-600 font-mono text-[10px] uppercase">
                        No Exit rules configured. Drag and drop rules from palette.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* VERSION HISTORY ROLLBACK CONTAINER */}
            <div className="bg-[#09090a] border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Strategy Version History
                </h3>
              </div>
              
              {activeStrategy.versions && activeStrategy.versions.length > 0 ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {activeStrategy.versions.map((ver) => (
                    <div 
                      key={ver.id}
                      className="bg-zinc-950 border border-zinc-900 rounded p-2.5 flex items-center justify-between text-[11px] font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">v{ver.version}</span>
                          <span className="text-[8px] text-zinc-500">
                            {new Date(ver.timestamp).toLocaleDateString()} &mdash; by {ver.author}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-serif">{ver.description}</p>
                      </div>
                      <button
                        onClick={() => handleRollback(ver)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-bold text-[9px] rounded border border-amber-500/20 transition-all cursor-pointer"
                      >
                        Roll Back
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
                  No previous versions archived in this strategy. Editing parameters auto-saves previous version structures.
                </p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* COMPARE TAB */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2 mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase">
                Select Strategies to Compare Side-by-Side
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {strategies.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-xs font-mono text-zinc-400 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(s.id)}
                    onChange={() => handleCheckboxCompareToggle(s.id)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>{s.name} <span className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 rounded">v{s.version}</span></span>
                </label>
              ))}
            </div>
          </div>

          {compareIds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {strategies.filter(s => compareIds.includes(s.id)).map(str => {
                const statsObj = getStrategyStatistics(str);
                return (
                  <div key={str.id} className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 space-y-6 relative overflow-hidden">
                    <div className="flex items-start justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-sm font-bold font-serif text-zinc-200">{str.name}</h4>
                        <span className="text-[8px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                          v{str.version}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        str.strategyHealth === 'Optimal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        str.strategyHealth === 'Degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {str.strategyHealth}
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs font-mono">
                      
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Win Rate</span>
                        <span className="text-emerald-400 font-bold">{statsObj.winRatePercent}%</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Average R</span>
                        <span className="text-amber-500 font-bold">+{statsObj.averageR} R</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Profit Factor</span>
                        <span className="text-zinc-200 font-bold">{statsObj.profitFactor}x</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Max Drawdown</span>
                        <span className="text-red-400 font-bold">{statsObj.maxDrawdownPercent}%</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Trade Count</span>
                        <span className="text-zinc-300 font-bold">{statsObj.tradeCount} Signals</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Validation Score</span>
                        <span className="text-amber-400 font-bold">{statsObj.validationScore} / 100</span>
                      </div>

                      <div className="flex justify-between pb-1.5">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Guardian Approval Rate</span>
                        <span className="text-emerald-400 font-bold">{statsObj.guardianApprovalRatePercent}%</span>
                      </div>

                    </div>

                    {/* Quick overview of rules */}
                    <div className="border-t border-zinc-900 pt-4 space-y-1.5">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-mono">Convergence Triggers</span>
                      <div className="flex flex-wrap gap-1">
                        {str.entryRules.map(rid => (
                          <span key={rid} className="text-[8px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-850">
                            {rid.replace('rule-', '')}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#09090b] border border-zinc-900 rounded-xl">
              <p className="text-xs font-mono text-zinc-500">Please select at least one strategy to display comparative columns.</p>
            </div>
          )}

        </div>
      )}

      {/* BUILD DIALOG MODAL WIZARD */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form 
            onSubmit={handleSaveForm}
            className="bg-[#09090a] border border-zinc-900 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-serif font-bold text-zinc-100 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                {editModeId ? 'Modify Strategy Configuration' : 'Design New Custom Strategy'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Strategy Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Author Name</label>
                <input
                  type="text"
                  required
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Version Tag</label>
                <input
                  type="text"
                  required
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Target Markets (Comma Separated)</label>
                <input
                  type="text"
                  value={formMarkets.join(', ')}
                  onChange={(e) => setFormMarkets(e.target.value.split(',').map(m => m.trim().toUpperCase()))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase">Strategy Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono h-16 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-400 uppercase">Max Risk %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formMaxRisk}
                  onChange={(e) => setFormMaxRisk(parseFloat(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-400 uppercase">Take Profit Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={formTPValue}
                  onChange={(e) => setFormTPValue(parseFloat(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-400 uppercase">Stop Loss Value %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSLValue}
                  onChange={(e) => setFormSLValue(parseFloat(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-zinc-900">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-mono text-xs rounded cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs rounded cursor-pointer"
              >
                Compile Strategy
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
