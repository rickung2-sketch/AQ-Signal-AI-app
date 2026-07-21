import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { storage } from '../utils/storage';

export interface Signal {
  id: string;
  symbol: string;         // e.g. "XAU/USD", "EUR/USD"
  direction: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  confidenceScore: number; // e.g. 92.5 (out of 100)
  aiReasoning: string;     // AI reasoning summary explaining the signal
  aiAnalysisPoints: string[]; // Key technical breakdown items
  timestamp: string;       // ISO string
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  resultPips?: number;     // Performance metrics if closed
}

interface SignalState {
  signals: Signal[];
  activeSignals: Signal[];
  closedSignals: Signal[];
  selectedSignalId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
  setSelectedSignalId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSignals: () => void;
}

// Reuse high-performance MMKV storage engine for Zustand state
const mmkvZustandStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
};

export const useSignalStore = create<SignalState>()(
  persist(
    (set, get) => ({
      signals: [],
      activeSignals: [],
      closedSignals: [],
      selectedSignalId: null,
      isLoading: false,
      error: null,

      setSignals: (signals) => {
        const sorted = [...signals].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        set({
          signals: sorted,
          activeSignals: sorted.filter((s) => s.status === 'ACTIVE'),
          closedSignals: sorted.filter((s) => s.status !== 'ACTIVE'),
        });
      },

      addSignal: (signal) => {
        const signals = [signal, ...get().signals];
        set({
          signals,
          activeSignals: signals.filter((s) => s.status === 'ACTIVE'),
          closedSignals: signals.filter((s) => s.status !== 'ACTIVE'),
        });
      },

      updateSignal: (id, updates) => {
        const signals = get().signals.map((s) => (s.id === id ? { ...s, ...updates } : s));
        set({
          signals,
          activeSignals: signals.filter((s) => s.status === 'ACTIVE'),
          closedSignals: signals.filter((s) => s.status !== 'ACTIVE'),
        });
      },

      setSelectedSignalId: (selectedSignalId) => set({ selectedSignalId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearSignals: () => set({ signals: [], activeSignals: [], closedSignals: [], selectedSignalId: null }),
    }),
    {
      name: 'aq-signal-store',
      storage: createJSONStorage(() => mmkvZustandStorage),
      partialize: (state) => ({
        signals: state.signals,
      }),
    }
  )
);

export default useSignalStore;
