import React, { useState } from 'react';
import { TradeLog } from '../types/dashboard';
import { FileText, Plus, CheckCircle, ShieldAlert, AlertCircle, Heart, Award } from 'lucide-react';
import { loadGuardianConfig, evaluateGuardianRisk } from '../plugins/guardianRiskEngine';

interface DecisionLedgerProps {
  logs: TradeLog[];
  onAddTrade: (trade: TradeLog) => void;
  addLog: (log: string) => void;
}

export default function DecisionLedger({ logs, onAddTrade, addLog }: DecisionLedgerProps) {
  const [ticker, setTicker] = useState('');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [size, setSize] = useState('1.0');
  const [leverage, setLeverage] = useState('10');
  const [entryPrice, setEntryPrice] = useState('');
  const [conviction, setConviction] = useState(3);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !entryPrice) return;

    // Evaluate live V2.2 Guardian Risk Engine
    const guardianConfig = loadGuardianConfig();
    const guardianEval = evaluateGuardianRisk(guardianConfig);
    
    const sizeNum = parseFloat(size);
    const leverageNum = parseInt(leverage);

    let guardianScore = guardianConfig.volatilityIndex;
    let guardianFeedback = `[${guardianEval.status}] ${guardianEval.overallReason}`;

    // Extra dynamic modifiers if they override extreme levels manually in this form
    if (leverageNum > 20) {
      guardianScore = Math.min(100, guardianScore + 30);
      guardianFeedback = `[BLOCKED] CRITICAL OVERRIDE: High leverage (${leverageNum}x) exceeds safe broker margins.`;
    }

    const newTrade: TradeLog = {
      id: `AQ-TR-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      ticker: ticker.toUpperCase(),
      direction,
      size: sizeNum,
      leverage: leverageNum,
      entryPrice: parseFloat(entryPrice),
      conviction,
      status: 'OPEN',
      notes,
      guardianRiskScore: guardianScore,
      guardianFeedback
    };

    onAddTrade(newTrade);
    addLog(`LEDGER: Created new trade log entry: $${ticker.toUpperCase()} ${direction} @ $${entryPrice} [Conviction ${conviction}/5] - Guardian: ${guardianEval.status}`);
    
    // Clear Form
    setTicker('');
    setEntryPrice('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            AQ DECISION LEDGER
          </h2>
          <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase mt-1">
            Official immutable log of trading decisions, convictions, and rationales
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'CLOSE LOGGER' : 'CREATE ENTRY'}
        </button>
      </div>

      {/* New Log Form Modal-styled or Expanded banner */}
      {isAdding && (
        <form onSubmit={handleSubmitLog} className="bg-zinc-950 border border-amber-500/30 rounded-xl p-6 space-y-4 animate-fade-in">
          <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase border-b border-zinc-900 pb-2">
            LOG NEW DECISION
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ticker */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">TICKER SYMBOL</label>
              <input
                type="text"
                required
                placeholder="e.g. BTCUSD"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 font-mono uppercase focus:outline-none focus:border-amber-500/40"
              />
            </div>

            {/* Direction */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">DIRECTION</label>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {(['BUY', 'SELL'] as const).map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDirection(dir)}
                    className={`flex-1 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                      direction === dir 
                        ? dir === 'BUY' 
                          ? 'bg-green-950/40 text-green-400 border border-green-900/40' 
                          : 'bg-red-950/40 text-red-400 border border-red-900/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">LOT SIZE</label>
              <input
                type="number"
                step="0.01"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
              />
            </div>

            {/* Leverage */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">LEVERAGE CAP</label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
              >
                {['1', '2', '5', '10', '20', '50'].map(lev => (
                  <option key={lev} value={lev}>{lev}x</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entry price */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">ENTRY TRIGGER PRICE ($)</label>
              <input
                type="number"
                step="0.0001"
                required
                placeholder="e.g. 96420.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 font-mono focus:outline-none"
              />
            </div>

            {/* Conviction (1-5) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">CONVICTION CONFIDENCE RATING</label>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setConviction(rating)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                      conviction === rating 
                        ? 'bg-amber-500 text-black' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {rating}★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">STRATEGIC RATIONALE / LESSON LOG</label>
            <textarea
              required
              rows={3}
              placeholder="List horizontal support zones, funding rates, or emotional state details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-serif focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-semibold font-mono text-xs tracking-widest py-3 px-4 rounded-lg uppercase cursor-pointer"
          >
            IMMUTABLY LOG IN DECISION LEDGER
          </button>
        </form>
      )}

      {/* Decision ledger history list */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 overflow-hidden">
        <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-4">
          LEDGER TRANSACTION RECORD
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs font-serif text-zinc-400">No decisions logged in this session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-zinc-400 divide-y divide-zinc-900">
              <thead>
                <tr className="text-[10px] tracking-wider text-zinc-500 uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">ASSET</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">LOTS</th>
                  <th className="py-3 px-4">ENTRY</th>
                  <th className="py-3 px-4">CONVICTION</th>
                  <th className="py-3 px-4">GUARDIAN REVIEW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-4 px-4 text-zinc-600">{log.id}</td>
                    <td className="py-4 px-4 text-zinc-500">{new Date(log.timestamp).toLocaleDateString()}</td>
                    <td className="py-4 px-4 font-bold text-zinc-200">${log.ticker}</td>
                    <td className="py-4 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.direction === 'BUY' ? 'bg-green-950/40 text-green-400 border border-green-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                      }`}>
                        {log.direction}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono">{log.size} Lots ({log.leverage}x)</td>
                    <td className="py-4 px-4 text-zinc-200 font-bold">${log.entryPrice}</td>
                    <td className="py-4 px-4 text-amber-500 font-bold">{log.conviction}★</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {log.guardianRiskScore > 30 ? (
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        )}
                        <span className={`text-[10px] truncate max-w-[200px] ${
                          log.guardianRiskScore > 30 ? 'text-red-400/80' : 'text-zinc-500'
                        }`}>
                          {log.guardianFeedback}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
