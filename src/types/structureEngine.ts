export interface StructureDetection<T> {
  value: T;
  confidence: number;
  reason: string;
  timestamp: string;
}

export interface MarketStructureEngineState {
  higherHighs: StructureDetection<boolean>;
  higherLows: StructureDetection<boolean>;
  lowerHighs: StructureDetection<boolean>;
  lowerLows: StructureDetection<boolean>;
  swingHighs: StructureDetection<number[]>;
  swingLows: StructureDetection<number[]>;
  support: StructureDetection<number>;
  resistance: StructureDetection<number>;
  trendDirection: StructureDetection<'BULLISH' | 'BEARISH' | 'SIDEWAYS'>;
  trendStrength: StructureDetection<number>;
}
