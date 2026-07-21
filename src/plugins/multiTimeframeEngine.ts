import { TimeframeAlignmentState, TimeframeData } from '../types/multiTimeframe';

/**
 * High-fidelity Multi-Timeframe Analysis Engine (V2.1)
 * Calculates trend, structure, EMAs, S/R, ATR, and RSI for 4H, 1H, and 15M intervals.
 * Dynamically fluctuates using mathematical oscillators to emulate real-time live feeds.
 */
export function calculateMultiTimeframe(preset: 'Bullish' | 'Bearish' | 'Sideways' | 'Extreme'): TimeframeAlignmentState {
  const now = Date.now();
  
  // Use current time to generate deterministic micro-fluctuations (subtle noise)
  const pulse = Math.sin(now / 10000) * 0.5; // range [-0.5, 0.5]
  const fastPulse = Math.cos(now / 3000) * 1.5; // range [-1.5, 1.5]
  
  // Base parameters depending on the active global regime
  let basePrice = 95000;
  if (preset === 'Extreme') basePrice = 91200 + (pulse * 500);
  else if (preset === 'Bullish') basePrice = 96400 + (pulse * 300);
  else if (preset === 'Bearish') basePrice = 92800 + (pulse * 300);
  else basePrice = 94500 + (pulse * 100);

  // --- 4 HOUR TIMEFRAME ---
  let tf4H_trend: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf4H_structure: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf4H_ema50 = basePrice - 1200;
  let tf4H_ema200 = basePrice - 3200;
  let tf4H_support = basePrice - 2500;
  let tf4H_resistance = basePrice + 1800;
  let tf4H_atr = 850 + (pulse * 40);
  let tf4H_rsi = 62 + pulse;
  let tf4H_confidence = 85;

  if (preset === 'Bearish') {
    tf4H_trend = 'Bearish';
    tf4H_structure = 'Bearish';
    tf4H_ema50 = basePrice + 1400;
    tf4H_ema200 = basePrice + 2800;
    tf4H_support = basePrice - 1800;
    tf4H_resistance = basePrice + 1200;
    tf4H_atr = 920 + (pulse * 50);
    tf4H_rsi = 38 + pulse;
    tf4H_confidence = 88;
  } else if (preset === 'Sideways') {
    tf4H_trend = 'Sideways';
    tf4H_structure = 'Sideways';
    tf4H_ema50 = basePrice - 80;
    tf4H_ema200 = basePrice - 200;
    tf4H_support = basePrice - 800;
    tf4H_resistance = basePrice + 900;
    tf4H_atr = 450 + (pulse * 20);
    tf4H_rsi = 49 + pulse;
    tf4H_confidence = 75;
  } else if (preset === 'Extreme') {
    tf4H_trend = 'Bearish';
    tf4H_structure = 'Bearish';
    tf4H_ema50 = basePrice + 2400;
    tf4H_ema200 = basePrice + 4500;
    tf4H_support = basePrice - 4000;
    tf4H_resistance = basePrice + 3000;
    tf4H_atr = 1580 + (pulse * 150);
    tf4H_rsi = 26 + pulse;
    tf4H_confidence = 92;
  }

  // --- 1 HOUR TIMEFRAME ---
  let tf1H_trend: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf1H_structure: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf1H_ema50 = basePrice - 600;
  let tf1H_ema200 = basePrice - 1800;
  let tf1H_support = basePrice - 1200;
  let tf1H_resistance = basePrice + 900;
  let tf1H_atr = 420 + (fastPulse * 15);
  let tf1H_rsi = 66 + fastPulse;
  let tf1H_confidence = 80;

  if (preset === 'Bearish') {
    tf1H_trend = 'Bearish';
    tf1H_structure = 'Bearish';
    tf1H_ema50 = basePrice + 700;
    tf1H_ema200 = basePrice + 1500;
    tf1H_support = basePrice - 900;
    tf1H_resistance = basePrice + 800;
    tf1H_atr = 490 + (fastPulse * 20);
    tf1H_rsi = 34 + fastPulse;
    tf1H_confidence = 82;
  } else if (preset === 'Sideways') {
    tf1H_trend = 'Sideways';
    tf1H_structure = 'Sideways';
    tf1H_ema50 = basePrice + 20;
    tf1H_ema200 = basePrice - 90;
    tf1H_support = basePrice - 400;
    tf1H_resistance = basePrice + 450;
    tf1H_atr = 210 + (fastPulse * 10);
    tf1H_rsi = 51 + fastPulse;
    tf1H_confidence = 78;
  } else if (preset === 'Extreme') {
    tf1H_trend = 'Bearish';
    tf1H_structure = 'Bearish';
    tf1H_ema50 = basePrice + 1800;
    tf1H_ema200 = basePrice + 3100;
    tf1H_support = basePrice - 2200;
    tf1H_resistance = basePrice + 1600;
    tf1H_atr = 890 + (fastPulse * 60);
    tf1H_rsi = 21 + fastPulse;
    tf1H_confidence = 85;
  }

  // --- 15 MINUTE TIMEFRAME ---
  // Lower timeframe fluctuates more frequently
  let tf15M_trend: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf15M_structure: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let tf15M_ema50 = basePrice - 180;
  let tf15M_ema200 = basePrice - 550;
  let tf15M_support = basePrice - 400;
  let tf15M_resistance = basePrice + 300;
  let tf15M_atr = 180 + (fastPulse * 8);
  let tf15M_rsi = 58 + (fastPulse * 2.5);
  let tf15M_confidence = 74;

  // Let 15M fluctuate trend/structure to show "Mixed" states at times
  if (preset === 'Bullish') {
    // Bullish overall but 15m can pullback on fastPulse negative swing
    if (fastPulse < -0.8) {
      tf15M_trend = 'Bearish';
      tf15M_structure = 'Sideways';
      tf15M_rsi = 42 + fastPulse;
    }
  } else if (preset === 'Bearish') {
    tf15M_trend = 'Bearish';
    tf15M_structure = 'Bearish';
    tf15M_ema50 = basePrice + 220;
    tf15M_ema200 = basePrice + 610;
    tf15M_support = basePrice - 300;
    tf15M_resistance = basePrice + 250;
    tf15M_atr = 220 + (fastPulse * 12);
    tf15M_rsi = 31 + (fastPulse * 2.5);
    tf15M_confidence = 76;
    
    // minor bullish recovery in bearish market
    if (fastPulse > 0.8) {
      tf15M_trend = 'Bullish';
      tf15M_structure = 'Sideways';
      tf15M_rsi = 48 + fastPulse;
    }
  } else if (preset === 'Sideways') {
    // Highly oscillating 15m
    if (fastPulse > 0.5) {
      tf15M_trend = 'Bullish';
      tf15M_structure = 'Bullish';
      tf15M_rsi = 59 + fastPulse;
    } else if (fastPulse < -0.5) {
      tf15M_trend = 'Bearish';
      tf15M_structure = 'Bearish';
      tf15M_rsi = 41 + fastPulse;
    } else {
      tf15M_trend = 'Sideways';
      tf15M_structure = 'Sideways';
      tf15M_rsi = 49 + fastPulse;
    }
    tf15M_ema50 = basePrice + 5;
    tf15M_ema200 = basePrice - 20;
    tf15M_support = basePrice - 180;
    tf15M_resistance = basePrice + 190;
    tf15M_atr = 95 + (fastPulse * 4);
    tf15M_confidence = 68;
  } else if (preset === 'Extreme') {
    tf15M_trend = 'Bearish';
    tf15M_structure = 'Bearish';
    tf15M_ema50 = basePrice + 450;
    tf15M_ema200 = basePrice + 1200;
    tf15M_support = basePrice - 1200;
    tf15M_resistance = basePrice + 600;
    tf15M_atr = 420 + (fastPulse * 30);
    tf15M_rsi = 17 + (fastPulse * 3);
    tf15M_confidence = 80;

    if (fastPulse > 1.2) {
      tf15M_trend = 'Sideways';
      tf15M_rsi = 29 + fastPulse;
    }
  }

  // --- ALIGNMENT DECISION ALGORITHM ---
  const trends = [tf4H_trend, tf1H_trend, tf15M_trend];
  const structures = [tf4H_structure, tf1H_structure, tf15M_structure];
  
  const bullishTrends = trends.filter(t => t === 'Bullish').length;
  const bearishTrends = trends.filter(t => t === 'Bearish').length;
  
  const bullishStructures = structures.filter(s => s === 'Bullish').length;
  const bearishStructures = structures.filter(s => s === 'Bearish').length;

  let overallAlignment: 'Bullish Alignment' | 'Bearish Alignment' | 'Mixed' = 'Mixed';
  let percentageAlignment = 50;

  // Bullish alignment calculation
  if (bullishTrends >= 2 && bullishStructures >= 2) {
    overallAlignment = 'Bullish Alignment';
    // count alignment ratio of bullish factors (out of 6 total factors: 3 trends, 3 structures)
    const totalBullish = bullishTrends + bullishStructures;
    percentageAlignment = Math.round((totalBullish / 6) * 100);
  } 
  // Bearish alignment calculation
  else if (bearishTrends >= 2 && bearishStructures >= 2) {
    overallAlignment = 'Bearish Alignment';
    const totalBearish = bearishTrends + bearishStructures;
    percentageAlignment = Math.round((totalBearish / 6) * 100);
  } 
  // Mixed state
  else {
    overallAlignment = 'Mixed';
    // Calculate how close it is to equilibrium or mixed dominance
    const dominantCount = Math.max(bullishTrends + bullishStructures, bearishTrends + bearishStructures);
    percentageAlignment = Math.round((dominantCount / 6) * 100);
    if (percentageAlignment < 50) percentageAlignment = 50;
  }

  return {
    timeframes: {
      '4H': {
        timeframe: '4H',
        trend: tf4H_trend,
        marketStructure: tf4H_structure,
        ema50: Math.round(tf4H_ema50 * 100) / 100,
        ema200: Math.round(tf4H_ema200 * 100) / 100,
        support: Math.round(tf4H_support * 100) / 100,
        resistance: Math.round(tf4H_resistance * 100) / 100,
        atr: Math.round(tf4H_atr * 100) / 100,
        rsi: Math.round(tf4H_rsi * 10) / 10,
        confidenceScore: tf4H_confidence
      },
      '1H': {
        timeframe: '1H',
        trend: tf1H_trend,
        marketStructure: tf1H_structure,
        ema50: Math.round(tf1H_ema50 * 100) / 100,
        ema200: Math.round(tf1H_ema200 * 100) / 100,
        support: Math.round(tf1H_support * 100) / 100,
        resistance: Math.round(tf1H_resistance * 100) / 100,
        atr: Math.round(tf1H_atr * 100) / 100,
        rsi: Math.round(tf1H_rsi * 10) / 10,
        confidenceScore: tf1H_confidence
      },
      '15M': {
        timeframe: '15M',
        trend: tf15M_trend,
        marketStructure: tf15M_structure,
        ema50: Math.round(tf15M_ema50 * 100) / 100,
        ema200: Math.round(tf15M_ema200 * 100) / 100,
        support: Math.round(tf15M_support * 100) / 100,
        resistance: Math.round(tf15M_resistance * 100) / 100,
        atr: Math.round(tf15M_atr * 100) / 100,
        rsi: Math.round(tf15M_rsi * 10) / 10,
        confidenceScore: tf15M_confidence
      }
    },
    overallAlignment,
    percentageAlignment
  };
}
