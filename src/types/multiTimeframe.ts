export interface TimeframeData {
  timeframe: '4H' | '1H' | '15M';
  trend: 'Bullish' | 'Bearish' | 'Sideways';
  marketStructure: 'Bullish' | 'Bearish' | 'Sideways';
  ema50: number;
  ema200: number;
  support: number;
  resistance: number;
  atr: number;
  rsi: number;
  confidenceScore: number; // 0 to 100
}

export interface TimeframeAlignmentState {
  timeframes: {
    '4H': TimeframeData;
    '1H': TimeframeData;
    '15M': TimeframeData;
  };
  overallAlignment: 'Bullish Alignment' | 'Bearish Alignment' | 'Mixed';
  percentageAlignment: number; // 0 to 100
}
