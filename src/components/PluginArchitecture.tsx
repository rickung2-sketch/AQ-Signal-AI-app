import React, { useState } from 'react';
import { AQPlugin } from '../types/dashboard';
import { Grid, Sparkles, AlertCircle, Cpu, Zap, Power, CheckCircle } from 'lucide-react';

interface PluginArchitectureProps {
  addLog: (log: string) => void;
  plugins: AQPlugin[];
  onTogglePlugin: (id: string) => void;
}

export default function PluginArchitecture({ addLog, plugins, onTogglePlugin }: PluginArchitectureProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Scanner' | 'Risk'>('All');

  const filteredPlugins = activeTab === 'All'
    ? plugins
    : plugins.filter(p => p.category === activeTab);

  const handleToggle = (plugin: AQPlugin) => {
    onTogglePlugin(plugin.id);
    const nextState = !plugin.isActive;
    addLog(`PLUGIN: [${plugin.name.toUpperCase()}] is now ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}.`);
    if (nextState) {
      addLog(`SYS: Spawning client thread for plugin ${plugin.id}. Version: ${plugin.version}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-zinc-200">
              AQ MODULAR PLUGIN ARCHITECTURE
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
              Spawn sandboxed execution threads to add custom scanners and risk controls to your AQ Core
            </p>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['All', 'Scanner', 'Risk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-mono rounded-md transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Plugins Grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                plugin.isActive 
                  ? 'bg-amber-500/5 border-amber-500/30' 
                  : 'bg-zinc-900/20 border-zinc-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-zinc-500">
                    ID: {plugin.id} • v{plugin.version}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    plugin.category === 'Scanner' 
                      ? 'bg-green-950/40 text-green-400 border border-green-900/30' 
                      : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                  }`}>
                    {plugin.category}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-serif text-zinc-200">{plugin.name}</h4>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1 leading-relaxed">
                      {plugin.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action details footer */}
              <div className="mt-5 pt-3 border-t border-zinc-900/60 flex items-center justify-between">
                <div className="font-mono text-[10px] text-zinc-500">
                  <span>Author: {plugin.author} • Efficiency: </span>
                  <span className="text-amber-500 font-bold">{plugin.performanceScore}%</span>
                </div>

                <button
                  onClick={() => handleToggle(plugin)}
                  className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                    plugin.isActive 
                      ? 'bg-green-950 text-green-400 border border-green-900' 
                      : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {plugin.isActive ? 'ACTIVE' : 'DEACTIVATE'}
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Developers panel */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          SANDBOX INTERFACE CONTROLS
        </h4>

        <div className="bg-[#0C0C0D] border border-zinc-900 p-4 rounded-lg flex gap-3.5 items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono text-zinc-500 leading-relaxed">
            <span className="text-amber-400 font-bold">Developer Notice</span>: AQ Trade AI allows deploying bespoke WASM or client-side JSON config models. Dynamic code signing matches institutional <span className="text-amber-400 font-bold">AQ Core</span> sandboxing rules to completely isolate custom script processes.
          </div>
        </div>
      </div>
    </div>
  );
}
