import React, { useState } from 'react';
import { MessageSquare, Shield, Play, HelpCircle, ArrowRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface DebateMessage {
  speaker: 'Bull' | 'Bear';
  text: string;
  timestamp: string;
}

interface TickerDebates {
  [key: string]: DebateMessage[];
}

export default function AIDebate({ addLog }: { addLog: (log: string) => void }) {
  const [selectedTicker, setSelectedTicker] = useState('BTCUSD');
  const [isDebating, setIsDebating] = useState(false);
  const [debateProgress, setDebateProgress] = useState<DebateMessage[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);

  const tickerDebateScenarios: TickerDebates = {
    BTCUSD: [
      { speaker: 'Bull', text: 'Structure is highly constructive. We have successfully broken out above the $95,000 multi-month horizontal accumulation range. Strong institutional volume profiles are supporting this push.', timestamp: '12:01:04' },
      { speaker: 'Bear', text: 'Hold on. That breakout happened on thin volume compared to last weeks standard profiles. The RSI is currently printing a distinct bearish divergence on the 4-hour time frame.', timestamp: '12:01:10' },
      { speaker: 'Bull', text: 'Fair points, but look at the order book liquidity depth. There is a huge wall of bids sitting right below $94,000, which will prevent any deep cascading dumps.', timestamp: '12:01:18' },
      { speaker: 'Bear', text: 'True, but funding rates are getting highly elevated. That bid wall might just be spoofing to bait long positions. Be cautious of a sudden liquidity sweep before real expansion.', timestamp: '12:01:25' }
    ],
    ETHUSD: [
      { speaker: 'Bull', text: 'We are sitting right at a major historical demand block around $3,100. Statistically, this level has triggered a massive buy response in 85% of prior taps.', timestamp: '12:03:15' },
      { speaker: 'Bear', text: 'Yes, but global transaction fees on-chain have dropped to multi-year lows, and ETH-BTC cross-pair is still printing lower lows. No strength has been demonstrated.', timestamp: '12:03:22' },
      { speaker: 'Bull', text: 'On-chain fees are low because layer-2 rollups are successfully absorbing the load. Network utility is actually at an all-time high.', timestamp: '12:03:30' },
      { speaker: 'Bear', text: 'L2 utility is taking value capture away from L1. If L1 gas burn stays low, ETH is technically inflationary right now. I advise waiting for a reclaim of the 50-day EMA.', timestamp: '12:03:40' }
    ],
    SOLUSD: [
      { speaker: 'Bull', text: 'Solana is outperforming all majors. Weekly active addresses are climbing parabolically, and we are breaking out of a huge bull flag target with clear price discovery upside.', timestamp: '12:05:01' },
      { speaker: 'Bear', text: 'The ecosystem metrics are indeed robust, but a lot of this volume is driven by speculative hype. Fully diluted valuation remains high, and validator unlock cycles are coming up.', timestamp: '12:05:08' },
      { speaker: 'Bull', text: 'Validators have consistently restaked their unlocked supply. The velocity of capital on Solana DeFi represents a structural paradigm shift.', timestamp: '12:05:15' },
      { speaker: 'Bear', text: 'That paradigm shift is vulnerable to latency degradation during massive spikes. Be ready to scale out if network fees begin to surge anomalously.', timestamp: '12:05:22' }
    ]
  };

  const startDebate = () => {
    setIsDebating(true);
    setDebateProgress([]);
    setVerdict(null);
    addLog(`AI DEBATE: Initiating dual-persona consensus debate on $${selectedTicker}...`);

    const dialogue = tickerDebateScenarios[selectedTicker] || tickerDebateScenarios['BTCUSD'];
    
    // Staggered presentation simulation
    dialogue.forEach((msg, index) => {
      setTimeout(() => {
        setDebateProgress(prev => [...prev, msg]);
        addLog(`DEBATE [${msg.speaker.toUpperCase()}]: ${msg.text.substring(0, 30)}...`);
      }, (index + 1) * 1200);
    });

    // Final verdict
    setTimeout(() => {
      let finalVerdict = '';
      if (selectedTicker === 'BTCUSD') {
        finalVerdict = 'CONVERGENCE VERDICT: HIGH BIAS BUY. Wait for a retest of $96,400 to build partial position size, setting stops below $94,000.';
      } else if (selectedTicker === 'ETHUSD') {
        finalVerdict = 'CONVERGENCE VERDICT: NEUTRAL / RANGE BOUND. Hold execution. Let ETH reclaim $3,180 with volume before committing sizing metrics.';
      } else {
        finalVerdict = 'CONVERGENCE VERDICT: BULLISH SQUEEZE BIAS. Sizing template 1.0 is recommended. Risk parameters should remain tight.';
      }
      setVerdict(finalVerdict);
      setIsDebating(false);
      addLog(`AI DEBATE: Dual-consensus debate finalized for $${selectedTicker}.`);
    }, (dialogue.length + 1) * 1200);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              AQ DUAL AI CONSENSUS DEBATE
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Force adversarial models to debate a layout before taking portfolio action
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              disabled={isDebating}
              className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
            >
              <option value="BTCUSD">Bitcoin ($BTCUSD)</option>
              <option value="ETHUSD">Ethereum ($ETHUSD)</option>
              <option value="SOLUSD">Solana ($SOLUSD)</option>
            </select>

            <button
              onClick={startDebate}
              disabled={isDebating}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold font-mono text-xs tracking-widest px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {isDebating ? 'DEBATING...' : 'INITIATE'}
            </button>
          </div>
        </div>

        {/* Live Debate Dialog Feed */}
        <div className="bg-[#080809] border border-zinc-900 rounded-lg p-5 min-h-[300px] flex flex-col justify-between space-y-4">
          
          {debateProgress.length === 0 && !isDebating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <MessageSquare className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-xs font-serif text-zinc-400">Adversarial Debate Console Offline</p>
              <p className="text-[10px] font-mono text-zinc-600 mt-1 max-w-xs leading-normal">
                Select an asset target above and click Initiate to stream an interactive algorithmic debate session.
              </p>
            </div>
          )}

          {isDebating && debateProgress.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
              <p className="text-[11px] font-mono text-amber-500 tracking-widest uppercase">
                CALIBRATING PERSPECTIVES...
              </p>
            </div>
          )}

          {/* Active Debate Messages */}
          <div className="space-y-4 flex-1">
            {debateProgress.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${
                  msg.speaker === 'Bull' ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Persona Avatar */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.speaker === 'Bull' 
                    ? 'bg-green-950/40 border-green-900/60 text-green-400' 
                    : 'bg-red-950/40 border-red-900/60 text-red-400'
                }`}>
                  {msg.speaker === 'Bull' ? 'B' : 'S'}
                </div>

                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  msg.speaker === 'Bull' 
                    ? 'bg-[#0E1511] border-green-900/20 text-zinc-300 rounded-tl-none' 
                    : 'bg-[#150E0E] border-red-900/20 text-zinc-300 rounded-tr-none'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`font-mono text-[9px] font-bold ${
                      msg.speaker === 'Bull' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {msg.speaker === 'Bull' ? '🟢 BULLISH OPTIMIST (Aura)' : '🔴 BEARISH SKEPTIC (Kaelen)'}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">{msg.timestamp}</span>
                  </div>
                  <p className="font-serif">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Verdict Segment */}
          {verdict && (
            <div className="border-t border-zinc-900 pt-4 mt-2 bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  CONSENSUS DECISION RATIO
                </h4>
                <p className="text-xs font-serif text-zinc-200 leading-normal">
                  {verdict}
                </p>
                <p className="text-[9px] font-mono text-zinc-500">
                  Calculated based on balanced volatility, volume weight support, and RSI metrics.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
