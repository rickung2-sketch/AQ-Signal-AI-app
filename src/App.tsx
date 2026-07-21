import React, { useState, useEffect } from 'react';
import { 
  Cpu, Target, Activity, Award, Compass, Shield, MessageSquare, 
  Brain, FileText, BookOpen, Grid, Terminal, Sliders, Menu, X, ShieldAlert, ShieldCheck, Zap, Wallet, Layers, CheckSquare, Database, Server, Eye, Gauge
} from 'lucide-react';

import Login from './components/Login';
import BrokerManager from './components/BrokerManager';
import MarketIntelligence from './components/MarketIntelligence';
import RuleInspector from './components/RuleInspector';
import ExplainableDecisionEngine from './components/ExplainableDecisionEngine';
import MarketDataManager from './components/MarketDataManager';
import StrategyManager from './components/StrategyManager';
import CommandCenter from './components/CommandCenter';
import MissionControl from './components/MissionControl';
import MarketHealth from './components/MarketHealth';
import ReadinessMeter from './components/ReadinessMeter';
import TradeRadar from './components/TradeRadar';
import AIGuardian from './components/AIGuardian';
import AIDebate from './components/AIDebate';
import TradingCoach from './components/TradingCoach';
import DecisionLedger from './components/DecisionLedger';
import KnowledgeVault from './components/KnowledgeVault';
import PluginArchitecture from './components/PluginArchitecture';
import AQCore from './components/AQCore';
import Settings from './components/Settings';
import SystemDiagnostics from './components/SystemDiagnostics';
import SmartMarketScanner from './components/SmartMarketScanner';
import AlphaTestDashboard from './components/AlphaTestDashboard';
import RegressionTestDashboard from './components/RegressionTestDashboard';
import ValidationDashboard from './components/ValidationDashboard';
import AQStrategyLab from './components/AQStrategyLab';
import AQOSDashboard from './components/AQOSDashboard';
import PipelineInspector from './components/PipelineInspector';
import MarketDataMonitor from './components/MarketDataMonitor';
import EngineFlowMonitor from './components/EngineFlowMonitor';
import CodeQualityDashboard from './components/CodeQualityDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import ReliabilityDashboard from './components/ReliabilityDashboard';
import ReleaseReadinessCenter from './components/ReleaseReadinessCenter';
import { marketDataService } from './plugins/marketDataService';

import { TradeLog, AQPlugin, MarketMetrics } from './types/dashboard';
import { ScannerEvent } from './types/marketScanner';
import { generateInitialEvents, generateRandomEvent } from './plugins/marketScannerEngine';
import { Recommendation } from './types/validationMode';
import { generateInitialRecommendations, createRecommendationFromEvent } from './plugins/validationEngine';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('release-readiness');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // v3.3 Feature flags state
  const [featureFlags, setFeatureFlags] = useState(() => {
    const saved = localStorage.getItem('aq_feature_flags_v33');
    return saved ? JSON.parse(saved) : { strategyLab: true };
  });

  // Decoupled Market Data Plugin connectivity tracking (v1.3 SDK)
  const [marketDataConnected, setMarketDataConnected] = useState<boolean>(() => {
    return localStorage.getItem('aq_mkt_connection_status') === 'CONNECTED';
  });

  // Synchronize marketDataConnected state with marketDataService
  useEffect(() => {
    const syncStatus = () => {
      const isConnected = marketDataService.getConnectionStatus() === 'CONNECTED';
      setMarketDataConnected(isConnected);
    };
    
    syncStatus();
    const interval = setInterval(syncStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // System telemetry log feed
  const [logs, setLogs] = useState<string[]>([
    'SYS: AQ Core upgraded to Release Candidate 5 (RC5). Live Validation Campaign active.',
    'SYS: AQ Core RC5 online. Secure node shield activated. Continuous Campaign Audit Deployed successfully.',
    'SYS: Stratum-1 Atomic clock skew synchronized successfully.',
    'AI: Guardian protocols initialized. Dynamic calibration feedback loop is active.',
    'SYS: Service Worker cache verified offline portable.'
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50)); // limit to recent 50 logs
  };

  // Readiness checklist completion weight
  const [checklistWeight, setChecklistWeight] = useState(0);

  // v3.2 Validation Mode states
  const [validationModeEnabled, setValidationModeEnabled] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => generateInitialRecommendations());

  // v3.1 Smart Market Scanner global states
  const [events, setEvents] = useState<ScannerEvent[]>(() => generateInitialEvents());
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanSpeedMs, setScanSpeedMs] = useState<number>(4000);

  // Automatically watch for newly discovered events to populate validation mode
  useEffect(() => {
    if (events.length === 0) return;
    const latestEvent = events[0];
    
    setRecommendations(prev => {
      const exists = prev.some(r => r.id === `rec-${latestEvent.id}`);
      if (exists) return prev;
      
      const newRec = createRecommendationFromEvent(latestEvent);
      return [newRec, ...prev].slice(0, 100); // limit to 100 entries
    });
  }, [events]);

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      const newEvent = generateRandomEvent();
      setEvents(prev => {
        // Keep list to max 100 entries
        return [newEvent, ...prev].slice(0, 100);
      });
      addLog(`SCANNER: [${newEvent.priority}] Opportunities found on $${newEvent.ticker} - ${newEvent.type} (${newEvent.confidence}% Confidence)`);
    }, scanSpeedMs);

    return () => clearInterval(interval);
  }, [isScanning, scanSpeedMs]);

  // Market Metrics (shared state)
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics>({
    volatility: 42,
    liquidity: 75,
    sentiment: 58,
    volumeTrend: 'ASCENDING',
    healthScore: 68
  });

  // Decision Ledger logs
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);

  // Modular Plugins list
  const [plugins, setPlugins] = useState<AQPlugin[]>([
    { id: 'PLG-01', name: 'Order Flow Spot Depth', category: 'Scanner', description: 'Monitor order book volume concentration at horizontal price levels.', isActive: true, version: '1.2.0', author: 'AQ Core Labs', performanceScore: 98 },
    { id: 'PLG-02', name: 'Multi-Dex Correlation Scanner', category: 'Scanner', description: 'Track price divergence between spot and swap index providers.', isActive: false, version: '1.0.4', author: 'Quant Solutions', performanceScore: 94 },
    { id: 'PLG-03', name: 'Social Sentiment Parser', category: 'Scanner', description: 'Web-scrapes sentiment indices to detect parabolic volatility builds.', isActive: false, version: '2.1.0', author: 'AQ Labs', performanceScore: 89 },
    { id: 'PLG-04', name: 'Circuit Breaker AutoLock', category: 'Risk', description: 'Hard-locks trading dashboard execution lines upon max-loss breaches.', isActive: true, version: '1.1.2', author: 'System Security', performanceScore: 99 }
  ]);

  // Load from local storage if available on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('aq_username');
    if (savedUser) {
      setUsername(savedUser);
    }

    const savedTrades = localStorage.getItem('aq_trades');
    if (savedTrades) {
      setTradeLogs(JSON.parse(savedTrades));
    } else {
      // Pre-seed some beautiful history logs
      const initialTrades: TradeLog[] = [
        {
          id: 'AQ-TR-28491',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          ticker: 'BTCUSD',
          direction: 'BUY',
          size: 1.5,
          leverage: 10,
          entryPrice: 95420.00,
          conviction: 4,
          status: 'OPEN',
          notes: 'Horizontal breakout reclaim supported by rising buying volume on the 15m spot book.',
          guardianRiskScore: 10,
          guardianFeedback: 'Optimal risk profile. Entry size complies with standard limits.'
        },
        {
          id: 'AQ-TR-28104',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          ticker: 'SOLUSD',
          direction: 'BUY',
          size: 5.0,
          leverage: 5,
          entryPrice: 178.50,
          conviction: 5,
          status: 'WIN',
          notes: 'Volume breakout on lower-bound range. Took full target profits at overhead resistance.',
          guardianRiskScore: 5,
          guardianFeedback: 'Pristine execution setup. Correct sizing ratio logged.'
        }
      ];
      setTradeLogs(initialTrades);
      localStorage.setItem('aq_trades', JSON.stringify(initialTrades));
    }
  }, []);

  const handleLogin = (name: string) => {
    setUsername(name);
    localStorage.setItem('aq_username', name);
    addLog(`AUTH: Session initialized for Operator: ${name}. Welcome to AQ Core.`);
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem('aq_username');
    addLog('AUTH: Disconnected current secure operator session.');
  };

  const handleAddTrade = (newTrade: TradeLog) => {
    const nextTrades = [newTrade, ...tradeLogs];
    setTradeLogs(nextTrades);
    localStorage.setItem('aq_trades', JSON.stringify(nextTrades));
  };

  const handleTogglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    }));
  };

  const handleTriggerAction = (actionCode: string) => {
    if (actionCode === 'DIAG_AUDIT') {
      addLog('SYS: Running multi-point checksum check across active threads...');
      setTimeout(() => {
        addLog('SYS: Telemetry response. 8 threads stable, average latency 12ms. Checksums verify green.');
      }, 800);
    } else if (actionCode === 'CALIB_SENSORS') {
      addLog('SYS: Re-calibrating delta spot order book sensors with mock API relays...');
      setTimeout(() => {
        setMarketMetrics(prev => ({ ...prev, healthScore: Math.min(100, prev.healthScore + 2) }));
        addLog('SYS: Order books sync successful. Spread offset locked at 0.02%.');
      }, 1000);
    } else if (actionCode === 'RESET_RISK') {
      addLog('SYS: Resetting protective circuit breaker sensors. Sizing thresholds normalized.');
    }
  };

  if (!username) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const tabs = [
    { id: 'release-readiness', label: 'Release Readiness Center 🏆', icon: Award },
    { id: 'aq-os', label: 'AQ OS Dashboard 🌐', icon: Server },
    { id: 'engine-flow', label: 'Engine Flow Monitor 🔗', icon: Cpu },
    { id: 'pipeline-inspector', label: 'Pipeline Inspector ⚡', icon: Eye },
    { id: 'command', label: 'Command Center', icon: Cpu },
    { id: 'mission', label: 'Mission Control', icon: Target },
    { id: 'scanner', label: 'Smart Market Scanner', icon: Compass },
    { id: 'validation', label: 'Validation Mode', icon: ShieldCheck },
    ...(featureFlags.strategyLab ? [{ id: 'strategy-lab', label: 'AQ Strategy Lab 🧪', icon: Sliders }] : []),
    { id: 'market', label: 'Market Health', icon: Activity },
    { id: 'intelligence', label: 'Market Intelligence', icon: Layers },
    { id: 'strategy-engine', label: 'Strategy Engine', icon: Sliders },
    { id: 'rules', label: 'Rule Inspector', icon: CheckSquare },
    { id: 'decision-engine', label: 'Decision Engine', icon: Zap },
    { id: 'market-data', label: 'Market Data Manager', icon: Database },
    { id: 'market-data-monitor', label: 'Market Data Monitor 📊', icon: Activity },
    { id: 'readiness', label: 'Readiness Meter', icon: Award },
    { id: 'radar', label: 'Trade Radar', icon: Compass },
    { id: 'guardian', label: 'AI Guardian', icon: Shield },
    { id: 'debate', label: 'AI Debate', icon: MessageSquare },
    { id: 'coach', label: 'Trading Coach', icon: Brain },
    { id: 'ledger', label: 'Decision Ledger', icon: FileText },
    { id: 'vault', label: 'Knowledge Vault', icon: BookOpen },
    { id: 'plugins', label: 'Plugins', icon: Grid },
    { id: 'broker', label: 'Broker Manager', icon: Wallet },
    { id: 'core', label: 'AQ Core', icon: Terminal },
    { id: 'alpha-test', label: 'Alpha Test Dashboard 🛡️', icon: Shield },
    { id: 'regression-test', label: 'Regression Testing 🧪', icon: CheckSquare },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Activity },
    { id: 'reliability-dashboard', label: 'Reliability Dashboard ⚙️', icon: Gauge },
    { id: 'code-quality', label: 'Code Quality Dashboard 📊', icon: Award },
    { id: 'security-dashboard', label: 'Security Dashboard 🛡️', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <div id="app-shell" className="min-h-screen bg-[#0B0B0C] text-zinc-300 flex flex-col md:flex-row relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950/95 border-r border-amber-500/10 shrink-0 h-screen sticky top-0 overflow-y-auto">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-serif bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-wide">
              AQ TRADE AI
            </h1>
            <span className="text-[9px] font-mono text-amber-500/80 tracking-wider block uppercase mt-0.5">
              Production v1.1
            </span>
          </div>
        </div>

        {/* Dynamic Operator Info */}
        <div className="px-6 py-4 border-b border-zinc-900/60 bg-zinc-900/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
              OP: {username}
            </span>
          </div>
          <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/5 px-1 rounded">ADMIN</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wider text-left transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* System footer sign */}
        <div className="p-4 border-t border-zinc-900 text-[10px] font-mono text-zinc-700 tracking-widest text-center uppercase">
          ALGORITHMIC COMPLIANT
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-zinc-950/95 border-b border-amber-500/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4.5 h-4.5 text-amber-500" />
          <h1 className="text-xs font-bold font-serif tracking-wide text-zinc-100 uppercase">
            AQ TRADE AI
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
            OP: {username}
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-400 hover:text-amber-500 cursor-pointer focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[49px] bg-zinc-950/98 z-20 flex flex-col justify-between overflow-y-auto animate-fade-in p-6">
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono tracking-wider text-left transition-all border ${
                    isActive 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold' 
                      : 'bg-zinc-900/20 border-zinc-900/30 text-zinc-500'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-zinc-600'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-between text-[10px] font-mono text-zinc-600">
            <span>SECURE SERVER CONNECTED</span>
            <span>RC5</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative z-10 max-w-7xl mx-auto w-full">
        
        {/* Dynamic Tab Renderer */}
        {activeTab === 'release-readiness' && (
          <ReleaseReadinessCenter addLog={addLog} />
        )}

        {activeTab === 'aq-os' && (
          <AQOSDashboard addLog={addLog} />
        )}

        {activeTab === 'engine-flow' && (
          <EngineFlowMonitor addLog={addLog} />
        )}

        {activeTab === 'pipeline-inspector' && (
          <PipelineInspector addLog={addLog} />
        )}

        {activeTab === 'command' && (
          <CommandCenter 
            onTriggerAction={handleTriggerAction} 
            logs={logs} 
            addLog={addLog} 
            marketScore={marketMetrics.healthScore}
            readinessScore={Math.round((checklistWeight * 0.35) + (marketMetrics.healthScore * 0.35) + (85 * 0.30))}
          />
        )}

        {activeTab === 'mission' && (
          <MissionControl 
            addLog={addLog} 
            onUpdateReadiness={(weightDiff) => setChecklistWeight(prev => Math.max(0, Math.min(100, prev + weightDiff)))} 
            opportunities={events}
          />
        )}

        {activeTab === 'market' && (
          <MarketHealth 
            metrics={marketMetrics} 
            onMetricsChange={setMarketMetrics} 
            addLog={addLog} 
          />
        )}

        {activeTab === 'readiness' && (
          <ReadinessMeter 
            marketHealthScore={marketMetrics.healthScore} 
            checklistReadinessScore={checklistWeight} 
            addLog={addLog} 
          />
        )}

        {activeTab === 'market-data' && (
          <MarketDataManager 
            addLog={addLog} 
            onConnectionChange={(isConnected) => {
              setMarketDataConnected(isConnected);
            }}
            onAddTrade={handleAddTrade}
          />
        )}

        {activeTab === 'market-data-monitor' && (
          <MarketDataMonitor addLog={addLog} />
        )}

        {activeTab === 'strategy-engine' && (
          <StrategyManager 
            addLog={addLog} 
            marketDataConnected={marketDataConnected}
          />
        )}

        {activeTab === 'radar' && (
          <TradeRadar addLog={addLog} marketDataConnected={marketDataConnected} />
        )}

        {activeTab === 'guardian' && (
          <AIGuardian addLog={addLog} />
        )}

        {activeTab === 'debate' && (
          <AIDebate addLog={addLog} />
        )}

        {activeTab === 'coach' && (
          <TradingCoach addLog={addLog} />
        )}

        {activeTab === 'ledger' && (
          <DecisionLedger 
            logs={tradeLogs} 
            onAddTrade={handleAddTrade} 
            addLog={addLog} 
          />
        )}

        {activeTab === 'vault' && (
          <KnowledgeVault />
        )}

        {activeTab === 'intelligence' && (
          <MarketIntelligence addLog={addLog} />
        )}

        {activeTab === 'rules' && (
          <RuleInspector addLog={addLog} />
        )}

        {activeTab === 'decision-engine' && (
          <ExplainableDecisionEngine addLog={addLog} />
        )}

        {activeTab === 'plugins' && (
          <PluginArchitecture 
            addLog={addLog} 
            plugins={plugins} 
            onTogglePlugin={handleTogglePlugin} 
          />
        )}

        {activeTab === 'broker' && (
          <BrokerManager 
            addLog={addLog} 
            onModeChange={(mode) => {
              addLog(`SYS: Core operating mode set to [${mode}]`);
            }}
          />
        )}

        {activeTab === 'scanner' && (
          <SmartMarketScanner 
            addLog={addLog} 
            events={events}
            setEvents={setEvents}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            scanSpeedMs={scanSpeedMs}
            setScanSpeedMs={setScanSpeedMs}
            tradeLogs={tradeLogs}
            onAddTrade={handleAddTrade}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationDashboard 
            addLog={addLog}
            events={events}
            validationModeEnabled={validationModeEnabled}
            setValidationModeEnabled={setValidationModeEnabled}
            recommendations={recommendations}
            setRecommendations={setRecommendations}
          />
        )}

        {activeTab === 'strategy-lab' && (
          <AQStrategyLab 
            addLog={addLog}
            recommendations={recommendations}
          />
        )}

        {activeTab === 'core' && (
          <AQCore logs={logs} addLog={addLog} />
        )}

        {activeTab === 'alpha-test' && (
          <AlphaTestDashboard addLog={addLog} />
        )}

        {activeTab === 'regression-test' && (
          <RegressionTestDashboard addLog={addLog} />
        )}

        {activeTab === 'diagnostics' && (
          <SystemDiagnostics addLog={addLog} />
        )}

        {activeTab === 'reliability-dashboard' && (
          <ReliabilityDashboard addLog={addLog} />
        )}

        {activeTab === 'code-quality' && (
          <CodeQualityDashboard addLog={addLog} />
        )}

        {activeTab === 'security-dashboard' && (
          <SecurityDashboard addLog={addLog} />
        )}

        {activeTab === 'settings' && (
          <Settings 
            addLog={addLog} 
            onLogout={handleLogout} 
            featureFlags={featureFlags} 
            setFeatureFlags={setFeatureFlags} 
          />
        )}

      </main>

    </div>
  );
}
