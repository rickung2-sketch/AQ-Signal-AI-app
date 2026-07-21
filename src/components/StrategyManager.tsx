import React, { useState, useEffect } from 'react';
import { 
  Plus, Copy, Download, Upload, Check, X, Sliders, Play, TrendingUp, 
  Trash2, Award, Activity, ShieldAlert, Cpu, Info, RefreshCw, Key, 
  Settings, ArrowUpRight, CheckCircle, HelpCircle, Layers, FileText, 
  Compass, Coins, User, Edit3, HeartPulse, Sparkles, Scale
} from 'lucide-react';
import { Strategy } from '../types/strategies';
import { evaluateRules } from '../plugins/ruleEngine';
import { RuleEngineInput, RuleEvaluation } from '../types/rules';
import { generateHistoricalOrTestData } from '../plugins/marketDataPluginRegistry';

interface StrategyManagerProps {
  addLog: (log: string) => void;
  marketDataConnected?: boolean;
}

// Default system strategy templates
const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: 'str-gold-7.1',
    name: 'XAU/USD Gold Breakout & Retest',
    description: 'Default high-conviction Gold Strategy (Version 7.1). Validates trend alignment with the 200 EMA on 1 Hour. Triggers entry after Breakout -> Retest -> Bullish/Bearish Engulfing candle confirmation across Asian, London, and NY sessions with precise 1% risk allocation and 4H/1H/15M timeframe convergence.',
    version: '7.1.0',
    author: 'AQ Labs Core v7.1',
    isEnabled: true,
    isDefault: true,
    markets: ['XAU/USD'],
    timeframes: ['4H', '1H', '15M'],
    entryRules: ['rule-ema-200', 'rule-market-structure', 'rule-breakout', 'rule-retest', 'rule-bullish-engulfing', 'rule-bearish-engulfing', 'rule-session-filter'],
    exitRules: ['rule-min-rr', 'rule-guardian-approval', 'rule-market-health'],
    riskSettings: {
      maxRiskPerTradePercent: 1.0,
      maxOpenPositions: 1,
      dailyDrawdownCapPercent: 3.0
    },
    positionSizing: 'Fixed Fractional',
    takeProfitRules: {
      type: 'Fixed R:R',
      value: 2.0
    },
    stopLossRules: {
      type: 'Structure Low/High',
      value: 1.0
    },
    trailingStopRules: {
      isEnabled: true,
      activationThresholdRR: 2.0,
      stepRR: 0.5
    },
    performance: {
      cumulativeReturnPercent: 189.4,
      winRatePercent: 67.8,
      totalTradesCount: 215,
      profitFactor: 2.45,
      maxDrawdownPercent: 5.2
    },
    strategyHealth: 'Optimal',
    strategyScore: 98
  },
  {
    id: 'str-mean-reversion',
    name: 'Mean Reversion Channel Lock',
    description: 'Senses low-volatility, sideways consolidation brackets. Relies on boundary rejection triggers and key S&R retests.',
    version: '1.8.0',
    author: 'Quant Research Desk',
    isEnabled: true,
    isDefault: false,
    markets: ['SOL/USD', 'BTC/USD'],
    timeframes: ['15M'],
    entryRules: ['rule-retest', 'rule-min-rr'],
    exitRules: ['rule-session-filter'],
    riskSettings: {
      maxRiskPerTradePercent: 1.0,
      maxOpenPositions: 2,
      dailyDrawdownCapPercent: 3.0
    },
    positionSizing: 'Kelly Criterion',
    takeProfitRules: {
      type: 'S/R Level Lock',
      value: 2.0
    },
    stopLossRules: {
      type: 'Hard Stop',
      value: 1.2
    },
    trailingStopRules: {
      isEnabled: false,
      activationThresholdRR: 0,
      stepRR: 0
    },
    performance: {
      cumulativeReturnPercent: 58.3,
      winRatePercent: 55.1,
      totalTradesCount: 92,
      profitFactor: 1.45,
      maxDrawdownPercent: 4.2
    },
    strategyHealth: 'Optimal',
    strategyScore: 81
  },
  {
    id: 'str-guardian-safety',
    name: 'Guardian Safe Scalper',
    description: 'Ultra conservative short-term scalper driven directly by AI Guardian risk profiles. Immediately restricts activity on volatility bursts.',
    version: '1.0.0',
    author: 'Safety Auditor',
    isEnabled: false,
    isDefault: false,
    markets: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    timeframes: ['15M'],
    entryRules: ['rule-session-filter', 'rule-min-rr', 'rule-guardian-approval', 'rule-market-health'],
    exitRules: ['rule-ema-200'],
    riskSettings: {
      maxRiskPerTradePercent: 0.5,
      maxOpenPositions: 1,
      dailyDrawdownCapPercent: 1.5
    },
    positionSizing: 'Fixed Lot Size',
    takeProfitRules: {
      type: 'Fixed R:R',
      value: 1.8
    },
    stopLossRules: {
      type: 'Hard Stop',
      value: 0.5
    },
    trailingStopRules: {
      isEnabled: true,
      activationThresholdRR: 0.5,
      stepRR: 0.25
    },
    performance: {
      cumulativeReturnPercent: 24.1,
      winRatePercent: 71.3,
      totalTradesCount: 145,
      profitFactor: 1.78,
      maxDrawdownPercent: 1.9
    },
    strategyHealth: 'Optimal',
    strategyScore: 88
  }
];

const AVAILABLE_ENTRY_RULES = [
  { id: 'rule-ema-200', name: '200 EMA Trend Alignment', category: 'TREND', desc: 'Aligned with EMA trend bias' },
  { id: 'rule-market-structure', name: 'Market Structure HH/HL', category: 'STRUCTURE', desc: 'Higher highs/lows confirmation' },
  { id: 'rule-session-filter', name: 'Session Liquidity Filter', category: 'TIMING', desc: 'Restrict to London/NY overlap' },
  { id: 'rule-breakout', name: 'Key Level Breakout', category: 'TRIGGER', desc: 'Breaks local resistance or support' },
  { id: 'rule-retest', name: 'S&R Level Retest', category: 'TRIGGER', desc: 'Confirmed retest and boundary rejection' },
  { id: 'rule-bullish-engulfing', name: 'Bullish Engulfing Candlestick', category: 'TRIGGER', desc: 'Swallows previous candle range' },
  { id: 'rule-bearish-engulfing', name: 'Bearish Engulfing Candlestick', category: 'TRIGGER', desc: 'Swallows previous bullish range' },
  { id: 'rule-min-rr', name: 'Minimum Risk-to-Reward', category: 'RISK', desc: 'At least 2.0 Risk Reward ratio' },
  { id: 'rule-guardian-approval', name: 'AI Guardian Guardrails', category: 'SAFETY', desc: 'Acceptable dynamic risk score' },
  { id: 'rule-market-health', name: 'Market Health Verification', category: 'SAFETY', desc: 'Healthy spreads and thick books' }
];

export default function StrategyManager({ addLog, marketDataConnected = false }: StrategyManagerProps) {
  // Roster of current custom strategies
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('str-golden-breakout');
  const [activeTab, setActiveTab] = useState<'roster' | 'analysis'>('roster');

  // Interactive Analysis state
  const [analysisPreset, setAnalysisPreset] = useState<'Bullish' | 'Bearish' | 'Sideways' | 'Extreme'>('Bullish');
  const [analysisSession, setAnalysisSession] = useState<string>('London & New York Overlap');
  const [analysisDirection, setAnalysisDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [analysisCapital, setAnalysisCapital] = useState<number>(50000); // mock equity

  // Form states for Create/Edit Strategy
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null); // null means create new
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVersion, setFormVersion] = useState('1.0.0');
  const [formAuthor, setFormAuthor] = useState('');
  const [formMarkets, setFormMarkets] = useState<string[]>(['XAU/USD']);
  const [formTimeframes, setFormTimeframes] = useState<('4H' | '1H' | '15M')[]>(['15M']);
  const [formEntryRules, setFormEntryRules] = useState<string[]>([]);
  const [formExitRules, setFormExitRules] = useState<string[]>([]);
  
  // Sizing & Risk Form elements
  const [formMaxRisk, setFormMaxRisk] = useState(1.0);
  const [formMaxPositions, setFormMaxPositions] = useState(3);
  const [formDrawdownCap, setFormDrawdownCap] = useState(5.0);
  const [formSizingType, setFormSizingType] = useState<Strategy['positionSizing']>('Fixed Fractional');
  
  // Profit & Loss Form elements
  const [formTPType, setFormTPType] = useState<Strategy['takeProfitRules']['type']>('Fixed R:R');
  const [formTPValue, setFormTPValue] = useState(2.0);
  const [formSLType, setFormSLType] = useState<Strategy['stopLossRules']['type']>('Hard Stop');
  const [formSLValue, setFormSLValue] = useState(1.0);
  
  // Trailing Form elements
  const [formTrailingEnabled, setFormTrailingEnabled] = useState(false);
  const [formTrailingActivation, setFormTrailingActivation] = useState(1.0);
  const [formTrailingStep, setFormTrailingStep] = useState(0.5);

  // Import / Export JSON String
  const [importString, setImportString] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const STORAGE_KEY = 'aq_strategies_v20';

  // Load strategies from storage or set templates
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStrategies(parsed);
          const defaultStr = parsed.find((s: Strategy) => s.isDefault) || parsed[0];
          setSelectedStrategyId(defaultStr.id);
        } else {
          setStrategies(DEFAULT_STRATEGIES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STRATEGIES));
        }
      } catch (e) {
        setStrategies(DEFAULT_STRATEGIES);
      }
    } else {
      setStrategies(DEFAULT_STRATEGIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STRATEGIES));
    }
  }, []);

  // Save current roster helper
  const saveRoster = (updated: Strategy[]) => {
    setStrategies(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Find currently selected strategy
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[0];

  // Helper to trigger custom state scoring logic for custom strategy based on user decisions
  const calculateStrategyScoreAndHealth = (
    entryCount: number,
    exitCount: number,
    risk: number,
    tp: number
  ): { score: number; health: Strategy['strategyHealth'] } => {
    // Generate a beautiful diagnostic evaluation score out of 100
    let score = 50;
    // Positive factors
    score += (entryCount * 5); // diverse entry rules are good
    score += (exitCount * 4);
    if (risk <= 2.0) score += 15; // sensible risk management
    else if (risk > 5.0) score -= 20; // high hazard penalization
    if (tp >= 2.0) score += 10; // asymmetrical RR
    
    score = Math.max(10, Math.min(99, score));
    let health: Strategy['strategyHealth'] = 'Optimal';
    if (score < 45) health = 'Critical';
    else if (score < 75) health = 'Degraded';

    return { score, health };
  };

  // Create or Update form submission
  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const { score, health } = calculateStrategyScoreAndHealth(
      formEntryRules.length,
      formExitRules.length,
      formMaxRisk,
      formTPValue
    );

    if (editModeId) {
      // Edit mode
      const updated = strategies.map(s => {
        if (s.id === editModeId) {
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
            strategyHealth: health,
            strategyScore: score
          };
        }
        return s;
      });
      saveRoster(updated);
      addLog(`STRATEGY MANAGER: Modified and recompiled custom strategy [${formName}] (v${formVersion}).`);
    } else {
      // Create new mode
      const newId = `str-custom-${Date.now()}`;
      const newStrategy: Strategy = {
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
        strategyHealth: health,
        strategyScore: score
      };
      
      const updated = [...strategies, newStrategy];
      saveRoster(updated);
      setSelectedStrategyId(newId);
      addLog(`STRATEGY MANAGER: Created new custom strategy [${formName}] initialized by ${formAuthor}.`);
    }

    // Reset Form
    setIsFormOpen(false);
    setEditModeId(null);
  };

  // Open creation form with sensible defaults
  const openCreateForm = () => {
    setEditModeId(null);
    setFormName('Custom Momentum Sweep');
    setFormDesc('Monitors strong directional swings using custom EMA and volume spikes.');
    setFormVersion('1.0.0');
    setFormAuthor('System Operator');
    setFormMarkets(['XAU/USD']);
    setFormTimeframes(['15M']);
    setFormEntryRules(['rule-ema-200', 'rule-min-rr']);
    setFormExitRules(['rule-guardian-approval']);
    setFormMaxRisk(1.0);
    setFormMaxPositions(3);
    setFormDrawdownCap(4.0);
    setFormSizingType('Fixed Fractional');
    setFormTPType('Fixed R:R');
    setFormTPValue(2.5);
    setFormSLType('Hard Stop');
    setFormSLValue(1.0);
    setFormTrailingEnabled(true);
    setFormTrailingActivation(1.0);
    setFormTrailingStep(0.5);
    setIsFormOpen(true);
  };

  // Open edit form with populated fields
  const openEditForm = (str: Strategy) => {
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
  };

  // Duplicate Strategy Routine
  const handleDuplicate = (str: Strategy) => {
    const newId = `str-copy-${Date.now()}`;
    const duplicated: Strategy = {
      ...str,
      id: newId,
      name: `${str.name} (Copy)`,
      isDefault: false,
      isEnabled: true,
      performance: {
        cumulativeReturnPercent: 0, // resets for simulated dupe
        winRatePercent: 0,
        totalTradesCount: 0,
        profitFactor: 0,
        maxDrawdownPercent: 0
      }
    };
    const updated = [...strategies, duplicated];
    saveRoster(updated);
    setSelectedStrategyId(newId);
    addLog(`STRATEGY MANAGER: Duplicated [${str.name}] -> created [${duplicated.name}].`);
  };

  // Export Strategy to clipboard / string
  const handleExport = (str: Strategy) => {
    const serialized = JSON.stringify(str, null, 2);
    setImportString(serialized);
    setShowImportArea(true);
    setImportError(null);
    navigator.clipboard?.writeText(serialized);
    addLog(`STRATEGY MANAGER: Serialized strategy [${str.name}] structure to export buffer.`);
  };

  // Import Strategy from serialized string
  const handleImport = () => {
    setImportError(null);
    if (!importString.trim()) {
      setImportError('Import payload is empty.');
      return;
    }

    try {
      const parsed = JSON.parse(importString);
      if (!parsed.name || !parsed.entryRules || !parsed.riskSettings) {
        setImportError('Invalid schema. Target strategy must contain name, entryRules, and riskSettings definitions.');
        return;
      }

      // Generate clean ID & default safety overrides
      const imported: Strategy = {
        ...parsed,
        id: `str-import-${Date.now()}`,
        isDefault: false,
        isEnabled: true
      };

      const updated = [...strategies, imported];
      saveRoster(updated);
      setSelectedStrategyId(imported.id);
      setShowImportArea(false);
      setImportString('');
      addLog(`STRATEGY MANAGER: Successfully imported and calibrated custom strategy [${imported.name}].`);
    } catch (e: any) {
      setImportError(`De-serialization failed: ${e.message}`);
    }
  };

  // Delete Strategy Routine
  const handleDelete = (id: string, name: string) => {
    if (strategies.length <= 1) {
      addLog('STRATEGY ERROR: Cannot purge roster. AQ Core requires at least 1 operating strategy template.');
      return;
    }
    const filtered = strategies.filter(s => s.id !== id);
    // If we deleted default, promote another
    const wasDefault = strategies.find(s => s.id === id)?.isDefault;
    if (wasDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    saveRoster(filtered);
    if (selectedStrategyId === id) {
      setSelectedStrategyId(filtered[0].id);
    }
    addLog(`STRATEGY MANAGER: purged custom strategy [${name}] from core registries.`);
  };

  // Enable / Disable toggler
  const toggleEnabled = (id: string) => {
    const updated = strategies.map(s => {
      if (s.id === id) {
        // Safe check: can't disable default strategy
        if (s.isDefault && s.isEnabled) {
          addLog('STRATEGY ERROR: Cannot disable the active default core strategy. Assign another default first.');
          return s;
        }
        const nextState = !s.isEnabled;
        addLog(`STRATEGY ENGINE: Operator ${nextState ? 'AUTHORIZED' : 'SUSPENDED'} strategy [${s.name}].`);
        return { ...s, isEnabled: nextState };
      }
      return s;
    });
    saveRoster(updated);
  };

  // Make default
  const makeDefault = (id: string) => {
    const updated = strategies.map(s => {
      if (s.id === id) {
        addLog(`STRATEGY ENGINE: Promoted [${s.name}] to Active Default Strategy. Evaluating execution pipelines.`);
        return { ...s, isDefault: true, isEnabled: true }; // must be enabled if default
      }
      return { ...s, isDefault: false };
    });
    saveRoster(updated);
    setSelectedStrategyId(id);
  };

  // Toggle checklist entries
  const toggleFormEntryRule = (id: string) => {
    if (formEntryRules.includes(id)) {
      setFormEntryRules(formEntryRules.filter(r => r !== id));
    } else {
      setFormEntryRules([...formEntryRules, id]);
    }
  };

  const toggleFormExitRule = (id: string) => {
    if (formExitRules.includes(id)) {
      setFormExitRules(formExitRules.filter(r => r !== id));
    } else {
      setFormExitRules([...formExitRules, id]);
    }
  };

  // Real-time alignment diagnostics based on the Rule Engine evaluateRules
  // Evaluates selected strategy against simulator or live parameters
  const getAlignmentDiagnostics = () => {
    const activePreset = analysisPreset;
    
    // Build simulated inputs to the rule engine
    const input: RuleEngineInput = {
      marketPreset: activePreset,
      activeSession: analysisSession,
      guardianRiskScore: activePreset === 'Extreme' ? 78 : activePreset === 'Bearish' ? 42 : 18,
      marketHealthScore: activePreset === 'Extreme' ? 32 : activePreset === 'Sideways' ? 54 : 88,
      selectedDirection: analysisDirection,
      riskRewardRatio: activeStrategy.takeProfitRules.value / (activeStrategy.stopLossRules.value || 1)
    };

    // Formulate active rules toggles where only the strategy's rules are enabled
    const ruleToggles: Record<string, boolean> = {};
    AVAILABLE_ENTRY_RULES.forEach(r => {
      ruleToggles[r.id] = activeStrategy.entryRules.includes(r.id) || activeStrategy.exitRules.includes(r.id);
    });

    // Run active evaluation
    const evaluations = evaluateRules(input, ruleToggles);
    
    // Filter evaluations actually belonging to our active entry rules
    const strategyEntryEvals = evaluations.filter(e => activeStrategy.entryRules.includes(e.id));
    const passedCount = strategyEntryEvals.filter(e => e.status === 'PASS').length;
    const skippedCount = strategyEntryEvals.filter(e => e.status === 'SKIPPED').length;
    const totalRulesCount = strategyEntryEvals.length || 1;
    
    // Score convergence ratio %
    const convergenceScore = Math.round((passedCount / totalRulesCount) * 100);

    // Calculate dynamic position sizing details (no-execute order ticket mock)
    const riskDollarAmount = (analysisCapital * (activeStrategy.riskSettings.maxRiskPerTradePercent / 100));
    
    // Mock prices based on ticker direction
    const btcMockPrice = 98450;
    const ethMockPrice = 3140;
    const solMockPrice = 185;
    
    const entryPrice = activeStrategy.markets[0]?.includes('ETH') ? ethMockPrice : activeStrategy.markets[0]?.includes('SOL') ? solMockPrice : btcMockPrice;
    
    // calculate stop loss target price
    const stopPercent = activeStrategy.stopLossRules.value / 100;
    const stopDistance = entryPrice * stopPercent;
    const stopPrice = analysisDirection === 'BUY' ? entryPrice - stopDistance : entryPrice + stopDistance;

    // calculate profit target price
    const tpRatio = activeStrategy.takeProfitRules.value;
    const takeProfitPrice = analysisDirection === 'BUY' ? entryPrice + (stopDistance * tpRatio) : entryPrice - (stopDistance * tpRatio);

    // calculated contract sizing
    const positionSizeContracts = stopDistance > 0 ? (riskDollarAmount / stopDistance) : 0;

    return {
      evaluations: strategyEntryEvals,
      passedCount,
      skippedCount,
      totalRulesCount,
      convergenceScore,
      riskDollarAmount,
      entryPrice,
      stopPrice,
      takeProfitPrice,
      positionSizeContracts
    };
  };

  const diag = getAlignmentDiagnostics();

  return (
    <div className="space-y-6">
      
      {/* Page Title & Upgrade Banner */}
      <div id="strategy-engine-v2-header" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/2 blur-3xl rounded-full pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
              VERSION 2.1 UPGRADE
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
              STRATEGY COGNITIVE ENGINE
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            STRATEGY COGNITIVE ENGINE
          </h2>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-2xl">
            Upgrade completed to **Version 2.1**. Design, duplicate, import, and test unlimited custom quantitative rulesets. Evaluates real-time structural setups against Rule Engine vectors without executing capital lines.
          </p>
        </div>

        {/* Create Strategy Shortcut Button */}
        <button
          onClick={openCreateForm}
          className="cursor-pointer bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold font-mono text-xs py-3 px-5 rounded-lg flex items-center gap-2 transition-all self-start md:self-center shrink-0"
        >
          <Plus className="w-4 h-4 text-black" strokeWidth={3} />
          CREATE CUSTOM STRATEGY
        </button>
      </div>

      {/* Mode Switches */}
      <div className="flex border-b border-zinc-900 gap-4">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase transition-all relative ${
            activeTab === 'roster' ? 'text-amber-400 font-bold border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            STRATEGY ROSTER ({strategies.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase transition-all relative ${
            activeTab === 'analysis' ? 'text-amber-400 font-bold border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            LIVE CONVERGENCE SCANNERS
          </span>
        </button>
      </div>

      {/* IMPORT / EXPORT SERALIZATION DRAWER */}
      {showImportArea && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Strategy Serialization Sandbox (JSON)
            </h4>
            <button
              onClick={() => setShowImportArea(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] font-mono text-zinc-500">
            Paste a serialized JSON payload to ingest custom rulesets, or copy the active compiled structure to share.
          </p>

          <textarea
            value={importString}
            onChange={(e) => setImportString(e.target.value)}
            placeholder='{ "name": "Institutional Breakout", "entryRules": ["rule-ema-200"] ... }'
            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/40"
          />

          {importError && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-mono p-2.5 rounded">
              {importError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs py-2 px-4 rounded cursor-pointer"
            >
              INGEST SERIALIZED BUFFER
            </button>
            <button
              onClick={() => {
                setImportString('');
                setImportError(null);
              }}
              className="border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 font-mono text-xs py-2 px-4 rounded"
            >
              Flush
            </button>
          </div>
        </div>
      )}

      {/* STRATEGY BUILDER DIALOG / SECTION */}
      {isFormOpen && (
        <form onSubmit={handleSaveStrategy} className="bg-[#09090A] border border-zinc-900 rounded-xl p-5 space-y-6 animate-fade-in relative">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-serif font-bold text-zinc-200">
                {editModeId ? `MODIFY CONFIGURATION: [${formName}]` : 'DESIGN NEW ALGORITHMIC STRATEGY'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: Basic Identifiers */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-900/40 pb-1">
                A. Meta Information
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Strategy Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Golden Cross Sweep"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Author / Owner</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Quant Team"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Semantic Version</label>
                  <input
                    type="text"
                    required
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="e.g. 1.0.0"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Markets (Comma Separated)</label>
                  <input
                    type="text"
                    value={formMarkets.join(', ')}
                    onChange={(e) => setFormMarkets(e.target.value.split(',').map(m => m.trim().toUpperCase()))}
                    placeholder="BTC/USD, ETH/USD"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block">Short Purpose Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Summarize structural bias and logic boundaries..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none h-16 resize-none"
                />
              </div>

              {/* Sizing & Risk Settings */}
              <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-900/40 pb-1 pt-2">
                B. Risk Management parameters
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-zinc-400 uppercase">Max Risk %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={formMaxRisk}
                    onChange={(e) => setFormMaxRisk(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-zinc-400 uppercase">Max Positions</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formMaxPositions}
                    onChange={(e) => setFormMaxPositions(parseInt(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-zinc-400 uppercase">Drawdown Cap %</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={formDrawdownCap}
                    onChange={(e) => setFormDrawdownCap(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Position Sizing Engine</label>
                  <select
                    value={formSizingType}
                    onChange={(e) => setFormSizingType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none"
                  >
                    <option value="Fixed Fractional">Fixed Fractional (% Cap)</option>
                    <option value="Fixed Lot Size">Fixed Lot Size (Constant)</option>
                    <option value="Kelly Criterion">Kelly Criterion Ratio</option>
                    <option value="Martingale (Pro)">Martingale (Pro Bracket)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Evaluation Timeframes</label>
                  <div className="flex gap-2 pt-1.5">
                    {['15M', '1H', '4H'].map(tf => {
                      const isSel = formTimeframes.includes(tf as any);
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => {
                            if (isSel) setFormTimeframes(formTimeframes.filter(t => t !== tf));
                            else setFormTimeframes([...formTimeframes, tf as any]);
                          }}
                          className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                            isSel ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 2: Entry Rules & Target Adjustments */}
            <div className="space-y-4">
              
              <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-900/40 pb-1">
                C. Rules Convergence Selection
              </h4>

              {/* Multi-select for Entry Rules */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block">Active Entry Trigger Rules</label>
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-lg p-2.5 h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {AVAILABLE_ENTRY_RULES.map(r => {
                    const active = formEntryRules.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleFormEntryRule(r.id)}
                        className={`w-full text-left p-1.5 rounded text-[10px] font-mono flex items-center justify-between border transition-all ${
                          active ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-transparent border-transparent hover:bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'}`} />
                          {r.name}
                        </span>
                        <span className="text-[8px] opacity-70 uppercase font-bold">{r.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-select for Exit Rules */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block">Active Exit/Safety Trigger Rules</label>
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-lg p-2.5 h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {AVAILABLE_ENTRY_RULES.map(r => {
                    const active = formExitRules.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleFormExitRule(r.id)}
                        className={`w-full text-left p-1.5 rounded text-[10px] font-mono flex items-center justify-between border transition-all ${
                          active ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-transparent border-transparent hover:bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500' : 'bg-zinc-700'}`} />
                          {r.name}
                        </span>
                        <span className="text-[8px] opacity-70 uppercase font-bold">{r.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Take Profit & Stop Loss setups */}
              <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-900/40 pb-1 pt-1">
                D. Take Profit & Stop Loss Limits
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-400 block">Take Profit Target</label>
                  <div className="flex gap-1.5">
                    <select
                      value={formTPType}
                      onChange={(e) => setFormTPType(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono rounded px-1 text-zinc-300"
                    >
                      <option value="Fixed R:R">Fixed R:R</option>
                      <option value="ATR Multiplier">ATR Multi</option>
                      <option value="S/R Level Lock">S/R Target</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formTPValue}
                      onChange={(e) => setFormTPValue(parseFloat(e.target.value))}
                      className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-400 block">Stop Loss Risk</label>
                  <div className="flex gap-1.5">
                    <select
                      value={formSLType}
                      onChange={(e) => setFormSLType(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono rounded px-1 text-zinc-300"
                    >
                      <option value="Hard Stop">Hard SL %</option>
                      <option value="Structure Low/High">Structure</option>
                      <option value="ATR Based">ATR based</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formSLValue}
                      onChange={(e) => setFormSLValue(parseFloat(e.target.value))}
                      className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Trailing stops */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded p-2.5 grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="form-trailing"
                    checked={formTrailingEnabled}
                    onChange={(e) => setFormTrailingEnabled(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <label htmlFor="form-trailing" className="text-[9px] font-mono text-zinc-400 select-none">Trailing Stop</label>
                </div>
                <div>
                  <label className="text-[7px] font-mono text-zinc-500 block">Activation R:R</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!formTrailingEnabled}
                    value={formTrailingActivation}
                    onChange={(e) => setFormTrailingActivation(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono px-1 disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-mono text-zinc-500 block">Step R:R</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!formTrailingEnabled}
                    value={formTrailingStep}
                    onChange={(e) => setFormTrailingStep(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono px-1 disabled:opacity-40"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Form Action Controls */}
          <div className="border-t border-zinc-900 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 font-mono text-xs py-2 px-4 rounded transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold font-mono text-xs py-2 px-6 rounded transition-colors"
            >
              COMPILE STRATEGY MODEL
            </button>
          </div>
        </form>
      )}

      {/* ACTIVE VIEW TAB 1: ROSTER SCREEN */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT: Strategies List Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                  CUSTOM DESIGN REGISTRY
                </span>
                <span className="text-[8px] font-mono text-zinc-500">SELECT DEFAULT</span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {strategies.map((str) => {
                  const isSelected = str.id === selectedStrategyId;
                  const isOptimal = str.strategyHealth === 'Optimal';
                  const isDegraded = str.strategyHealth === 'Degraded';
                  return (
                    <div
                      key={str.id}
                      onClick={() => setSelectedStrategyId(str.id)}
                      className={`cursor-pointer rounded-lg p-3.5 border transition-all text-left relative space-y-2 group ${
                        isSelected 
                          ? 'bg-[#120F08] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.03)]' 
                          : 'bg-zinc-950 border-zinc-900 hover:border-zinc-850'
                      }`}
                    >
                      {/* Active default banner flag */}
                      {str.isDefault && (
                        <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[7px] font-mono px-2 py-0.5 rounded-bl uppercase font-black border-l border-b border-amber-500/20">
                          ACTIVE DEFAULT
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold font-serif text-zinc-200 flex items-center gap-1.5">
                            {str.name}
                            <span className="text-[9px] font-mono text-zinc-500 font-normal">v{str.version}</span>
                          </h4>
                          <p className="text-[10px] font-mono text-zinc-500 leading-normal line-clamp-2">
                            {str.description}
                          </p>
                        </div>
                      </div>

                      {/* Info footer line inside item card */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-900/60 text-[9px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8px] ${
                            isOptimal ? 'bg-green-500/10 text-green-400' :
                            isDegraded ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {str.strategyHealth}
                          </span>
                          <span className="text-zinc-600">Score: <span className="text-amber-500 font-bold">{str.strategyScore}</span></span>
                        </div>
                        <span className="text-zinc-600">Owner: {str.author}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Strategy Detail & Controls View (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {activeStrategy ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6 relative">
                
                {/* Decorative gold badge indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => makeDefault(activeStrategy.id)}
                    disabled={activeStrategy.isDefault}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                      activeStrategy.isDefault 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {activeStrategy.isDefault ? 'CORE DEFAULT' : 'SET AS DEFAULT'}
                  </button>
                  <button
                    onClick={() => toggleEnabled(activeStrategy.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest border font-bold cursor-pointer transition-all ${
                      activeStrategy.isEnabled 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {activeStrategy.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Meta details Header */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                    ACTIVE SELECTION PORTFOLIO
                  </span>
                  <h3 className="text-lg font-serif font-black text-zinc-200">
                    {activeStrategy.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Owner: {activeStrategy.author}
                    </span>
                    <span>•</span>
                    <span>Version: {activeStrategy.version}</span>
                    <span>•</span>
                    <span className="text-zinc-400">Score: <span className="text-amber-500 font-bold">{activeStrategy.strategyScore}/100</span></span>
                  </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-lg text-xs font-mono text-zinc-400 leading-relaxed">
                  {activeStrategy.description}
                </div>

                {/* Structured parameters layout: Two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Part 1: Rules & Markets */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase">TARGET MARKETS</span>
                      <div className="flex gap-1.5 pt-0.5">
                        {activeStrategy.markets.map(m => (
                          <span key={m} className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase">EVALUATION TIMEFRAMES</span>
                      <div className="flex gap-1.5 pt-0.5">
                        {activeStrategy.timeframes.map(tf => (
                          <span key={tf} className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400">
                            {tf}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Entry/Exit Rules overview */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase">CONFIGURED ENTRY CONDITIONAL VECTORS</span>
                      <div className="space-y-1">
                        {activeStrategy.entryRules.map(id => {
                          const r = AVAILABLE_ENTRY_RULES.find(x => x.id === id);
                          return (
                            <div key={id} className="bg-zinc-900/40 px-2 py-1.5 rounded text-[10px] font-mono flex items-center gap-2 text-zinc-400 border border-zinc-900">
                              <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                              <span className="text-zinc-300 font-bold">{r ? r.name : id}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Sizing, Profit Target, SL, Trailing limits */}
                  <div className="space-y-4">
                    
                    <div className="space-y-2 border border-zinc-900 bg-zinc-950 p-3.5 rounded-lg space-y-3">
                      <span className="text-[9px] font-mono text-amber-500 block uppercase font-extrabold tracking-widest">
                        RISK & EXPOSURE LIMITS
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">POSITION SIZING</span>
                          <span className="text-zinc-200 font-bold">{activeStrategy.positionSizing}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">RISK PER SESSION</span>
                          <span className="text-zinc-200 font-bold">{activeStrategy.riskSettings.maxRiskPerTradePercent}% Max</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">TAKE PROFIT LIMIT</span>
                          <span className="text-green-400 font-bold">{activeStrategy.takeProfitRules.type} ({activeStrategy.takeProfitRules.value}x)</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">STOP LOSS BARRIER</span>
                          <span className="text-red-400 font-bold">{activeStrategy.stopLossRules.type} ({activeStrategy.stopLossRules.value}%)</span>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-2 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Trailing Protection:</span>
                        <span className={activeStrategy.trailingStopRules.isEnabled ? "text-amber-400 font-bold" : "text-zinc-600"}>
                          {activeStrategy.trailingStopRules.isEnabled 
                            ? `Active (Step ${activeStrategy.trailingStopRules.stepRR} R:R)` 
                            : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Placeholder Backtest metrics */}
                    <div className="bg-[#0C0C0D] border border-zinc-900 rounded-lg p-3.5 space-y-2.5">
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">
                        HISTORIC PERFORMANCE DATA (SIMULATED PLACEHOLDER)
                      </span>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                          <span className="text-[8px] text-zinc-600 uppercase block leading-none">cum. return</span>
                          <span className="text-green-400 font-mono font-bold text-xs block mt-1">+{activeStrategy.performance.cumulativeReturnPercent}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                          <span className="text-[8px] text-zinc-600 uppercase block leading-none">win rate</span>
                          <span className="text-zinc-200 font-mono font-bold text-xs block mt-1">{activeStrategy.performance.winRatePercent}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                          <span className="text-[8px] text-zinc-600 uppercase block leading-none">total trades</span>
                          <span className="text-zinc-400 font-mono font-bold text-xs block mt-1">{activeStrategy.performance.totalTradesCount}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Operations Toolbar controls */}
                <div className="border-t border-zinc-900 pt-4 flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => openEditForm(activeStrategy)}
                    className="cursor-pointer border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 font-mono text-xs py-2 px-4 rounded flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modify Params
                  </button>
                  <button
                    onClick={() => handleDuplicate(activeStrategy)}
                    className="cursor-pointer border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 font-mono text-xs py-2 px-4 rounded flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate strategy
                  </button>
                  <button
                    onClick={() => handleExport(activeStrategy)}
                    className="cursor-pointer border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 font-mono text-xs py-2 px-4 rounded flex items-center gap-1.5"
                    title="Export strategy setup payload"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      setImportString('');
                      setShowImportArea(true);
                      setImportError(null);
                    }}
                    className="cursor-pointer border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 font-mono text-xs py-2 px-4 rounded flex items-center gap-1.5"
                    title="Import custom strategy"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                  <button
                    onClick={() => handleDelete(activeStrategy.id, activeStrategy.name)}
                    className="cursor-pointer hover:bg-red-950/20 border border-zinc-900 hover:border-red-900/30 text-red-400/80 hover:text-red-400 font-mono text-xs py-2 px-4 rounded flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-[#0C0C0D] border border-zinc-900 rounded-xl p-12 text-center text-zinc-500 font-mono">
                Select a custom strategy to inspect parameters.
              </div>
            )}

          </div>

        </div>
      )}

      {/* ACTIVE VIEW TAB 2: ANALYSIS SCREEN */}
      {activeTab === 'analysis' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Diagnostic Setup Parameters */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-serif font-bold text-zinc-200 tracking-wider uppercase">
                STRATEGY TESTING ENVIRONMENT & MULTI-POINT CONVERGENCE
              </h3>
            </div>

            <p className="text-[11px] font-mono text-zinc-500 leading-normal">
              Continuous scan monitors align your strategy rules against active market telemetry scenarios. Change parameters below to test logic health and directional bias in real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Preset Scenario */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Telematic Preset Scenario</label>
                <select
                  value={analysisPreset}
                  onChange={(e) => setAnalysisPreset(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-2 px-3 rounded focus:outline-none"
                >
                  <option value="Bullish">Bullish (Uptrend Expansion)</option>
                  <option value="Bearish">Bearish (Markdown Sequence)</option>
                  <option value="Sideways">Sideways (Mean Reversion Range)</option>
                  <option value="Extreme">Extreme (Hyper Volatility Event)</option>
                </select>
              </div>

              {/* Session Timeframe */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Active Session Block</label>
                <select
                  value={analysisSession}
                  onChange={(e) => setAnalysisSession(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-2 px-3 rounded focus:outline-none"
                >
                  <option value="London & New York Overlap">London & New York (High volume)</option>
                  <option value="Asian Consolidation Window">Asian Window (Low volume)</option>
                  <option value="Pre-London Liquidity Build">Pre-London Build</option>
                </select>
              </div>

              {/* Trade Direction */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Theoretical Bias</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisDirection('BUY')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border font-bold transition-all ${
                      analysisDirection === 'BUY' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    LONG / BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisDirection('SELL')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border font-bold transition-all ${
                      analysisDirection === 'SELL' 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    SHORT / SELL
                  </button>
                </div>
              </div>

              {/* Account equity capital */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Mock Account Equity ($)</label>
                <input
                  type="number"
                  step="5000"
                  min="5000"
                  value={analysisCapital}
                  onChange={(e) => setAnalysisCapital(parseInt(e.target.value) || 50000)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-2 px-3 rounded focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Diagnostic Core Cockpit Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Convergence Rule Evaluations (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-serif font-bold text-zinc-200 tracking-wider">
                      RULE ENGINE INTEGRATION MATRIX
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-zinc-500">Selected Strategy:</span>
                    <span className="text-amber-500 font-bold">{activeStrategy.name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {diag.evaluations.map(evalu => {
                    const pass = evalu.status === 'PASS';
                    const skip = evalu.status === 'SKIPPED';
                    return (
                      <div
                        key={evalu.id}
                        className={`border rounded-lg p-3 text-xs font-mono space-y-1.5 transition-all ${
                          pass ? 'bg-green-950/5 border-green-900/20' :
                          skip ? 'bg-zinc-900/30 border-zinc-900/60' : 'bg-red-950/5 border-red-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${pass ? 'bg-green-400' : skip ? 'bg-zinc-500' : 'bg-red-500'}`} />
                            {evalu.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase ${
                            pass ? 'bg-green-500/10 text-green-400' :
                            skip ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {evalu.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-normal">
                          {evalu.explanation}
                        </p>
                      </div>
                    );
                  })}

                  {diag.evaluations.length === 0 && (
                    <div className="bg-zinc-900/30 border border-zinc-900 border-dashed rounded-lg p-10 text-center text-zinc-500 text-xs font-mono">
                      No entry rules mapped to the current strategy setup. Edit rules to enable.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right: Convergence Score & No-Execute Order Sizing (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Big Score Box */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 blur-2xl rounded-full" />
                
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                  CONVERGENCE ALIGNMENT INDEX
                </span>
                
                <div className="text-4xl md:text-5xl font-mono font-black text-amber-500 tracking-tighter">
                  {diag.convergenceScore}%
                </div>

                <div className="text-[10px] font-mono text-zinc-400 max-w-xs mx-auto leading-normal">
                  {diag.passedCount} out of {diag.totalRulesCount} strategy criteria validated PASS in this market state.
                </div>

                <div className="pt-2 border-t border-zinc-900 text-[10px] font-mono">
                  <span className="text-zinc-500 block uppercase text-[8px]">STRATEGIC CONCLUSION</span>
                  <span className={`font-bold uppercase text-xs ${diag.convergenceScore >= 80 ? 'text-green-400' : diag.convergenceScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {diag.convergenceScore >= 80 ? 'Optimal Setup Aligned' : diag.convergenceScore >= 50 ? 'Incomplete Alignment' : 'System Bias Conflict'}
                  </span>
                </div>
              </div>

              {/* Simulated Sizing Ticket */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-serif font-bold text-zinc-200 uppercase">
                    NO-EXECUTE SIZING TICKET
                  </h4>
                </div>

                <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                  Calculates position sizing and bracket projections for the default strategy based on account equity and risk caps. (Analysis only)
                </p>

                <div className="space-y-2.5 text-xs font-mono">
                  
                  <div className="flex justify-between items-center bg-zinc-900/40 p-2 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[10px] uppercase">OPERATING ASSET</span>
                    <span className="text-zinc-200 font-bold">{activeStrategy.markets[0] || 'XAU/USD'}</span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900/40 p-2 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[10px] uppercase">ENTRY PRICE</span>
                    <span className="text-zinc-300 font-bold">${diag.entryPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900/40 p-2 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[10px] uppercase">RISK ALLOCATION</span>
                    <span className="text-red-400 font-bold">${diag.riskDollarAmount.toLocaleString()} ({activeStrategy.riskSettings.maxRiskPerTradePercent}%)</span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900/40 p-2 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[10px] uppercase">SIZE CONTRACTS</span>
                    <span className="text-amber-500 font-bold">{diag.positionSizeContracts.toFixed(4)} Units</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="bg-[#0D1C13] border border-green-900/20 p-2 rounded">
                      <span className="text-green-500/70 block uppercase text-[8px]">PROFIT TARGET</span>
                      <span className="text-green-400 font-bold block mt-0.5">${diag.takeProfitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="text-zinc-600 block text-[7px] mt-0.5">({activeStrategy.takeProfitRules.value}x Target)</span>
                    </div>
                    <div className="bg-[#1C0D0E] border border-red-900/20 p-2 rounded">
                      <span className="text-red-500/70 block uppercase text-[8px]">STOP BOUNDARY</span>
                      <span className="text-red-400 font-bold block mt-0.5">${diag.stopPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="text-zinc-600 block text-[7px] mt-0.5">({activeStrategy.stopLossRules.value}% Risk)</span>
                    </div>
                  </div>

                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded p-2.5 text-[9px] font-mono text-amber-500 leading-normal uppercase tracking-wide text-center font-bold">
                  ⚠️ PROTECTED ENVIRONMENT. NO TRADING CHANNELS AUTHORIZED.
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
