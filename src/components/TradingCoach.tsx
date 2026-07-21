import React, { useState } from 'react';
import { Brain, Send, HelpCircle, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface CoachTopic {
  title: string;
  query: string;
  answer: string[];
}

export default function TradingCoach({ addLog }: { addLog: (log: string) => void }) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string; list?: string[] }>>([
    { sender: 'coach', text: "Greetings. I am your AQ Trading Coach. Let's align your psychological states. What emotional friction did you experience during your recent trading sessions?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const predefinedTopics: CoachTopic[] = [
    {
      title: 'Hesitation at Trigger Lines',
      query: 'I find myself hesitating to click buy when price hits my predefined entry zones, then I chase it higher.',
      answer: [
        'Acknowledge that fear is a response to sizing mismatch. If you hesitate, your position size is likely too large for your cognitive tolerance. Scale down by 50%.',
        'Implement an "If-Then" protocol: "If price hits $X.XX with delta confirmation, then I must place a 0.5 lot entry order unconditionally."',
        'Accept that a loss is simply a cost of doing business, not a failure of intelligence.'
      ]
    },
    {
      title: 'Chasing and Over-trading',
      query: 'I keep entering random trades when the market is chop-heavy, just because I want to feel the excitement.',
      answer: [
        'Differentiate between "Trading for Wealth" and "Trading for Entertainment". Entertainment trading has a guaranteed negative expected value.',
        'Use the AQ Core Plugin block to lock your workspace when daily target scores or loss limits are completed.',
        'Adopt the Boredom Shield rule: If you do not see a high-conviction setup, close the dashboard and step away. Discipline is paid in patience.'
      ]
    },
    {
      title: 'Cutting Winners Early',
      query: 'I secure micro profits immediately because I am terrified the trade will reverse on me, missing the macro move.',
      answer: [
        'Terror is born of lack of statistics. Check your Playbook history. If your target hit rate is 60%, exiting early ruins your mathematical edge.',
        'Utilize a multi-part exit strategy: take partial profit at Target 1, then move stops to breakeven, allowing the remaining runner to target key liquidation zones.',
        'Keep your hands off the keyboard once stops and targets are committed. Trust your original blueprint over live emotional noise.'
      ]
    }
  ];

  const handlePredefinedClick = (topic: CoachTopic) => {
    setMessages(prev => [...prev, { sender: 'user', text: topic.query }]);
    setIsTyping(true);
    addLog(`COACH: Aligning cognitive response to predefined question: [${topic.title}]`);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'coach',
        text: `Regarding your challenge with "${topic.title}": Here are the structured systemic protocols you should log in your Decision Ledger:`,
        list: topic.answer
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);
    addLog('COACH: Compiling interactive alignment strategy...');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'coach',
        text: `I hear your concern: "${userMsg}". Here is your immediate psychological alignment recipe:`,
        list: [
          'Verify that your emotional metrics on the AQ Readiness Meter are at 80% or greater before the next session starts.',
          'Downscale your leverage parameters to 2x or 5x maximum. This immediately reduces the cortisol response.',
          'Open the Knowledge Vault and carefully read through your designated Setup Rules of Engagement.'
        ]
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="border-b border-zinc-900 pb-3 mb-4">
          <h3 className="text-sm font-bold font-serif text-zinc-200">
            AQ TRADING PSYCHOLOGY COACH
          </h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
            Identify subconscious cognitive biases and receive tailored institutional alignment guides
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Preset coaching situations list (5 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              COGNITIVE TROUBLESHOOTING
            </span>

            <div className="space-y-2">
              {predefinedTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handlePredefinedClick(topic)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold font-serif text-zinc-300">{topic.title}</h4>
                    <p className="text-[9px] font-mono text-zinc-500 mt-0.5 truncate max-w-[200px]">
                      {topic.query}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                90% of trading losses are psychological. Logging your psychological state in the **Decision Ledger** builds historical defense variables.
              </p>
            </div>
          </div>

          {/* Chat Window Simulator (8 cols) */}
          <div className="lg:col-span-8 bg-[#080809] border border-zinc-900 rounded-lg p-4 flex flex-col h-[380px] justify-between">
            
            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-xl max-w-[85%] text-xs leading-relaxed border ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-br-none'
                      : 'bg-[#101012] border-amber-500/10 text-zinc-200 rounded-bl-none'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                      <Brain className="w-3 h-3 text-amber-500" />
                      {msg.sender === 'user' ? 'OPERATOR SENSORY' : 'AQ COGNITIVE COACH'}
                    </div>
                    <p className="font-serif">{msg.text}</p>
                    {msg.list && (
                      <ul className="mt-3 space-y-2 pl-1">
                        {msg.list.map((li, idx) => (
                          <li key={idx} className="flex gap-2 text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="font-serif">{li}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-[10px] font-mono text-amber-500 animate-pulse">
                    AQ COACH IS ANALYZING SENSORY FLUIDITY...
                  </div>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendCustomMessage} className="mt-4 border-t border-zinc-900 pt-3 flex gap-2">
              <input
                type="text"
                placeholder="Log an emotion: 'I exited early out of fear'..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800/80 focus:border-amber-500/50 rounded-lg px-4 py-2 text-xs text-zinc-300 focus:outline-none placeholder-zinc-600"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2.5 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>
      </div>
    </div>
  );
}
