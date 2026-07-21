import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, BookOpen, Award, TrendingUp, TrendingDown, 
  Activity, CheckCircle2, XCircle, Edit3, Save, FileText, Check, 
  Eye, RefreshCw, AlertCircle, MessageSquare, Shield, HelpCircle, Calendar, Clock, DollarSign
} from 'lucide-react';
import { paperTradingEngine } from '../plugins/paperTradingEngine';
import { JournalEntry } from '../types/paperTrading';

interface TradeJournalViewProps {
  addLog: (log: string) => void;
}

export default function TradeJournalView({ addLog }: TradeJournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [exitReasonFilter, setExitReasonFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PNL_DESC' | 'PNL_ASC' | 'CONFIDENCE_DESC'>('NEWEST');
  
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingLessons, setEditingLessons] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load entries on mount & subscribe to any updates
  useEffect(() => {
    const loadData = () => {
      const journalData = paperTradingEngine.getJournalEntries();
      setEntries(journalData);
    };
    
    loadData();
    // Use account subscription to refresh if a trade completes in background
    const unsubscribe = paperTradingEngine.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Sync lessons learned state when entry details are viewed
  useEffect(() => {
    if (selectedEntry) {
      setEditingLessons(selectedEntry.lessonsLearned);
      setSaveSuccess(false);
    }
  }, [selectedEntry]);

  const handleSaveLessons = () => {
    if (!selectedEntry) return;
    
    paperTradingEngine.updateJournalEntry(selectedEntry.id, editingLessons);
    
    // Update local entries state to reflect change instantly
    setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, lessonsLearned: editingLessons } : e));
    setSelectedEntry(prev => prev ? { ...prev, lessonsLearned: editingLessons } : null);
    
    setSaveSuccess(true);
    addLog(`JOURNAL: Updated operator lessons learned for entry ${selectedEntry.id}`);
    
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  // Searching & Filtering logic
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.tradeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOutcome = outcomeFilter === 'ALL' || 
                           (outcomeFilter === 'WIN' && entry.profitAndLoss > 0) ||
                           (outcomeFilter === 'LOSS' && entry.profitAndLoss < 0);
                           
    const matchesDirection = directionFilter === 'ALL' || entry.direction === directionFilter;
    
    const matchesExit = exitReasonFilter === 'ALL' || entry.exitReason === exitReasonFilter;
    
    return matchesSearch && matchesOutcome && matchesDirection && matchesExit;
  });

  // Sorting logic
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime();
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime();
    }
    if (sortBy === 'PNL_DESC') {
      return b.profitAndLoss - a.profitAndLoss;
    }
    if (sortBy === 'PNL_ASC') {
      return a.profitAndLoss - b.profitAndLoss;
    }
    if (sortBy === 'CONFIDENCE_DESC') {
      return b.confidence - a.confidence;
    }
    return 0;
  });

  // Export report to CSV file
  const exportToCSV = () => {
    if (sortedEntries.length === 0) {
      alert('No journal records found to export.');
      return;
    }

    const headers = ['Journal ID', 'Trade ID', 'Ticker', 'Direction', 'Entry Price', 'Exit Price', 'P&L ($)', 'R-Multiple', 'Exit Reason', 'Confidence (%)', 'Readiness Score', 'Entry Time', 'Exit Time', 'Lessons Learned'];
    const rows = sortedEntries.map(e => [
      e.id,
      e.tradeId,
      e.ticker,
      e.direction,
      e.entryPrice,
      e.exitPrice,
      e.profitAndLoss,
      e.rMultiple,
      e.exitReason,
      e.confidence,
      e.readinessScore,
      e.entryTime,
      e.exitTime,
      `"${e.lessonsLearned.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AQ_Trade_Journal_Report_RC4_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`JOURNAL: Successfully exported ${sortedEntries.length} records to CSV report.`);
  };

  // Export report to Markdown Digest
  const exportToMarkdown = () => {
    if (sortedEntries.length === 0) {
      alert('No journal records found to export.');
      return;
    }

    let md = `# AQ TRADE AI RC4 - AUTOMATIC TRADE JOURNAL REPORT\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n`;
    md += `**Total Records:** ${sortedEntries.length}\n`;
    md += `**Total P&L:** $${sortedEntries.reduce((sum, e) => sum + e.profitAndLoss, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`;
    md += `| ID | Ticker | Dir | Entry | Exit | Net P&L | R-Mult | Confidence | Exit Reason |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    sortedEntries.forEach(e => {
      md += `| ${e.id} | ${e.ticker} | ${e.direction} | $${e.entryPrice.toFixed(2)} | $${e.exitPrice.toFixed(2)} | **$${e.profitAndLoss.toFixed(2)}** | ${e.rMultiple}R | ${e.confidence}% | ${e.exitReason} |\n`;
    });

    md += `\n\n## DETAIL RECORD DIGEST\n\n`;

    sortedEntries.forEach(e => {
      md += `### [${e.id}] ${e.ticker} ${e.direction} - Outcome: ${e.profitAndLoss >= 0 ? 'PROFIT' : 'LOSS'}\n`;
      md += `- **Trade ID:** ${e.tradeId}\n`;
      md += `- **Duration:** ${Math.round((new Date(e.exitTime).getTime() - new Date(e.entryTime).getTime()) / 1000)} seconds\n`;
      md += `- **Confidence Level:** ${e.confidence}%\n`;
      md += `- **Readiness Index:** ${e.readinessScore}%\n`;
      md += `- **Market Health Score:** ${e.marketHealth.healthScore}%\n`;
      md += `\n#### Entry Reasoning:\n> ${e.entryReasoning}\n`;
      md += `\n#### Guardian Evaluation:\n> ${e.guardianReasoning}\n`;
      md += `\n#### AI Debate Summary:\n> ${e.aiDebateSummary}\n`;
      md += `\n#### Passed Rules:\n`;
      e.passedRules.forEach(r => {
        md += `- **${r.name}**: ${r.explanation}\n`;
      });
      if (e.failedRules.length > 0) {
        md += `\n#### Failed/Skipped Rules:\n`;
        e.failedRules.forEach(r => {
          md += `- **${r.name}**: ${r.explanation}\n`;
        });
      }
      md += `\n#### Operator Lessons Learned:\n> ${e.lessonsLearned}\n`;
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AQ_Trade_Journal_Digest_RC4_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`JOURNAL: Successfully exported ${sortedEntries.length} records to Markdown Digest report.`);
  };

  // Beautiful Vector SVG Trade Screenshot Mockup Generator
  const TradeScreenshotMockup = ({ entry }: { entry: JournalEntry }) => {
    const isWin = entry.profitAndLoss >= 0;
    const isBuy = entry.direction === 'BUY';
    
    // We will generate a nice line path for the asset price action
    // Simulating a breakout or breakdown path
    let points = '';
    const width = 450;
    const height = 180;
    const steps = 12;
    const yCenter = height / 2;
    
    const randomSeed = entry.id.charCodeAt(5) + entry.id.charCodeAt(6);
    
    // Compute realistic price data curve points
    const pArray: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i;
      let y = yCenter;
      
      // Simulate price pathway based on trade outcome
      if (isBuy) {
        if (isWin) {
          // Breaks upward
          y = yCenter + 20 - (i * 7) + Math.sin(i * 1.5) * 12;
        } else {
          // Fails downward
          y = yCenter - 10 + (i * 4) + Math.sin(i * 1.5) * 10;
        }
      } else {
        // SELL
        if (isWin) {
          // Drops (profit for short)
          y = yCenter - 20 + (i * 7) + Math.sin(i * 1.5) * 12;
        } else {
          // Spikes upward (loss for short)
          y = yCenter + 10 - (i * 4) + Math.sin(i * 1.5) * 10;
        }
      }
      
      // Clamp values
      y = Math.max(25, Math.min(height - 25, y));
      pArray.push({ x, y });
    }
    
    points = pArray.map(p => `${p.x},${p.y}`).join(' ');
    
    // Dynamic coordinate positioning for markers
    const entryX = pArray[2].x;
    const entryY = pArray[2].y;
    const exitX = pArray[pArray.length - 1].x;
    const exitY = pArray[pArray.length - 1].y;
    
    // Invalidation levels
    const stopLossY = isBuy ? entryY + 45 : entryY - 45;
    const takeProfitY = isBuy ? entryY - 45 : entryY + 45;

    return (
      <div className="relative bg-zinc-950 rounded-xl p-4 border border-zinc-900 shadow-inner overflow-hidden select-none">
        {/* Ambient background grids */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.03] pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border-t border-l border-zinc-100" />
          ))}
        </div>

        {/* Watermark */}
        <div className="absolute top-2 right-3 flex items-center gap-1.5 opacity-30 text-[9px] font-mono text-zinc-400">
          <Shield className="w-3 h-3 text-amber-500" />
          <span>AQ SECURE SCREENSHOT LOG // JRN-{entry.id.split('-')[1] || entry.id}</span>
        </div>

        {/* Price Plot */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible relative z-10">
          {/* Gradients */}
          <defs>
            <linearGradient id={`gradient-${entry.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isWin ? '#10b981' : '#ef4444'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={isWin ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted horizontal target levels */}
          <line x1="0" y1={takeProfitY} x2={width} y2={takeProfitY} stroke="#10b981" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
          <text x="5" y={takeProfitY - 4} fill="#10b981" fontSize="8" fontFamily="monospace" opacity="0.6">TAKE PROFIT</text>

          <line x1="0" y1={stopLossY} x2={width} y2={stopLossY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
          <text x="5" y={stopLossY + 10} fill="#ef4444" fontSize="8" fontFamily="monospace" opacity="0.6">STOP LOSS</text>

          {/* Price curve area */}
          <path
            d={`M 0,${height} L ${pArray.map(p => `${p.x},${p.y}`).join(' L ')} L ${width},${height} Z`}
            fill={`url(#gradient-${entry.id})`}
          />

          {/* Price curve path line */}
          <path
            d={`M ${pArray.map(p => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke={isWin ? '#34d399' : '#f87171'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Entry Point Marker */}
          <circle cx={entryX} cy={entryY} r="5" fill="#eab308" stroke="#18181b" strokeWidth="1.5" />
          <line x1={entryX} y1={entryY} x2={entryX} y2={entryY - 25} stroke="#eab308" strokeWidth="1" opacity="0.8" />
          <rect x={entryX - 35} y={entryY - 38} width="70" height="13" rx="3" fill="#eab308" />
          <text x={entryX} y={entryY - 29} fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            ENTRY: ${entry.entryPrice.toLocaleString()}
          </text>

          {/* Exit Point Marker */}
          <circle cx={exitX} cy={exitY} r="5" fill={isWin ? '#10b981' : '#ef4444'} stroke="#18181b" strokeWidth="1.5" />
          <line x1={exitX} y1={exitY} x2={exitX} y2={exitY + 25} stroke={isWin ? '#10b981' : '#ef4444'} strokeWidth="1" opacity="0.8" />
          <rect x={exitX - 75} y={exitY + 15} width="70" height="13" rx="3" fill={isWin ? '#10b981' : '#ef4444'} />
          <text x={exitX - 40} y={exitY + 24} fill="#fff" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            EXIT: ${entry.exitPrice.toLocaleString()}
          </text>
        </svg>

        {/* Legend panel overlay */}
        <div className="mt-2 flex justify-between items-center text-[10px] font-mono border-t border-zinc-900/60 pt-2.5">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Entry Node</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} /> 
              Exit Node ({entry.exitReason})
            </span>
          </div>
          <span className={`font-bold px-1.5 py-0.5 rounded ${isWin ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'}`}>
            {isWin ? 'PROFIT OUTCOME' : 'DEFENSIVE STOP LOSS'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by ticker, journal code, or trade ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono text-zinc-200 outline-none placeholder-zinc-600 transition-all"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="PNL_DESC">Profit (High to Low)</option>
              <option value="PNL_ASC">P&L (Low to High)</option>
              <option value="CONFIDENCE_DESC">Confidence Score</option>
            </select>
          </div>

          {/* Export button dropdown-like */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Export filtered records to CSV report"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              CSV Report
            </button>
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Export filtered records to Markdown digest"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Markdown Digest
            </button>
          </div>

        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono border-t border-zinc-900/40 pt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 uppercase">Outcome:</span>
            <div className="flex gap-1.5">
              {(['ALL', 'WIN', 'LOSS'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setOutcomeFilter(f)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all border cursor-pointer ${
                    outcomeFilter === f
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-900 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase">Direction:</span>
            <div className="flex gap-1.5">
              {(['ALL', 'BUY', 'SELL'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDirectionFilter(f)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all border cursor-pointer ${
                    directionFilter === f
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-900 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase">Exit:</span>
            <select
              value={exitReasonFilter}
              onChange={(e) => setExitReasonFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[10px] font-bold text-zinc-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL REASONS</option>
              <option value="HIT_TP">HIT_TP (Target)</option>
              <option value="HIT_SL">HIT_SL (Stop)</option>
              <option value="MANUAL">MANUAL (Manual)</option>
              <option value="FORCE_CLOSE">FORCE_CLOSE</option>
            </select>
          </div>

          <span className="ml-auto text-[10px] text-zinc-600 font-mono">
            Filtered: {sortedEntries.length} of {entries.length} records
          </span>
        </div>
      </div>

      {/* Main Journal Records Grid */}
      {sortedEntries.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-zinc-700 mx-auto" />
          <h4 className="text-zinc-400 font-serif font-bold text-sm">NO JOURNAL ENTRIES RECORDED</h4>
          <p className="text-xs font-mono text-zinc-600 max-w-md mx-auto leading-relaxed">
            Every completed paper trade will automatically generate a high-fidelity audit journal entry detailing reasoning, AI debate consensus, rules compliance, and lessons learned.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEntries.map((entry) => {
            const isWin = entry.profitAndLoss >= 0;
            return (
              <div 
                key={entry.id} 
                onClick={() => setSelectedEntry(entry)}
                className="bg-zinc-950 border border-zinc-900/70 hover:border-amber-500/25 rounded-xl p-5 space-y-4 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/5 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {entry.id}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(entry.exitTime).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div>
                      <h4 className="text-sm font-bold font-mono text-zinc-200">{entry.ticker}</h4>
                      <span className={`text-[10px] font-mono font-bold uppercase ${entry.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.direction} Setup
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-sm font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}${entry.profitAndLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block">
                        {entry.rMultiple >= 0 ? `+${entry.rMultiple}` : entry.rMultiple}R Multiple
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono leading-relaxed">
                    <p className="text-zinc-400 line-clamp-3 text-[11px]">
                      {entry.entryReasoning}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex gap-2">
                    <span className="bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 px-2 py-0.5 rounded">
                      Conf: {entry.confidence}%
                    </span>
                    <span className="bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 px-2 py-0.5 rounded">
                      Ready: {entry.readinessScore}%
                    </span>
                  </div>
                  <span className="text-amber-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-all">
                    View Journal <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer Overlay for Selected Journal Entry */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl h-full bg-[#0E0E0F] border-l border-zinc-900 flex flex-col justify-between overflow-y-auto">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-[#0E0E0F] z-20">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded uppercase">
                  {selectedEntry.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold font-serif text-zinc-100 flex items-center gap-2">
                    AUTOMATIC TRADE AUDIT LOG
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 block">
                    Linked trade ID: {selectedEntry.tradeId} • Completed {new Date(selectedEntry.exitTime).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content Drawer Scrollable */}
            <div className="flex-1 p-6 space-y-6">
              
              {/* Outcome summary widget */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 border border-zinc-900 rounded-xl p-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">ASSET</span>
                  <span className="text-xs font-bold font-mono text-zinc-200">{selectedEntry.ticker}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">DIRECTION</span>
                  <span className={`text-xs font-bold font-mono uppercase ${selectedEntry.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedEntry.direction}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">TRADE OUTCOME</span>
                  <span className={`text-xs font-bold font-mono uppercase ${selectedEntry.profitAndLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedEntry.profitAndLoss >= 0 ? 'PROFIT' : 'LOSS'}
                  </span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">NET P&L ($)</span>
                  <span className={`text-sm font-bold font-mono ${selectedEntry.profitAndLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedEntry.profitAndLoss >= 0 ? '+' : ''}${selectedEntry.profitAndLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Vector Screenshot Mockup */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  VISUAL EXECUTION CAPTURE (MOCKUP CHART)
                </span>
                <TradeScreenshotMockup entry={selectedEntry} />
              </div>

              {/* Pricing details and r-multiple */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">ENTRY PRICE</span>
                  <span className="font-bold font-mono text-zinc-300 text-xs">${selectedEntry.entryPrice.toLocaleString()}</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">EXIT PRICE</span>
                  <span className="font-bold font-mono text-zinc-300 text-xs">${selectedEntry.exitPrice.toLocaleString()}</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">EXIT REASON</span>
                  <span className="font-bold font-mono text-amber-500 text-xs">{selectedEntry.exitReason}</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">R-MULTIPLE</span>
                  <span className="font-bold font-mono text-zinc-300 text-xs">{selectedEntry.rMultiple >= 0 ? `+${selectedEntry.rMultiple}` : selectedEntry.rMultiple}R</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">CONFIDENCE</span>
                  <span className="font-bold font-mono text-zinc-300 text-xs">{selectedEntry.confidence}%</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-center">
                  <span className="text-[9px] text-zinc-500 block">READINESS</span>
                  <span className="font-bold font-mono text-zinc-300 text-xs">{selectedEntry.readinessScore}%</span>
                </div>
              </div>

              {/* Reasoning Panels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Entry reasoning */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <BookOpen className="w-3.5 h-3.5 text-yellow-500" />
                    ENTRY DECISION REASONING
                  </span>
                  <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                    {selectedEntry.entryReasoning}
                  </p>
                </div>

                {/* Guardian reasoning */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    GUARDIAN RISK EVALUATION
                  </span>
                  <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                    {selectedEntry.guardianReasoning}
                  </p>
                </div>

              </div>

              {/* AI Debate summary */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  AI DEBATE & OPINION SUMMARY
                </span>
                <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                  {selectedEntry.aiDebateSummary}
                </p>
              </div>

              {/* Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Passed Rules */}
                <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    PASSED COMPLIANCE RULES ({selectedEntry.passedRules.length})
                  </span>
                  <div className="space-y-2.5">
                    {selectedEntry.passedRules.map((rule, idx) => (
                      <div key={idx} className="text-[11px] font-mono bg-emerald-500/5 border border-emerald-500/10 p-2 rounded">
                        <div className="font-bold text-emerald-400">{rule.name}</div>
                        <div className="text-zinc-400 mt-0.5">{rule.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Failed Rules */}
                <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    FAILED / BYPASSED RULES ({selectedEntry.failedRules.length})
                  </span>
                  {selectedEntry.failedRules.length === 0 ? (
                    <div className="text-xs font-mono text-zinc-600 text-center py-6">
                      No failed compliance rules logged for this trade.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedEntry.failedRules.map((rule, idx) => (
                        <div key={idx} className="text-[11px] font-mono bg-red-500/5 border border-red-500/10 p-2 rounded">
                          <div className="font-bold text-red-400">{rule.name}</div>
                          <div className="text-zinc-400 mt-0.5">{rule.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Market Health Indicators & Readiness score */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block border-b border-zinc-900 pb-2">
                  MARKET CONTEXT HEALTH SENSORS
                </span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-zinc-500">Volatility Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${selectedEntry.marketHealth.volatility}%` }} />
                      </div>
                      <span className="text-zinc-300 font-bold">{selectedEntry.marketHealth.volatility}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500">Liquidity Depth:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${selectedEntry.marketHealth.liquidity}%` }} />
                      </div>
                      <span className="text-zinc-300 font-bold">{selectedEntry.marketHealth.liquidity}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500">Sentiment Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${selectedEntry.marketHealth.sentiment}%` }} />
                      </div>
                      <span className="text-zinc-300 font-bold">{selectedEntry.marketHealth.sentiment}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500">Overall Health Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${selectedEntry.marketHealth.healthScore}%` }} />
                      </div>
                      <span className="text-zinc-300 font-bold">{selectedEntry.marketHealth.healthScore}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons Learned Section */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                    OPERATOR LESSONS LEARNED
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Log</span>
                </div>
                
                <textarea
                  value={editingLessons}
                  onChange={(e) => setEditingLessons(e.target.value)}
                  placeholder="Record what you learned from this completed trade, setup modifications, or execution anomalies..."
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Any modifications made will persist directly in your local trade registry.
                  </span>
                  <button
                    onClick={handleSaveLessons}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 cursor-pointer transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Saved Successfully
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Lessons
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-zinc-900 bg-zinc-950/80 flex gap-3">
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-mono font-bold text-xs rounded-xl hover:text-white transition-all cursor-pointer uppercase tracking-wider text-center"
              >
                Close Audit Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
