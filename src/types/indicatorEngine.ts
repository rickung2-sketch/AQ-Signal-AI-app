export type IndicatorDirection = 'UP' | 'DOWN' | 'FLAT';
export type IndicatorSignal = 'BUY' | 'SELL' | 'NEUTRAL';

export interface IndicatorResult {
  value: number;
  direction: IndicatorDirection;
  signal: IndicatorSignal;
  confidence: number;
  timestamp: string;
}

export interface IndicatorEngineState {
  ema50: IndicatorResult | null;
  ema200: IndicatorResult | null;
  atr14: IndicatorResult | null;
  rsi14: IndicatorResult | null;
}
