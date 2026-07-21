import { Timeframe, OHLC, ConnectionStatus } from './marketDataPluginSDK';

export interface TickUpdate {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

export interface MarketDataProvider {
  id: string;
  name: string;
  description: string;
  supportedSymbols: string[];
  supportedTimeframes: Timeframe[];
  
  connect(creds?: Record<string, string>): Promise<void>;
  disconnect(): Promise<void>;
  
  // High-level abstraction requirements
  getCurrentPrice(symbol: string): Promise<number>;
  getBid(symbol: string): Promise<number>;
  getAsk(symbol: string): Promise<number>;
  getSpread(symbol: string): Promise<number>;
  getOHLCCandles(symbol: string, timeframe: Timeframe, count?: number): Promise<OHLC[]>;
  getHistoricalCandles(symbol: string, timeframe: Timeframe, count?: number): Promise<OHLC[]>;
  
  // Real-time updates subscription
  subscribeTicks(symbol: string, callback: (tick: TickUpdate) => void): () => void;
}

export interface ProviderTelemetry {
  providerId: string;
  providerName: string;
  status: ConnectionStatus;
  latency: number;       // In ms
  updateRate: number;    // Ticks per minute
  connectionQuality: number; // 0 to 100
  lastTickTimestamp: string | null;
  requestsRemaining?: number;
  requestsLimit?: number;
}
