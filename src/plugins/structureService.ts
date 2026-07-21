import { marketDataService } from './marketDataService';
import { Timeframe } from '../types/marketDataPluginSDK';
import { MarketStructureEngineState } from '../types/structureEngine';
import { calculateMarketStructure } from './structureEngine';

export class StructureService {
  private static instance: StructureService | null = null;

  private state: MarketStructureEngineState | null = null;
  private currentSymbol: string = 'XAU/USD';
  private currentTimeframe: Timeframe = '15M';
  private listeners: Set<(state: MarketStructureEngineState) => void> = new Set();
  private tickUnsubscribe: (() => void) | null = null;
  private isCalculating: boolean = false;

  private constructor() {
    this.currentSymbol = localStorage.getItem('aq_mkt_symbol') || 'XAU/USD';
    this.currentTimeframe = (localStorage.getItem('aq_mkt_timeframe') || '15M') as Timeframe;
    this.setupDataServiceSubscription();
    this.recalculateAll();
  }

  public static getInstance(): StructureService {
    if (!StructureService.instance) {
      StructureService.instance = new StructureService();
    }
    return StructureService.instance;
  }

  public updateContext(symbol: string, timeframe: Timeframe): void {
    if (this.currentSymbol !== symbol || this.currentTimeframe !== timeframe) {
      this.currentSymbol = symbol;
      this.currentTimeframe = timeframe;
      this.setupDataServiceSubscription();
      this.recalculateAll();
    }
  }

  public subscribe(callback: (state: MarketStructureEngineState) => void): () => void {
    this.listeners.add(callback);
    if (this.state) {
      callback({ ...this.state });
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getState(): MarketStructureEngineState | null {
    return this.state ? { ...this.state } : null;
  }

  private setupDataServiceSubscription(): void {
    if (this.tickUnsubscribe) {
      this.tickUnsubscribe();
    }

    this.tickUnsubscribe = marketDataService.subscribeTicks(this.currentSymbol, () => {
      this.recalculateAll();
    });
  }

  public async recalculateAll(): Promise<void> {
    if (this.isCalculating) return;
    this.isCalculating = true;

    try {
      const savedSymbol = localStorage.getItem('aq_mkt_symbol') || 'XAU/USD';
      const savedTimeframe = (localStorage.getItem('aq_mkt_timeframe') || '15M') as Timeframe;

      if (this.currentSymbol !== savedSymbol || this.currentTimeframe !== savedTimeframe) {
        this.currentSymbol = savedSymbol;
        this.currentTimeframe = savedTimeframe;
        this.setupDataServiceSubscription();
      }

      const candles = await marketDataService.getOHLCCandles(this.currentSymbol, this.currentTimeframe, 150);
      const nextState = calculateMarketStructure(candles);
      this.state = nextState;

      this.listeners.forEach(listener => {
        try {
          listener({ ...nextState });
        } catch (e) {
          console.error('Error in structure service listener:', e);
        }
      });
    } catch (err) {
      console.error('Market structure pipeline calculation error:', err);
    } finally {
      this.isCalculating = false;
    }
  }
}

export const structureService = StructureService.getInstance();
