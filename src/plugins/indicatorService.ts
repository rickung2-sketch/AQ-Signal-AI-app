import { marketDataService } from './marketDataService';
import { Timeframe, OHLC } from '../types/marketDataPluginSDK';
import { IndicatorEngineState, IndicatorResult } from '../types/indicatorEngine';
import { calculateEMA, calculateRSI, calculateATR } from './indicatorEngine';

export class IndicatorService {
  private static instance: IndicatorService | null = null;
  
  private state: IndicatorEngineState = {
    ema50: null,
    ema200: null,
    atr14: null,
    rsi14: null
  };

  private currentSymbol: string = 'XAU/USD';
  private currentTimeframe: Timeframe = '15M';
  private listeners: Set<(state: IndicatorEngineState) => void> = new Set();
  private tickUnsubscribe: (() => void) | null = null;
  private isCalculating: boolean = false;

  private constructor() {
    // Read saved configuration or fall back to default
    this.currentSymbol = localStorage.getItem('aq_mkt_symbol') || 'XAU/USD';
    this.currentTimeframe = (localStorage.getItem('aq_mkt_timeframe') || '15M') as Timeframe;
    this.setupDataServiceSubscription();
    this.recalculateAll();
  }

  public static getInstance(): IndicatorService {
    if (!IndicatorService.instance) {
      IndicatorService.instance = new IndicatorService();
    }
    return IndicatorService.instance;
  }

  /**
   * Set the active symbol and timeframe, and trigger immediate recalculation
   */
  public updateContext(symbol: string, timeframe: Timeframe): void {
    if (this.currentSymbol !== symbol || this.currentTimeframe !== timeframe) {
      this.currentSymbol = symbol;
      this.currentTimeframe = timeframe;
      this.setupDataServiceSubscription();
      this.recalculateAll();
    }
  }

  /**
   * Subscribe to indicator engine state changes
   */
  public subscribe(callback: (state: IndicatorEngineState) => void): () => void {
    this.listeners.add(callback);
    // Provide initial state immediately
    callback({ ...this.state });
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getState(): IndicatorEngineState {
    return { ...this.state };
  }

  /**
   * Rebind subscription to market data ticks
   */
  private setupDataServiceSubscription(): void {
    if (this.tickUnsubscribe) {
      this.tickUnsubscribe();
    }

    // Subscribe to live ticking quotes and recalculate
    this.tickUnsubscribe = marketDataService.subscribeTicks(this.currentSymbol, () => {
      this.recalculateAll();
    });
  }

  /**
   * Performs the mathematical calculation of indicators by querying candles
   */
  public async recalculateAll(): Promise<void> {
    if (this.isCalculating) return;
    this.isCalculating = true;

    try {
      // Auto-sync with saved context to stay 100% aligned with active workspace
      const savedSymbol = localStorage.getItem('aq_mkt_symbol') || 'XAU/USD';
      const savedTimeframe = (localStorage.getItem('aq_mkt_timeframe') || '15M') as Timeframe;

      if (this.currentSymbol !== savedSymbol || this.currentTimeframe !== savedTimeframe) {
        this.currentSymbol = savedSymbol;
        this.currentTimeframe = savedTimeframe;
        this.setupDataServiceSubscription();
      }

      // Query up to 250 candles from marketDataService
      // Using fallback padding if necessary inside the indicator calculations
      const candles = await marketDataService.getOHLCCandles(this.currentSymbol, this.currentTimeframe, 250);
      
      const ema50Val = calculateEMA(candles, 50);
      const ema200Val = calculateEMA(candles, 200);
      const atr14Val = calculateATR(candles, 14);
      const rsi14Val = calculateRSI(candles, 14);

      this.state = {
        ema50: ema50Val,
        ema200: ema200Val,
        atr14: atr14Val,
        rsi14: rsi14Val
      };

      // Dispatch to active listeners
      this.listeners.forEach(listener => {
        try {
          listener({ ...this.state });
        } catch (e) {
          console.error('Error forwarding indicators update to listener:', e);
        }
      });
    } catch (err) {
      console.error('Indicator calculation pipeline error:', err);
    } finally {
      this.isCalculating = false;
    }
  }
}

export const indicatorService = IndicatorService.getInstance();
