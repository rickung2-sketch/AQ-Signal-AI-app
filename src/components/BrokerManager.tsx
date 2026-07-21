import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldAlert, Wallet, Cpu, Power, CheckCircle, AlertTriangle, 
  Play, Square, DollarSign, Activity, Settings, RefreshCw, Key, TrendingUp, History, ClipboardList, Trash2
} from 'lucide-react';
import { registry } from '../plugins/brokerPluginRegistry';
import { BrokerMode, BrokerPlugin, BrokerPosition, BrokerTradeHistory, PaperAccount } from '../types/broker';
import PaperTradingDashboard from './PaperTradingDashboard';

interface BrokerManagerProps {
  addLog: (log: string) => void;
  onModeChange?: (mode: BrokerMode) => void;
  onActiveBrokerChange?: (plugin: BrokerPlugin | null) => void;
}

const DEFAULT_PAPER_ACCOUNT: PaperAccount = {
  balance: 100000.00,
  equity: 100000.00,
  margin: 0.00,
  positions: [],
  history: [
    {
      id: 'TX-PAP-1001',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      ticker: 'BTCUSD',
      direction: 'BUY',
      size: 1.0,
      leverage: 10,
      entryPrice: 94800.00,
      exitPrice: 95350.00,
      realizedPnl: 550.00,
      status: 'WIN',
      notes: 'Paper: Breakout support bounce target realized.'
    }
  ]
};

export default function BrokerManager({ addLog, onModeChange, onActiveBrokerChange }: BrokerManagerProps) {
  const [activeMode, setActiveMode] = useState<BrokerMode>('ANALYSIS');
  const [plugins, setPlugins] = useState<BrokerPlugin[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string>('');
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(false);
  const [showLiveWarning, setShowLiveWarning] = useState<boolean>(false);
  
  // Plugin Config states
  const [pluginConfig, setPluginConfig] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Paper Trading engine state
  const [paperAccount, setPaperAccount] = useState<PaperAccount>(DEFAULT_PAPER_ACCOUNT);

  // New simulated order state
  const [newOrderTicker, setNewOrderTicker] = useState('BTCUSD');
  const [newOrderDirection, setNewOrderDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [newOrderSize, setNewOrderSize] = useState<number>(0.5);
  const [newOrderLeverage, setNewOrderLeverage] = useState<number>(10);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  // Live Broker values (when connected)
  const [liveAccount, setLiveAccount] = useState<{
    balance: number;
    equity: number;
    margin: number;
    currency: string;
    positions: BrokerPosition[];
    history: BrokerTradeHistory[];
  } | null>(null);

  // Load from registry and localStorage
  useEffect(() => {
    const installed = registry.getPlugins();
    setPlugins(installed);
    if (installed.length > 0) {
      setSelectedPluginId(installed[0].id);
    }

    // Load active modes
    const savedMode = localStorage.getItem('aq_broker_mode') as BrokerMode;
    if (savedMode) {
      setActiveMode(savedMode);
      if (onModeChange) onModeChange(savedMode);
    }

    // Load Paper Account
    const savedPaper = localStorage.getItem('aq_paper_account');
    if (savedPaper) {
      try {
        setPaperAccount(JSON.parse(savedPaper));
      } catch (e) {
        console.error('Failed to parse paper account', e);
      }
    }
  }, []);

  // Update localStorage when mode changes
  const handleModeChange = (mode: BrokerMode) => {
    if (mode === 'LIVE' && !isLiveEnabled) {
      setShowLiveWarning(true);
      return;
    }

    setActiveMode(mode);
    localStorage.setItem('aq_broker_mode', mode);
    addLog(`BROKER: Switching to mode [${mode}]`);
    if (onModeChange) onModeChange(mode);

    if (mode === 'LIVE') {
      connectToLiveBroker();
    } else {
      setConnectionStatus('DISCONNECTED');
    }
  };

  const handleConfirmLiveActivation = () => {
    setIsLiveEnabled(true);
    setShowLiveWarning(false);
    setActiveMode('LIVE');
    localStorage.setItem('aq_broker_mode', 'LIVE');
    addLog('BROKER: OPERATOR CONFIRMED SYSTEM SECURE DEPLOYMENT. Live broker mode armed.');
    if (onModeChange) onModeChange('LIVE');
    connectToLiveBroker();
  };

  const handleDeactivateLive = () => {
    setIsLiveEnabled(false);
    setActiveMode('ANALYSIS');
    localStorage.setItem('aq_broker_mode', 'ANALYSIS');
    setConnectionStatus('DISCONNECTED');
    setLiveAccount(null);
    addLog('BROKER: Live broker routing has been decommissioned safely.');
    if (onModeChange) onModeChange('ANALYSIS');
  };

  // Fetch or setup configurations for the active plugin
  const activePlugin = plugins.find(p => p.id === selectedPluginId);

  useEffect(() => {
    if (activePlugin) {
      // Load credentials safely
      const configKey = `aq_broker_config_${activePlugin.id}`;
      const savedConfig = localStorage.getItem(configKey);
      if (savedConfig) {
        try {
          setPluginConfig(JSON.parse(savedConfig));
        } catch (e) {
          setPluginConfig({});
        }
      } else {
        const defaults: Record<string, string> = {};
        activePlugin.configSchema.forEach(f => {
          if (f.defaultValue) defaults[f.key] = f.defaultValue;
        });
        setPluginConfig(defaults);
      }
      
      if (onActiveBrokerChange) {
        onActiveBrokerChange(activePlugin);
      }
    }
  }, [selectedPluginId]);

  const handleConfigChange = (key: string, val: string) => {
    setPluginConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveConfig = () => {
    if (!activePlugin) return;
    const validation = activePlugin.validateConfig(pluginConfig);
    if (!validation.isValid) {
      addLog(`BROKER CONFIG ERROR: ${validation.error}`);
      alert(`Config validation failed: ${validation.error}`);
      return;
    }

    const configKey = `aq_broker_config_${activePlugin.id}`;
    localStorage.setItem(configKey, JSON.stringify(pluginConfig));
    addLog(`BROKER: Saved configurations securely for [${activePlugin.name}]`);
    alert(`Configuration validated and secured for ${activePlugin.name}`);
    
    if (activeMode === 'LIVE') {
      connectToLiveBroker();
    }
  };

  const connectToLiveBroker = async () => {
    if (!activePlugin) return;
    setConnectionStatus('CONNECTING');
    addLog(`BROKER: Attaching secure broker module [${activePlugin.name}]...`);
    
    // Simulate slight loading latency
    setTimeout(async () => {
      try {
        const validation = activePlugin.validateConfig(pluginConfig);
        if (!validation.isValid) {
          setConnectionStatus('DISCONNECTED');
          addLog(`BROKER: Handshake failed. Configuration verification error: ${validation.error}`);
          return;
        }

        const details = await activePlugin.getAccountDetails(pluginConfig);
        const positions = await activePlugin.getPositions(pluginConfig);
        const history = await activePlugin.getTradeHistory(pluginConfig);

        setLiveAccount({
          balance: details.balance,
          equity: details.equity,
          margin: details.margin,
          currency: details.currency,
          positions,
          history
        });
        setConnectionStatus('CONNECTED');
        addLog(`BROKER: Secure link locked! Connected to [${activePlugin.name}] with live portfolio routing.`);
      } catch (err) {
        setConnectionStatus('DISCONNECTED');
        addLog(`BROKER: Connection failed to remote endpoint.`);
      }
    }, 1200);
  };

  // Simulated live prices for basic calculation
  const getSimulatedPrice = (ticker: string): number => {
    if (ticker.includes('BTC')) return 96420.00;
    if (ticker.includes('ETH')) return 3280.00;
    if (ticker.includes('SOL')) return 184.50;
    if (ticker.includes('GLD')) return 2435.00;
    return 100.00;
  };

  // Recalculate Paper Account portfolio values
  useEffect(() => {
    if (activeMode === 'PAPER') {
      let activeMargin = 0;
      let unrealizedPnlSum = 0;

      const updatedPositions = paperAccount.positions.map(pos => {
        const curPrice = getSimulatedPrice(pos.ticker);
        const diff = curPrice - pos.entryPrice;
        const pnlMultiplier = pos.direction === 'BUY' ? 1 : -1;
        const unrealizedPnl = diff * pos.size * pnlMultiplier * pos.leverage;
        const marginRequired = (pos.size * pos.entryPrice) / pos.leverage;
        
        activeMargin += marginRequired;
        unrealizedPnlSum += unrealizedPnl;

        return {
          ...pos,
          currentPrice: curPrice,
          unrealizedPnl,
          marginRequired
        };
      });

      const nextEquity = paperAccount.balance + unrealizedPnlSum;
      
      const updatedAccount = {
        ...paperAccount,
        equity: nextEquity,
        margin: activeMargin,
        positions: updatedPositions
      };

      if (JSON.stringify(updatedAccount) !== JSON.stringify(paperAccount)) {
        setPaperAccount(updatedAccount);
        localStorage.setItem('aq_paper_account', JSON.stringify(updatedAccount));
      }
    }
  }, [activeMode, paperAccount.positions, paperAccount.balance]);

  // Execute Simulated / Live Trade
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderMessage(null);

    const price = getSimulatedPrice(newOrderTicker);

    if (activeMode === 'ANALYSIS') {
      setOrderMessage('❌ Order rejected: "Analysis Only" mode allows market diagnostics only. No execution.');
      addLog('BROKER DETECT: Denied order attempt in ANALYSIS mode.');
      return;
    }

    if (activeMode === 'LIVE') {
      if (connectionStatus !== 'CONNECTED' || !activePlugin) {
        setOrderMessage('❌ Order rejected: Broker disconnected. Secure routing tunnel offline.');
        return;
      }

      addLog(`BROKER: Routing live ${newOrderDirection} order for ${newOrderSize} ${newOrderTicker} with ${newOrderLeverage}x leverage...`);
      try {
        const res = await activePlugin.submitOrder(pluginConfig, {
          ticker: newOrderTicker,
          direction: newOrderDirection,
          size: newOrderSize,
          leverage: newOrderLeverage,
          type: 'MARKET'
        });

        if (res.success) {
          setOrderMessage(`✅ Live execution success! ID: ${res.orderId}. Fill Price: $${res.fillPrice}`);
          addLog(`BROKER SUCCESS: Live filled ${newOrderDirection} ${newOrderTicker} at $${res.fillPrice}`);
          
          // Pull updated state from active plugin
          const positions = await activePlugin.getPositions(pluginConfig);
          const history = await activePlugin.getTradeHistory(pluginConfig);
          setLiveAccount(prev => prev ? {
            ...prev,
            positions,
            history
          } : null);
        } else {
          setOrderMessage(`❌ Live rejection: ${res.message}`);
          addLog(`BROKER REJECTED: Order failed - ${res.message}`);
        }
      } catch (err) {
        setOrderMessage('❌ Execution system failure: Remote broker connection timed out.');
      }
      return;
    }

    // PAPER TRADING LOGIC
    if (activeMode === 'PAPER') {
      const marginReq = (newOrderSize * price) / newOrderLeverage;
      
      // Verification limits
      if (marginReq > (paperAccount.balance - paperAccount.margin)) {
        setOrderMessage('❌ Order rejected: Insufficient simulated free margin.');
        addLog('PAPER ENGINE: Denied order due to margin breach.');
        return;
      }

      const newPosition: BrokerPosition = {
        id: `POS-PAP-${Math.floor(100000 + Math.random() * 900000)}`,
        ticker: newOrderTicker,
        direction: newOrderDirection,
        size: newOrderSize,
        leverage: newOrderLeverage,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        marginRequired: marginReq,
        timestamp: new Date().toISOString()
      };

      const updatedAccount = {
        ...paperAccount,
        positions: [...paperAccount.positions, newPosition]
      };

      setPaperAccount(updatedAccount);
      localStorage.setItem('aq_paper_account', JSON.stringify(updatedAccount));
      setOrderMessage(`✅ Paper order executed: Opened ${newOrderDirection} position for ${newOrderSize} ${newOrderTicker} at $${price}`);
      addLog(`PAPER ENGINE: Opened position [${newPosition.id}]`);
    }
  };

  const handleClosePosition = async (posId: string) => {
    if (activeMode === 'LIVE') {
      if (!activePlugin) return;
      addLog(`BROKER: Transmitting close position request for ${posId}...`);
      alert('In Live mode, positions are liquidated through standard clearing. Closing position simulated.');
      return;
    }

    // Close paper position
    if (activeMode === 'PAPER') {
      const pos = paperAccount.positions.find(p => p.id === posId);
      if (!pos) return;

      const exitPrice = getSimulatedPrice(pos.ticker);
      const diff = exitPrice - pos.entryPrice;
      const pnlMultiplier = pos.direction === 'BUY' ? 1 : -1;
      const finalRealizedPnl = diff * pos.size * pnlMultiplier * pos.leverage;

      const nextHistoryItem: BrokerTradeHistory = {
        id: `TX-PAP-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        ticker: pos.ticker,
        direction: pos.direction,
        size: pos.size,
        leverage: pos.leverage,
        entryPrice: pos.entryPrice,
        exitPrice: exitPrice,
        realizedPnl: finalRealizedPnl,
        status: finalRealizedPnl >= 0 ? 'WIN' : 'LOSS',
        notes: 'Paper position closed manually via portfolio manager.'
      };

      const nextPositions = paperAccount.positions.filter(p => p.id !== posId);
      const nextBalance = paperAccount.balance + finalRealizedPnl;

      const updatedAccount = {
        ...paperAccount,
        balance: nextBalance,
        positions: nextPositions,
        history: [nextHistoryItem, ...paperAccount.history]
      };

      setPaperAccount(updatedAccount);
      localStorage.setItem('aq_paper_account', JSON.stringify(updatedAccount));
      addLog(`PAPER ENGINE: Liquidated position ${posId}. Realized PNL: $${finalRealizedPnl.toFixed(2)}`);
    }
  };

  const handleResetPaperAccount = () => {
    if (window.confirm('Are you sure you want to completely reset simulated paper account funds and metrics?')) {
      setPaperAccount(DEFAULT_PAPER_ACCOUNT);
      localStorage.setItem('aq_paper_account', JSON.stringify(DEFAULT_PAPER_ACCOUNT));
      addLog('PAPER ENGINE: Core paper account reset to default $100,000 balance.');
    }
  };

  const activeBalance = activeMode === 'LIVE' ? (liveAccount?.balance ?? 0) : (activeMode === 'PAPER' ? paperAccount.balance : 0);
  const activeEquity = activeMode === 'LIVE' ? (liveAccount?.equity ?? 0) : (activeMode === 'PAPER' ? paperAccount.equity : 0);
  const activeMargin = activeMode === 'LIVE' ? (liveAccount?.margin ?? 0) : (activeMode === 'PAPER' ? paperAccount.margin : 0);
  const activePositions = activeMode === 'LIVE' ? (liveAccount?.positions ?? []) : (activeMode === 'PAPER' ? paperAccount.positions : []);
  const activeHistory = activeMode === 'LIVE' ? (liveAccount?.history ?? []) : (activeMode === 'PAPER' ? paperAccount.history : []);

  return (
    <div className="space-y-6">
      
      {/* Operating Mode Selector Banner */}
      <div id="operating-mode-banner" className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        
        {/* Ambient gold pulse element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
        
        <div className="space-y-1 relative z-10">
          <span className="text-[9px] font-mono text-amber-500/80 tracking-widest block uppercase">VERSION 0.9 QUANT ENGINE</span>
          <h2 className="text-sm font-bold font-serif text-zinc-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-500" />
            BROKER CONNECT MANAGER
          </h2>
          <p className="text-[11px] font-mono text-zinc-500 leading-relaxed max-w-xl">
            Register customizable broker plugins, swap simulation engines, or arm live institutional routing ports directly to your decision dashboard safely.
          </p>
        </div>

        {/* Triple Operating Mode Button Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800/80 rounded-xl p-1 relative z-10 shrink-0">
          <button
            id="mode-btn-analysis"
            onClick={() => handleModeChange('ANALYSIS')}
            className={`px-4 py-2 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
              activeMode === 'ANALYSIS'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ANALYSIS ONLY
          </button>
          
          <button
            id="mode-btn-paper"
            onClick={() => handleModeChange('PAPER')}
            className={`px-4 py-2 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
              activeMode === 'PAPER'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            PAPER TRADING
          </button>

          <button
            id="mode-btn-live"
            onClick={() => handleModeChange('LIVE')}
            className={`px-4 py-2 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
              activeMode === 'LIVE'
                ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : 'text-zinc-500 hover:text-red-400'
            }`}
          >
            LIVE BROKER
          </button>
        </div>
      </div>

      {activeMode === 'PAPER' ? (
        <PaperTradingDashboard addLog={addLog} />
      ) : (
        <>
          {/* Warnings & Activations */}
          {showLiveWarning && (
            <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex gap-3.5 items-start">
                <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                    ⚠️ INSTITUTIONAL PROTOCOL: LIVE BROKER CONNECTION WARNING
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    You are requesting activation of Live Clearing lines. This will allow the AQ Core dashboard to route capital commands to third-party accounts.
                    <br />
                    <span className="text-amber-500/90 font-semibold">• Ensure and double-check key sandboxes and mock API endpoint rules.</span>
                    <br />
                    <span className="text-amber-500/90 font-semibold">• AQ Core acts strictly as a local visual terminal. All secret tokens are stored securely on your local web storage.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowLiveWarning(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-lg text-[10px] font-mono cursor-pointer transition-all"
                >
                  CANCEL PROTOCOL
                </button>
                <button
                  id="confirm-live-btn"
                  onClick={handleConfirmLiveActivation}
                  className="bg-red-600 hover:bg-red-500 border border-red-500 hover:border-red-400 text-white px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-widest cursor-pointer transition-all"
                >
                  ACKNOWLEDGE & ARM LIVE ROUTING
                </button>
              </div>
            </div>
          )}

          {/* Connection Info Block & Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column: Connection / Configuration */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6">
              <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  INTEGRATION GATEWAY
                </h3>
                
                {/* Status indicators */}
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    activeMode === 'ANALYSIS' ? 'bg-zinc-600' :
                    connectionStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' :
                    connectionStatus === 'CONNECTING' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'
                  }`} />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    {activeMode === 'ANALYSIS' ? 'ANALYSIS ACTIVE' : connectionStatus}
                  </span>
                </div>
              </div>

              {activeMode === 'ANALYSIS' ? (
                <div className="p-8 border border-dashed border-zinc-900 rounded-lg text-center space-y-3.5">
                  <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400 block font-serif">"Analysis Mode Active"</span>
                    <span className="text-[10px] font-mono text-zinc-600 block leading-relaxed">
                      No active broker routing tunnel is mapped. Decision engines and checklists will compute analytics, signals, and coach dialogues safely without executing order streams.
                    </span>
                  </div>
                </div>
              ) : activeMode === 'PAPER' ? (
                <div className="space-y-4">
                  <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">PAPER ENGINE SPEED: REALTIME</span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                      The local simulator models order execution lines with immediate virtual slippage logic. You can deposit and reset virtual balances at any time.
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-[#0C0C0D] border border-zinc-900/60 p-3 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-500">Virtual balance reset</span>
                    <button
                      onClick={handleResetPaperAccount}
                      className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-500 p-1 px-3.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer"
                    >
                      RESET PORTFOLIO
                    </button>
                  </div>
                </div>
              ) : (
                /* LIVE PLUGIN CONNECTOR */
                <div className="space-y-5">
                  {/* Plugin selection drop */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block">SELECT REGISTERED BROKER MODULE</label>
                    <select
                      id="broker-plugin-select"
                      value={selectedPluginId}
                      onChange={(e) => setSelectedPluginId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-amber-500/40"
                    >
                      {plugins.length === 0 ? (
                        <option value="">No broker plugins detected</option>
                      ) : (
                        plugins.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                        ))
                      )}
                    </select>
                  </div>

                  {activePlugin ? (
                    <div className="space-y-4">
                      <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono text-zinc-600 block">ID: {activePlugin.id} • AUTHOR: {activePlugin.author}</span>
                        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">{activePlugin.description}</p>
                      </div>

                      {/* Schema fields */}
                      <div className="space-y-3.5 pt-2 border-t border-zinc-900/60">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">AUTHENTICATION CREDENTIALS</span>
                        
                        {activePlugin.configSchema.map(field => (
                          <div key={field.key} className="space-y-1.5">
                            <label className="text-[10px] font-mono text-zinc-400 block">{field.label}</label>
                            <div className="relative">
                              <input
                                type={field.type}
                                value={pluginConfig[field.key] || ''}
                                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full bg-zinc-900 border border-zinc-850 focus:border-amber-500/30 text-zinc-200 text-xs font-mono py-1.5 px-3 rounded-lg pr-8 focus:outline-none placeholder-zinc-700"
                              />
                              <Key className="w-3.5 h-3.5 text-zinc-700 absolute right-3 top-2" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2.5 pt-3">
                        <button
                          id="save-broker-config-btn"
                          onClick={handleSaveConfig}
                          className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider cursor-pointer transition-all"
                        >
                          SAVE CONFIG
                        </button>
                        {isLiveEnabled && (
                          <button
                            onClick={handleDeactivateLive}
                            className="bg-red-950/40 hover:bg-red-950/60 border border-red-900/60 text-red-400 py-2 px-4 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all"
                          >
                            DEACTIVATE LIVE
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-zinc-600 text-center">No modular broker loaded.</p>
                  )}
                </div>
              )}
            </div>

            {/* Middle and Right: Balances, telemetry and Open Positions */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Portfolio Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Balance Card */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">AVAILABLE PORTFOLIO</span>
                    <span id="display-balance" className="text-xl font-bold font-mono text-zinc-100 block">
                      {activeMode === 'ANALYSIS' ? '--' : `$${activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 block">Base Liquid Assets</span>
                  </div>
                  <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </div>
                </div>

                {/* Equity Card */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">PORTFOLIO EQUITY</span>
                    <span id="display-equity" className="text-xl font-bold font-mono text-zinc-100 block">
                      {activeMode === 'ANALYSIS' ? '--' : `$${activeEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 block">PnL adjusted assets</span>
                  </div>
                  <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                </div>

                {/* Margin Card */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">LOCKED MARGIN</span>
                    <span id="display-margin" className="text-xl font-bold font-mono text-zinc-100 block text-amber-500">
                      {activeMode === 'ANALYSIS' ? '--' : `$${activeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 block">Maintenance required</span>
                  </div>
                  <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                    <Activity className="w-4 h-4 text-amber-500" />
                  </div>
                </div>

              </div>

              {/* Simulated Trade Execution Tool */}
              {activeMode !== 'ANALYSIS' && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                  <div className="border-b border-zinc-900 pb-3">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                      DIRECT EXECUTION PANEL
                    </h4>
                  </div>

                  <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase block">Asset Ticker</label>
                      <select
                        value={newOrderTicker}
                        onChange={(e) => setNewOrderTicker(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono py-1.5 px-3 rounded-lg focus:outline-none"
                      >
                        <option value="BTCUSD">BTCUSD (Spot)</option>
                        <option value="ETHUSD">ETHUSD (Spot)</option>
                        <option value="SOLUSD">SOLUSD (Spot)</option>
                        <option value="GLDUSD">GLDUSD (Commodity)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase block">Direction</label>
                      <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setNewOrderDirection('BUY')}
                          className={`flex-1 text-[10px] py-1 font-mono font-bold rounded-md transition-all cursor-pointer ${
                            newOrderDirection === 'BUY' ? 'bg-green-600 text-black' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          LONG
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewOrderDirection('SELL')}
                          className={`flex-1 text-[10px] py-1 font-mono font-bold rounded-md transition-all cursor-pointer ${
                            newOrderDirection === 'SELL' ? 'bg-red-600 text-black' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          SHORT
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase block">Size (Lots)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newOrderSize}
                        onChange={(e) => setNewOrderSize(parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-250 text-xs font-mono py-1.5 px-3 rounded-lg focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs py-2 px-4 rounded-lg tracking-wider cursor-pointer transition-all"
                    >
                      TRANSMIT ORDER
                    </button>
                  </form>

                  {orderMessage && (
                    <div className="bg-[#0C0C0D] border border-zinc-900 p-3 rounded-lg">
                      <p className="text-[11px] font-mono text-zinc-300">{orderMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Open Positions List */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
                <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    ACTIVE OPEN POSITIONS ({activePositions.length})
                  </h3>
                  <span className="text-[9px] font-mono text-zinc-600">LIVE FEED</span>
                </div>

                {activePositions.length === 0 ? (
                  <p className="text-[10px] font-mono text-zinc-600 text-center py-8">
                    {activeMode === 'ANALYSIS' ? 'Connect a broker mode to trace open positions.' : 'No open active portfolio risk positions recorded.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[9px] tracking-wider pb-2">
                          <th className="py-2">Asset ID</th>
                          <th>Direction</th>
                          <th>Size / Lev</th>
                          <th>Entry Price</th>
                          <th>Current Price</th>
                          <th className="text-right">Unrealized PnL</th>
                          <th className="text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60">
                        {activePositions.map((pos) => (
                          <tr key={pos.id} className="hover:bg-zinc-900/10">
                            <td className="py-3 text-zinc-300 font-bold">{pos.ticker} <span className="text-[8px] text-zinc-600 block">{pos.id}</span></td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pos.direction === 'BUY' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 'bg-red-950/40 text-red-400 border border-red-900/30'}`}>
                                {pos.direction === 'BUY' ? 'LONG' : 'SHORT'}
                              </span>
                            </td>
                            <td className="py-3 text-zinc-400">{pos.size} Lots <span className="text-[8px] text-zinc-600 block">{pos.leverage}x</span></td>
                            <td className="py-3 text-zinc-400">${pos.entryPrice.toLocaleString()}</td>
                            <td className="py-3 text-zinc-300 font-bold">${pos.currentPrice.toLocaleString()}</td>
                            <td className={`py-3 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-right pr-2">
                              <button
                                onClick={() => handleClosePosition(pos.id)}
                                className="bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 p-1 px-2.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer"
                              >
                                LIQUIDATE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Trade History */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
                <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    BROKER TRADE HISTORY ({activeHistory.length})
                  </h3>
                  <span className="text-[9px] font-mono text-zinc-600">SECURE LOG</span>
                </div>

                {activeHistory.length === 0 ? (
                  <p className="text-[10px] font-mono text-zinc-600 text-center py-8">
                    No archived trade records detected for current account profile.
                  </p>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[9px] tracking-wider pb-2">
                          <th className="py-2">Date / ID</th>
                          <th>Asset</th>
                          <th>Direction</th>
                          <th>Size / Lev</th>
                          <th>Entry/Exit Price</th>
                          <th className="text-right pr-2">Realized PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60">
                        {activeHistory.map((history) => (
                          <tr key={history.id} className="hover:bg-zinc-900/10">
                            <td className="py-3 text-zinc-500">
                              {new Date(history.timestamp).toLocaleTimeString()}
                              <span className="text-[8px] text-zinc-600 block">{history.id}</span>
                            </td>
                            <td className="py-3 text-zinc-300 font-bold">{history.ticker}</td>
                            <td className="py-3">
                              <span className={`px-1 rounded text-[9px] font-bold ${history.direction === 'BUY' ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'}`}>
                                {history.direction}
                              </span>
                            </td>
                            <td className="py-3 text-zinc-400">{history.size} Lots <span className="text-[8px] text-zinc-600 block">{history.leverage}x</span></td>
                            <td className="py-3 text-zinc-400">
                              ${history.entryPrice.toLocaleString()} / <span className="text-zinc-300 font-semibold">${history.exitPrice.toLocaleString()}</span>
                            </td>
                            <td className={`py-3 text-right pr-2 font-bold ${history.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {history.realizedPnl >= 0 ? '+' : ''}${history.realizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
