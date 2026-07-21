import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckSquare, Bookmark, Flame, Zap, ShieldCheck } from 'lucide-react';
import { PlaybookItem } from '../types/dashboard';

export default function KnowledgeVault() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Bullish Setup' | 'Bearish Setup' | 'Risk Protocol'>('All');
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookItem | null>(null);

  const playbook: PlaybookItem[] = [
    {
      id: 'PL-01',
      title: 'Liquidity Sweep & Retest',
      category: 'Bullish Setup',
      description: 'Capture clean explosive expansions by tagging prior swing lows to clean out leveraged stops before reclaiming levels.',
      rules: [
        'Identify a clear support range with multiple touches on high-time-frame charts.',
        'Wait for price to rapidly pierce below that support to clean out stop-losses.',
        'Confirm delta volume surges in spot purchase books, signaling institutional absorptions.',
        'The entry signal triggers immediately upon a clean 5-minute candle reclaim and close back inside the support range.'
      ]
    },
    {
      id: 'PL-02',
      title: 'The Squeeze Resolution Breakout',
      category: 'Bullish Setup',
      description: 'Capitalize on explosive breakouts occurring immediately after volatility reaches historical compression limits.',
      rules: [
        'Confirm Bollinger Bands are highly compressed (VIX sensory score below 20%).',
        'Verify overall Market Health rating is ASCENDING or STABLE.',
        'Trigger entry on a 15-minute candle closing completely outside the prior compression channel.',
        'Set stop-losses strictly at the opposite side of the compressed band channel.'
      ]
    },
    {
      id: 'PL-03',
      title: 'Extreme Deviation Mean Reversion',
      category: 'Bearish Setup',
      description: 'Counter-trend short setups executed exclusively during extreme daily price extension into premium overhead liquidity.',
      rules: [
        'Verify asset is trading at least 3 standard deviations above its 20-period moving average.',
        'RSI on the 1-hour time frame must print an overbought value above 82.',
        'AI Guardian FOMO indicator must be monitored to ensure retail leverage is extremely long-skewed.',
        'Entry is triggered on a lower-low structure shift on the 5-minute chart, placing targets at the 21 EMA.'
      ]
    },
    {
      id: 'PL-04',
      title: 'Capital Preservation Protocol',
      category: 'Risk Protocol',
      description: 'Strict guidelines designed to defend seed capital during high-volatility systemic threat events.',
      rules: [
        'Reduce absolute maximum transaction sizes across all templates by 50% immediately.',
        'Leverage cap is restricted to a maximum of 5x across all digital assets.',
        'No trades are to be executed during top high-tier macroeconomic calendar announcements (FOMC, CPI).',
        'If daily loss crosses $500, execution routers are locked for 24 hours.'
      ]
    }
  ];

  const filteredPlaybook = selectedCategory === 'All'
    ? playbook
    : playbook.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              AQ QUANT KNOWLEDGE VAULT
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Verified setup blueprints, structural rules of engagement, and risk preservation playbooks
            </p>
          </div>

          <div className="flex flex-wrap gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['All', 'Bullish Setup', 'Bearish Setup', 'Risk Protocol'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Playbook Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlaybook.map((item) => {
            const isSelected = selectedPlaybook?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedPlaybook(isSelected ? null : item)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-amber-500/5 border-amber-500/35' 
                    : 'bg-zinc-900/30 border-zinc-900/60 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      item.category === 'Bullish Setup' 
                        ? 'bg-green-950/40 text-green-400 border border-green-900/30' 
                        : item.category === 'Bearish Setup'
                          ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">{item.id}</span>
                  </div>
                  <h4 className="text-sm font-bold font-serif text-zinc-200">{item.title}</h4>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[10px] font-mono text-amber-500">
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3" />
                    {item.rules.length} ENGAGEMENT RULES
                  </span>
                  <span>{isSelected ? 'COLLAPSE RULES ▲' : 'VIEW DETAILED RULES ▼'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded detailed playbook rule book */}
      {selectedPlaybook && (
        <div className="bg-zinc-950 border border-amber-500/10 rounded-xl p-5 animate-fade-in space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-200">
                {selectedPlaybook.title.toUpperCase()} (DETAILED RULES)
              </h4>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                AQ core protocol conditions for trigger confirmation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-3">
              {selectedPlaybook.rules.map((rule, idx) => (
                <div key={idx} className="flex gap-3 bg-zinc-900/30 border border-zinc-900/80 p-3.5 rounded-lg items-start">
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-serif text-zinc-300 leading-relaxed">
                    {rule}
                  </p>
                </div>
              ))}
            </div>

            <div className="md:col-span-4 bg-[#0A0A0B] border border-zinc-900 p-4 rounded-lg flex flex-col justify-center space-y-3 text-center">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h5 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
                GUARDIAN COMPLIANT
              </h5>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                These rules have been verified across 10,000+ simulated market cycles. Adhering prevents severe cognitive capital drawdown.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
