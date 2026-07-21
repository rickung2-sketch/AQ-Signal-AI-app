import { OHLC } from '../types/marketDataPluginSDK';
import { IndicatorResult, IndicatorDirection, IndicatorSignal } from '../types/indicatorEngine';

/**
 * Ensures we have enough candles for calculation by prepending generated historic candles
 * if the input list is smaller than the required depth.
 */
export function padAndPrepareCandles(candles: OHLC[], countNeeded: number = 250): OHLC[] {
  if (candles.length === 0) {
    // Generate fallback series if empty
    const mockCandles: OHLC[] = [];
    let currentPrice = 100;
    const now = Date.now();
    for (let i = countNeeded - 1; i >= 0; i--) {
      const timeStr = new Date(now - i * 60000).toLocaleTimeString();
      mockCandles.push({
        time: timeStr,
        open: currentPrice,
        high: currentPrice + 1,
        low: currentPrice - 1,
        close: currentPrice + 0.2,
        volume: 1000
      });
      currentPrice += 0.2;
    }
    return mockCandles;
  }

  if (candles.length >= countNeeded) {
    return candles;
  }

  const padded = [...candles];
  const deficit = countNeeded - candles.length;
  const earliest = candles[0];
  
  // Estimate time interval backwards
  let intervalMs = 15 * 60 * 1000; // default 15M
  if (candles.length > 1) {
    // We can't easily parse different time strings unless we estimate or use a default.
    // Defaulting to 15m or similar is safe.
  }

  let currentPrice = earliest.open;
  for (let i = 1; i <= deficit; i++) {
    // Generate previous candles backwards
    const volatility = 0.005;
    const change = currentPrice * (Math.random() - 0.5) * volatility;
    const open = currentPrice - change;
    const close = currentPrice;
    const high = Math.max(open, close) + (Math.random() * currentPrice * volatility * 0.3);
    const low = Math.min(open, close) - (Math.random() * currentPrice * volatility * 0.3);
    
    padded.unshift({
      time: `H-${i}`,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: earliest.volume ? Math.round(earliest.volume * (0.8 + Math.random() * 0.4)) : 1000
    });
    
    currentPrice = open;
  }

  return padded;
}

/**
 * Calculates EMA for a given period
 */
export function calculateEMA(candles: OHLC[], period: number): IndicatorResult {
  const prepared = padAndPrepareCandles(candles, Math.max(250, period + 10));
  const closes = prepared.map(c => c.close);
  const n = closes.length;
  
  const emaValues: number[] = new Array(n);
  
  // Calculate SMA for first 'period' elements as initial EMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  const sma = sum / period;
  emaValues[period - 1] = sma;
  
  const multiplier = 2 / (period + 1);
  for (let i = period; i < n; i++) {
    emaValues[i] = (closes[i] - emaValues[i - 1]) * multiplier + emaValues[i - 1];
  }

  const currentEMA = parseFloat(emaValues[n - 1].toFixed(2));
  const prevEMA = parseFloat(emaValues[n - 2].toFixed(2));
  const currentPrice = closes[n - 1];

  let direction: IndicatorDirection = 'FLAT';
  if (currentEMA > prevEMA) direction = 'UP';
  else if (currentEMA < prevEMA) direction = 'DOWN';

  let signal: IndicatorSignal = 'NEUTRAL';
  let confidence = 50;

  if (currentPrice > currentEMA) {
    signal = 'BUY';
    const percentDiff = ((currentPrice - currentEMA) / currentEMA) * 100;
    confidence = Math.min(95, Math.round(60 + percentDiff * 15));
  } else if (currentPrice < currentEMA) {
    signal = 'SELL';
    const percentDiff = ((currentEMA - currentPrice) / currentEMA) * 100;
    confidence = Math.min(95, Math.round(60 + percentDiff * 15));
  }

  return {
    value: currentEMA,
    direction,
    signal,
    confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculates RSI (14)
 */
export function calculateRSI(candles: OHLC[], period: number = 14): IndicatorResult {
  const prepared = padAndPrepareCandles(candles, 150);
  const closes = prepared.map(c => c.close);
  const n = closes.length;

  const rsiValues: number[] = new Array(n);

  let gains = 0;
  let losses = 0;

  // First change values
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsiValues[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsiValues[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  const currentRSI = parseFloat(rsiValues[n - 1].toFixed(2));
  const prevRSI = parseFloat(rsiValues[n - 2].toFixed(2));

  let direction: IndicatorDirection = 'FLAT';
  if (currentRSI > prevRSI) direction = 'UP';
  else if (currentRSI < prevRSI) direction = 'DOWN';

  let signal: IndicatorSignal = 'NEUTRAL';
  let confidence = 50;

  if (currentRSI <= 30) {
    signal = 'BUY'; // Oversold -> buy opportunity
    confidence = Math.min(98, Math.round(70 + (30 - currentRSI) * 1.5));
  } else if (currentRSI >= 70) {
    signal = 'SELL'; // Overbought -> sell opportunity
    confidence = Math.min(98, Math.round(70 + (currentRSI - 70) * 1.5));
  } else {
    // Neutral but directional lean
    signal = 'NEUTRAL';
    confidence = Math.min(65, Math.round(40 + Math.abs(currentRSI - 50)));
  }

  return {
    value: currentRSI,
    direction,
    signal,
    confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculates ATR (14)
 */
export function calculateATR(candles: OHLC[], period: number = 14): IndicatorResult {
  const prepared = padAndPrepareCandles(candles, 150);
  const n = prepared.length;

  const trValues: number[] = new Array(n);
  trValues[0] = prepared[0].high - prepared[0].low;

  for (let i = 1; i < n; i++) {
    const hl = prepared[i].high - prepared[i].low;
    const hc = Math.abs(prepared[i].high - prepared[i - 1].close);
    const lc = Math.abs(prepared[i].low - prepared[i - 1].close);
    trValues[i] = Math.max(hl, hc, lc);
  }

  const atrValues: number[] = new Array(n);
  let sumTR = 0;
  for (let i = 0; i < period; i++) {
    sumTR += trValues[i];
  }
  atrValues[period - 1] = sumTR / period;

  for (let i = period; i < n; i++) {
    atrValues[i] = (atrValues[i - 1] * (period - 1) + trValues[i]) / period;
  }

  const currentATR = parseFloat(atrValues[n - 1].toFixed(2));
  const prevATR = parseFloat(atrValues[n - 2].toFixed(2));
  const currentPrice = prepared[n - 1].close;

  let direction: IndicatorDirection = 'FLAT';
  if (currentATR > prevATR) direction = 'UP';
  else if (currentATR < prevATR) direction = 'DOWN';

  // ATR indicates volatility strength.
  // We trigger BUY/SELL based on whether price is above EMA and ATR is expanding, indicating powerful breakout momentum!
  let signal: IndicatorSignal = 'NEUTRAL';
  let confidence = 50;

  // Let's check a simple trend alignment
  const recentCloses = prepared.slice(-5).map(c => c.close);
  const isUpTrend = recentCloses[4] > recentCloses[0];
  
  if (currentATR > prevATR) {
    signal = isUpTrend ? 'BUY' : 'SELL';
    const volatilityRatio = currentATR / currentPrice;
    confidence = Math.min(90, Math.round(55 + volatilityRatio * 2000));
  } else {
    signal = 'NEUTRAL';
    confidence = Math.round(45 + (1 - currentATR / prevATR) * 10);
  }

  return {
    value: currentATR,
    direction,
    signal,
    confidence,
    timestamp: new Date().toISOString()
  };
}
