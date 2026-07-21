export type BrokerMode = 'ANALYSIS' | 'PAPER' | 'LIVE';

export interface BrokerPosition {
  id: string;
  ticker: string;
  direction: 'BUY' | 'SELL';
  size: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  marginRequired: number;
  timestamp: string;
}

export interface BrokerTradeHistory {
  id: string;
  timestamp: string;
  ticker: string;
  direction: 'BUY' | 'SELL';
  size: number;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  status: 'WIN' | 'LOSS';
  notes?: string;
}

export interface BrokerPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  supportedModes: ('PAPER' | 'LIVE')[];
  configSchema: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
  }[];
  validateConfig: (config: Record<string, any>) => { isValid: boolean; error?: string };
  getAccountDetails: (config: Record<string, any>) => Promise<{
    balance: number;
    equity: number;
    margin: number;
    currency: string;
  }>;
  getPositions: (config: Record<string, any>) => Promise<BrokerPosition[]>;
  getTradeHistory: (config: Record<string, any>) => Promise<BrokerTradeHistory[]>;
  submitOrder: (
    config: Record<string, any>,
    order: {
      ticker: string;
      direction: 'BUY' | 'SELL';
      size: number;
      leverage: number;
      type: 'MARKET' | 'LIMIT';
      price?: number;
    }
  ) => Promise<{
    success: boolean;
    orderId?: string;
    fillPrice?: number;
    message?: string;
  }>;
}

export interface PaperAccount {
  balance: number;
  equity: number;
  margin: number;
  positions: BrokerPosition[];
  history: BrokerTradeHistory[];
}
