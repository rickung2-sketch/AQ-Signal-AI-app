import { MarketScannerEventType, ScannerPriority, ScannerEvent } from '../types/marketScanner';

const TICKERS = ['XAU/USD', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'AAPL', 'NVDA', 'TSLA', 'EUR/USD', 'GBP/USD'];

const REASONS: Record<MarketScannerEventType, { text: string; direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; priority: ScannerPriority }[]> = {
  'Trend Change': [
    { text: 'Market structure broke bearish swing high. Transitioning from accumulative range to expansion wave.', direction: 'BULLISH', priority: 'HIGH' },
    { text: 'Daily swing failure pattern printed below key liquidity pool. Strong momentum reversal confirmed.', direction: 'BULLISH', priority: 'HIGH' },
    { text: 'Double distribution profile broke below weekly VWAP support. Bearish trend shift accelerating.', direction: 'BEARISH', priority: 'HIGH' }
  ],
  'EMA Cross': [
    { text: 'Golden Cross triggered: 50-period EMA crossed above 200-period EMA on the 4-Hour timeframe.', direction: 'BULLISH', priority: 'MEDIUM' },
    { text: 'Death Cross triggered: 50-period EMA crossed below 200-period EMA on the 1-Hour timeframe.', direction: 'BEARISH', priority: 'HIGH' },
    { text: 'Short-term momentum cross: 9-period EMA crossed above 21-period EMA with high volume support.', direction: 'BULLISH', priority: 'LOW' }
  ],
  'Breakout': [
    { text: 'Price broke above multi-week descending wedge resistance with a 3.4x spike in relative volume.', direction: 'BULLISH', priority: 'HIGH' },
    { text: 'Breakout below key support block at local range lows. High volume seller delta observed on-chain.', direction: 'BEARISH', priority: 'HIGH' },
    { text: 'Symmetrical triangle apex breach. High-momentum expansion candle closing outside the standard deviations.', direction: 'BULLISH', priority: 'MEDIUM' }
  ],
  'Retest': [
    { text: 'Successful retest of the broken resistance zone. Strong buy-limit orders absorbed the selling pressure.', direction: 'BULLISH', priority: 'MEDIUM' },
    { text: 'Price retesting dynamic weekly VWAP line from below. Rejected with a long upper shadow.', direction: 'BEARISH', priority: 'MEDIUM' },
    { text: 'Clean bounce on the Golden Pocket (0.618 Fibonacci level). Dynamic demand block validated.', direction: 'BULLISH', priority: 'LOW' }
  ],
  'Bullish Engulfing': [
    { text: 'Strong daily bullish engulfing candle closed, completely overtaking the previous 3 sessions of selling.', direction: 'BULLISH', priority: 'MEDIUM' },
    { text: 'Bullish engulfing bar formed on H4 order block, signaling exhaustion of short sellers.', direction: 'BULLISH', priority: 'LOW' }
  ],
  'Bearish Engulfing': [
    { text: 'Bearish engulfing candle formed at macro range highs. Supply imbalance successfully took control.', direction: 'BEARISH', priority: 'MEDIUM' },
    { text: 'Aggressive institutional selling overtook previous daily green candle, confirming local exhaustion.', direction: 'BEARISH', priority: 'HIGH' }
  ],
  'Support Test': [
    { text: 'Macro horizontal demand level tested. Limit orders absorbed and bid depth replenished.', direction: 'BULLISH', priority: 'MEDIUM' },
    { text: 'Triple bottom retest verified. Lower shadow pins wick into liquidity pool before swift rejection.', direction: 'BULLISH', priority: 'HIGH' }
  ],
  'Resistance Test': [
    { text: 'Key horizontal resistance level tested. Major supply wall detected on Order Book depth charts.', direction: 'BEARISH', priority: 'MEDIUM' },
    { text: 'Local range high tested for the fourth time. Heavy sell-limit orders are absorbing dynamic momentum.', direction: 'BEARISH', priority: 'LOW' }
  ],
  'Session Change': [
    { text: 'London Session open. High initial capital injection and rapid order book expansion.', direction: 'NEUTRAL', priority: 'LOW' },
    { text: 'New York Session open. High dispersion and macro breakout volatility expected.', direction: 'NEUTRAL', priority: 'LOW' },
    { text: 'Asia Session close. Order book depth tightening, transition to mean-reverting ranges.', direction: 'NEUTRAL', priority: 'LOW' }
  ],
  'Guardian Status': [
    { text: 'Guardian Risk Engine V3.0 reports high volatility indices. Leverage parameters restricted.', direction: 'NEUTRAL', priority: 'MEDIUM' },
    { text: 'Guardian Risk Core approved. Volatility filters cleared for active spot and futures routing.', direction: 'NEUTRAL', priority: 'LOW' },
    { text: 'Guardian Risk Engine flagged Extreme Greed regimes. Protective capital trailing buffers activated.', direction: 'NEUTRAL', priority: 'HIGH' }
  ]
};

const BASE_PRICES: Record<string, number> = {
  'XAU/USD': 2420.50,
  'BTC/USD': 94500,
  'ETH/USD': 3240,
  'SOL/USD': 185,
  'AAPL': 178.50,
  'NVDA': 122.40,
  'TSLA': 240.20,
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2720
};

export function calculateOpportunityScores(
  type: MarketScannerEventType,
  priority: ScannerPriority,
  confidence: number
): {
  overallScore: number;
  trendScore: number;
  structureScore: number;
  confirmationScore: number;
  riskScore: number;
  guardianScore: number;
  marketHealthScore: number;
  readinessScore: number;
  rankingLevel: 'Elite' | 'Good' | 'Watch' | 'No Trade';
} {
  // Let's calculate base scores which can be slightly randomized but realistic
  let trendScore = Math.floor(60 + Math.random() * 35);
  let structureScore = Math.floor(60 + Math.random() * 35);
  let confirmationScore = confidence;
  let riskScore = Math.floor(55 + Math.random() * 40);
  let guardianScore = Math.floor(65 + Math.random() * 30);
  let marketHealthScore = Math.floor(60 + Math.random() * 35);
  let readinessScore = Math.floor(60 + Math.random() * 35);

  // Boost scores based on event types
  if (type === 'Trend Change' || type === 'EMA Cross') {
    trendScore = Math.floor(82 + Math.random() * 15);
  }
  if (type === 'Breakout' || type === 'Support Test' || type === 'Resistance Test') {
    structureScore = Math.floor(85 + Math.random() * 13);
  }
  if (type === 'Guardian Status') {
    guardianScore = Math.floor(90 + Math.random() * 10);
  }

  // Priority adjustment
  if (priority === 'HIGH') {
    readinessScore = Math.floor(85 + Math.random() * 13);
    riskScore = Math.floor(75 + Math.random() * 20); // relatively safe/well-managed
  } else if (priority === 'LOW') {
    readinessScore = Math.floor(40 + Math.random() * 30);
    riskScore = Math.floor(35 + Math.random() * 35);
  }

  // Add random factors that could make some events "No Trade" or "Elite"
  if (Math.random() < 0.15) {
    // Generate a low-performing opportunity (No Trade or marginal Watch)
    trendScore = Math.floor(30 + Math.random() * 20);
    structureScore = Math.floor(30 + Math.random() * 20);
    confirmationScore = Math.floor(35 + Math.random() * 20);
    riskScore = Math.floor(25 + Math.random() * 20);
    guardianScore = Math.floor(40 + Math.random() * 20);
    marketHealthScore = Math.floor(35 + Math.random() * 20);
    readinessScore = Math.floor(30 + Math.random() * 20);
  }

  const sum = trendScore + structureScore + confirmationScore + riskScore + guardianScore + marketHealthScore + readinessScore;
  const overallScore = Math.round(sum / 7);

  let rankingLevel: 'Elite' | 'Good' | 'Watch' | 'No Trade' = 'Watch';
  if (overallScore >= 85) {
    rankingLevel = 'Elite';
  } else if (overallScore >= 70) {
    rankingLevel = 'Good';
  } else if (overallScore >= 50) {
    rankingLevel = 'Watch';
  } else {
    rankingLevel = 'No Trade';
  }

  return {
    overallScore,
    trendScore,
    structureScore,
    confirmationScore,
    riskScore,
    guardianScore,
    marketHealthScore,
    readinessScore,
    rankingLevel
  };
}

export function generateRandomEvent(): ScannerEvent {
  const eventTypes: MarketScannerEventType[] = [
    'Trend Change',
    'EMA Cross',
    'Breakout',
    'Retest',
    'Bullish Engulfing',
    'Bearish Engulfing',
    'Support Test',
    'Resistance Test',
    'Session Change',
    'Guardian Status'
  ];

  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
  const options = REASONS[type];
  const option = options[Math.floor(Math.random() * options.length)];
  
  const basePrice = BASE_PRICES[ticker] || 100;
  // flux
  const price = Math.round((basePrice * (0.98 + Math.random() * 0.04)) * 100) / 100;
  
  const confidence = Math.floor(65 + Math.random() * 31); // 65% to 95%
  const scores = calculateOpportunityScores(type, option.priority, confidence);

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    ticker,
    priority: option.priority,
    confidence,
    timestamp: new Date().toISOString(),
    reason: option.text,
    price,
    direction: option.direction,
    ...scores
  };
}

export function generateInitialEvents(): ScannerEvent[] {
  const results: ScannerEvent[] = [];
  const eventTypes: MarketScannerEventType[] = [
    'Trend Change',
    'EMA Cross',
    'Breakout',
    'Retest',
    'Bullish Engulfing',
    'Bearish Engulfing',
    'Support Test',
    'Resistance Test',
    'Session Change',
    'Guardian Status'
  ];

  // Create 8 starting logs backward in time
  for (let i = 0; i < 8; i++) {
    const type = eventTypes[i % eventTypes.length];
    const ticker = TICKERS[(i + 3) % TICKERS.length];
    const options = REASONS[type];
    const option = options[Math.floor(Math.random() * options.length)];
    const basePrice = BASE_PRICES[ticker] || 100;
    const price = Math.round((basePrice * (0.97 + Math.random() * 0.06)) * 100) / 100;
    const confidence = Math.floor(60 + Math.random() * 36);
    
    // offset time slightly
    const offsetMs = (i + 1) * 45000;
    const timestamp = new Date(Date.now() - offsetMs).toISOString();
    const scores = calculateOpportunityScores(type, option.priority, confidence);

    results.push({
      id: `scan-init-${i}`,
      type,
      ticker,
      priority: option.priority,
      confidence,
      timestamp,
      reason: option.text,
      price,
      direction: option.direction,
      ...scores
    });
  }

  return results;
}
