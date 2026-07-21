export type Timeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '1D';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'FAILED';

export type DataQuality = 'Excellent' | 'Good' | 'Poor';

export interface OHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // Optional volume parameter
}

export interface MarketDataFeed {
  symbol: string;
  timeframe: Timeframe;
  livePrice: number;
  bid: number;
  ask: number;
  ohlc: OHLC[];
  volume?: number;
  lastUpdate: string;
  latency: number; // in milliseconds
  dataQuality: DataQuality;
}

export interface MarketDataPluginSDK {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  supportedSymbols: string[];
  supportedTimeframes: Timeframe[];
  
  // Lifecycle methods
  validateCredentials: (creds: Record<string, string>) => { isValid: boolean; error?: string };
  connect: (creds: Record<string, string>) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Data retrieval
  fetchFeed: (symbol: string, timeframe: Timeframe) => Promise<MarketDataFeed>;
}
