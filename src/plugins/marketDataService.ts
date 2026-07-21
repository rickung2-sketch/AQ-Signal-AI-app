import { 
  MarketDataProvider, 
  TickUpdate, 
  ProviderTelemetry 
} from '../types/marketDataService';
import { 
  Timeframe, 
  OHLC, 
  ConnectionStatus, 
  MarketDataPluginSDK 
} from '../types/marketDataPluginSDK';
import { 
  binanceLivePlugin, 
  coinbasePrimePlugin, 
  coinGeckoPlugin, 
  twelveDataPlugin,
  twelveDataPluginState,
  generateOHLCCandles 
} from './marketDataPlugins';

// ==========================================
// 1. MARKET DATA CACHE IMPLEMENTATION
// ==========================================
export class MarketDataCache {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 2000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  public get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.defaultTtlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    return cached.value as T;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Auto-expiry cleanup
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    setTimeout(() => {
      const current = this.cache.get(key);
      if (current && Date.now() - current.timestamp >= ttl) {
        this.cache.delete(key);
      }
    }, ttl);
  }

  public clear(): void {
    this.cache.clear();
  }
}

// ==========================================
// 2. ADAPTER FOR MarketDataPluginSDK
// ==========================================
export class PluginDataProviderAdapter implements MarketDataProvider {
  public id: string;
  public name: string;
  public description: string;
  public supportedSymbols: string[];
  public supportedTimeframes: Timeframe[];
  private sdk: MarketDataPluginSDK;
  private tickIntervals: Map<string, any> = new Map();
  private credentials: Record<string, string> = {};

  constructor(sdk: MarketDataPluginSDK) {
    this.id = sdk.id;
    this.name = sdk.name;
    this.description = sdk.description;
    this.supportedSymbols = sdk.supportedSymbols;
    this.supportedTimeframes = sdk.supportedTimeframes;
    this.sdk = sdk;
  }

  public setCredentials(creds: Record<string, string>): void {
    this.credentials = creds;
  }

  public async connect(): Promise<void> {
    await this.sdk.connect(this.credentials);
  }

  public async disconnect(): Promise<void> {
    await this.sdk.disconnect();
    this.tickIntervals.forEach(interval => clearInterval(interval));
    this.tickIntervals.clear();
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    const feed = await this.sdk.fetchFeed(symbol, '15M');
    return feed.livePrice;
  }

  public async getBid(symbol: string): Promise<number> {
    const feed = await this.sdk.fetchFeed(symbol, '15M');
    return feed.bid;
  }

  public async getAsk(symbol: string): Promise<number> {
    const feed = await this.sdk.fetchFeed(symbol, '15M');
    return feed.ask;
  }

  public async getSpread(symbol: string): Promise<number> {
    const feed = await this.sdk.fetchFeed(symbol, '15M');
    return parseFloat((feed.ask - feed.bid).toFixed(2));
  }

  public async getOHLCCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    const feed = await this.sdk.fetchFeed(symbol, timeframe);
    return feed.ohlc;
  }

  public async getHistoricalCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    return this.getOHLCCandles(symbol, timeframe, count);
  }

  public subscribeTicks(symbol: string, callback: (tick: TickUpdate) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const feed = await this.sdk.fetchFeed(symbol, '15M');
        callback({
          symbol,
          price: feed.livePrice,
          bid: feed.bid,
          ask: feed.ask,
          spread: parseFloat((feed.ask - feed.bid).toFixed(2)),
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error(`Tick feed subscription error on adapter for [${this.name}]:`, e);
      }
    }, 2000);

    this.tickIntervals.set(symbol, interval);
    
    return () => {
      clearInterval(interval);
      this.tickIntervals.delete(symbol);
    };
  }
}

// ==========================================
// 3. HIGH-FIDELITY DEMO DATA PROVIDER (FALLBACK)
// ==========================================
export class DemoDataProvider implements MarketDataProvider {
  public id = 'PLG-MKT-DEMO-MODE';
  public name = 'Demo Simulation Engine (Fallback)';
  public description = 'Standard internal mock data loop providing real-time ticking quotes and historical charts for BTC, ETH, and SOL.';
  public supportedSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AAPL', 'NVDA', 'TSLA', 'EUR/USD', 'GBP/USD', 'XAU/USD'];
  public supportedTimeframes: Timeframe[] = ['15M', '1H', '4H'];

  private basePrices: Record<string, number> = {
    'BTC/USD': 98500,
    'ETH/USD': 3150,
    'SOL/USD': 185,
    'AAPL': 178.5,
    'NVDA': 122.4,
    'TSLA': 240.2,
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2720,
    'XAU/USD': 2420.5
  };

  private currentPrices: Record<string, number> = { ...this.basePrices };
  private tickIntervals: Map<string, any> = new Map();

  public async connect(): Promise<void> {
    // Immediate loop connection
  }

  public async disconnect(): Promise<void> {
    this.tickIntervals.forEach(interval => clearInterval(interval));
    this.tickIntervals.clear();
  }

  private generateTickingPrice(symbol: string): number {
    const base = this.currentPrices[symbol] || 100;
    const volatility = symbol.includes('BTC') ? 0.001 : symbol.includes('ETH') ? 0.0015 : 0.0025;
    const offset = base * (Math.random() - 0.49) * volatility; // subtle upward bias to feel realistic
    const nextPrice = parseFloat((base + offset).toFixed(symbol.includes('/') && !symbol.includes('USD') ? 4 : 2));
    this.currentPrices[symbol] = nextPrice;
    return nextPrice;
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    return this.generateTickingPrice(symbol);
  }

  public async getBid(symbol: string): Promise<number> {
    const price = this.generateTickingPrice(symbol);
    const spread = price * 0.0002;
    return parseFloat((price - spread / 2).toFixed(2));
  }

  public async getAsk(symbol: string): Promise<number> {
    const price = this.generateTickingPrice(symbol);
    const spread = price * 0.0002;
    return parseFloat((price + spread / 2).toFixed(2));
  }

  public async getSpread(symbol: string): Promise<number> {
    const price = this.currentPrices[symbol] || 100;
    return parseFloat((price * 0.0002).toFixed(2));
  }

  public async getOHLCCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    const base = this.basePrices[symbol] || 100;
    return generateOHLCCandles(symbol, timeframe, base, count, true);
  }

  public async getHistoricalCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    return this.getOHLCCandles(symbol, timeframe, count);
  }

  public subscribeTicks(symbol: string, callback: (tick: TickUpdate) => void): () => void {
    const interval = setInterval(() => {
      const price = this.generateTickingPrice(symbol);
      const spread = parseFloat((price * 0.0002).toFixed(2));
      callback({
        symbol,
        price,
        bid: parseFloat((price - spread / 2).toFixed(2)),
        ask: parseFloat((price + spread / 2).toFixed(2)),
        spread,
        timestamp: new Date().toISOString()
      });
    }, 1500);

    this.tickIntervals.set(symbol, interval);
    return () => {
      clearInterval(interval);
      this.tickIntervals.delete(symbol);
    };
  }
}

// ==========================================
// 4. CENTRAL MARKET DATA SERVICE (SINGLETON)
// ==========================================
export class MarketDataService {
  private static instance: MarketDataService | null = null;
  
  private providers: Map<string, MarketDataProvider> = new Map();
  private activeProviderId: string = 'PLG-MKT-DEMO-MODE';
  private connectionStatus: ConnectionStatus = 'DISCONNECTED';
  
  // Cache systems
  private priceCache = new MarketDataCache(1500); // 1.5s TTL for prices
  private candleCache = new MarketDataCache(12000); // 12s TTL for OHLC

  // Telemetry attributes
  private latencyHistory: number[] = [10]; // rolling latency history in ms
  private tickCount: number = 0;
  private lastTickTimestamp: string | null = null;
  private lastTelemetryReset: number = Date.now();
  private updateRatePerMinute: number = 30; // default estimated rate
  private heartbeatFails: number = 0;

  // Active subscriptions mapping for engines
  private tickListeners: Set<(tick: TickUpdate) => void> = new Set();
  private activeProviderUnsubscribe: (() => void) | null = null;
  private monitoredSymbol: string = 'XAU/USD';

  // Timers
  private heartbeatIntervalId: any = null;
  private updateRateIntervalId: any = null;
  private logCallback: ((log: string) => void) | null = null;

  private constructor() {
    // 1. Register Default Plugins & Demo Fallback
    const demo = new DemoDataProvider();
    this.providers.set(demo.id, demo);
    
    this.providers.set('PLG-MKT-BINANCE-LIVE', new PluginDataProviderAdapter(binanceLivePlugin));
    this.providers.set('PLG-MKT-COINBASE-PRO', new PluginDataProviderAdapter(coinbasePrimePlugin));
    this.providers.set('PLG-MKT-COINGECKO', new PluginDataProviderAdapter(coinGeckoPlugin));
    this.providers.set('PLG-MKT-TWELVEDATA', new PluginDataProviderAdapter(twelveDataPlugin));
    
    // Default to Twelve Data Forex Feed (Production V1.1)
    this.activeProviderId = 'PLG-MKT-TWELVEDATA';
    this.connectionStatus = 'CONNECTING';
    
    // Start Background Heartbeat and Telemetry loops
    this.startHeartbeatMonitor();
    this.startUpdateRateCalculator();
    this.setupActiveProviderSubscription();

    // Hot-swap connection on microtask queue
    Promise.resolve().then(() => {
      this.switchProvider('PLG-MKT-TWELVEDATA').catch(() => {
        this.switchProvider('PLG-MKT-DEMO-MODE');
      });
    });
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  public setLogger(logger: (log: string) => void): void {
    this.logCallback = logger;
  }

  private log(message: string): void {
    console.log(`[MarketDataService] ${message}`);
    if (this.logCallback) {
      this.logCallback(`MARKET-SERVICE: ${message}`);
    }
  }

  // Active Provider Access
  public getActiveProvider(): MarketDataProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      // Fallback guarantees
      return this.providers.get('PLG-MKT-DEMO-MODE')!;
    }
    return provider;
  }

  public getProvidersList(): MarketDataProvider[] {
    return Array.from(this.providers.values());
  }

  public getActiveProviderId(): string {
    return this.activeProviderId;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Change interchangeable provider with auto-handshake and credentials proxy
  public async switchProvider(providerId: string, credentials?: Record<string, string>): Promise<void> {
    this.log(`Initiating hot-swap of market data provider to [${providerId}]`);
    
    // Clean up previous subscription
    if (this.activeProviderUnsubscribe) {
      this.activeProviderUnsubscribe();
      this.activeProviderUnsubscribe = null;
    }

    const previousProvider = this.getActiveProvider();
    await previousProvider.disconnect();

    const nextProvider = this.providers.get(providerId);
    if (!nextProvider) {
      this.log(`Error: Provider [${providerId}] does not exist. Seamlessly maintaining [PLG-MKT-DEMO-MODE].`);
      this.activeProviderId = 'PLG-MKT-DEMO-MODE';
      this.connectionStatus = 'CONNECTED';
      this.setupActiveProviderSubscription();
      return;
    }

    if (providerId === 'PLG-MKT-DEMO-MODE') {
      this.activeProviderId = 'PLG-MKT-DEMO-MODE';
      this.connectionStatus = 'CONNECTED';
      this.setupActiveProviderSubscription();
      this.log(`Switched to high-fidelity internal Demo Data Mode.`);
      return;
    }

    // Connect to actual plugin
    this.connectionStatus = 'CONNECTING';
    
    if (nextProvider instanceof PluginDataProviderAdapter && credentials) {
      nextProvider.setCredentials(credentials);
    }

    try {
      const startTime = Date.now();
      await nextProvider.connect();
      const rtt = Date.now() - startTime;
      
      this.recordLatency(rtt);
      this.activeProviderId = providerId;
      this.connectionStatus = 'CONNECTED';
      this.heartbeatFails = 0;
      this.setupActiveProviderSubscription();
      
      this.log(`Swapped provider successfully to [${nextProvider.name}]. Connected in ${rtt}ms.`);
    } catch (err) {
      this.connectionStatus = 'FAILED';
      this.log(`Handshake failed for [${nextProvider.name}]. TRIGGERING BREAKDOWN CIRCUITS AND SWITCHING TO OFFLINE DEMO MODE.`);
      
      // Automatic switch to Demo Data Mode on connection failure
      this.activeProviderId = 'PLG-MKT-DEMO-MODE';
      this.connectionStatus = 'CONNECTED';
      this.setupActiveProviderSubscription();
    }
  }

  // ==========================================
  // ABSTRACTED DATA RETRIEVAL INTERFACES
  // ==========================================
  
  public getLastPrice(symbol: string): number {
    const cacheKey = `price_${symbol}`;
    const cached = this.priceCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    const demo = this.providers.get('PLG-MKT-DEMO-MODE');
    if (demo) {
      return (demo as any).currentPrices?.[symbol] || (demo as any).basePrices?.[symbol] || 100;
    }
    return 100;
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    const cacheKey = `price_${symbol}`;
    const cached = this.priceCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    const startTime = Date.now();
    try {
      const price = await this.getActiveProvider().getCurrentPrice(symbol);
      this.recordLatency(Date.now() - startTime);
      this.priceCache.set(cacheKey, price);
      return price;
    } catch (err) {
      this.handleProviderFailure('price-fetch');
      return await this.providers.get('PLG-MKT-DEMO-MODE')!.getCurrentPrice(symbol);
    }
  }

  public async getBid(symbol: string): Promise<number> {
    const cacheKey = `bid_${symbol}`;
    const cached = this.priceCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const bid = await this.getActiveProvider().getBid(symbol);
      this.priceCache.set(cacheKey, bid);
      return bid;
    } catch (err) {
      return await this.providers.get('PLG-MKT-DEMO-MODE')!.getBid(symbol);
    }
  }

  public async getAsk(symbol: string): Promise<number> {
    const cacheKey = `ask_${symbol}`;
    const cached = this.priceCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const ask = await this.getActiveProvider().getAsk(symbol);
      this.priceCache.set(cacheKey, ask);
      return ask;
    } catch (err) {
      return await this.providers.get('PLG-MKT-DEMO-MODE')!.getAsk(symbol);
    }
  }

  public async getSpread(symbol: string): Promise<number> {
    const cacheKey = `spread_${symbol}`;
    const cached = this.priceCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const spread = await this.getActiveProvider().getSpread(symbol);
      this.priceCache.set(cacheKey, spread);
      return spread;
    } catch (err) {
      return await this.providers.get('PLG-MKT-DEMO-MODE')!.getSpread(symbol);
    }
  }

  public async getOHLCCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    const cacheKey = `ohlc_${symbol}_${timeframe}_${count}`;
    const cached = this.candleCache.get<OHLC[]>(cacheKey);
    if (cached !== null) return cached;

    const startTime = Date.now();
    try {
      const ohlc = await this.getActiveProvider().getOHLCCandles(symbol, timeframe, count);
      this.recordLatency(Date.now() - startTime);
      this.candleCache.set(cacheKey, ohlc);
      return ohlc;
    } catch (err) {
      this.handleProviderFailure('candles-fetch');
      return await this.providers.get('PLG-MKT-DEMO-MODE')!.getOHLCCandles(symbol, timeframe, count);
    }
  }

  public async getHistoricalCandles(symbol: string, timeframe: Timeframe, count: number = 20): Promise<OHLC[]> {
    // Under abstract specifications, historical candles proxy candles cache
    return this.getOHLCCandles(symbol, timeframe, count);
  }

  // Real-time Tick Subscription for consumer engines
  public subscribeTicks(symbol: string, callback: (tick: TickUpdate) => void): () => void {
    this.tickListeners.add(callback);
    this.monitoredSymbol = symbol;
    
    // Re-bind source provider stream to ensure correct symbol ticks
    this.setupActiveProviderSubscription();

    return () => {
      this.tickListeners.delete(callback);
    };
  }

  // ==========================================
  // LATENCY & QUALITY SIGNALING CALCULATOR
  // ==========================================
  private recordLatency(rtt: number): void {
    this.latencyHistory.push(rtt);
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }
  }

  public getAverageLatency(): number {
    const sum = this.latencyHistory.reduce((s, x) => s + x, 0);
    return Math.round(sum / this.latencyHistory.length) || 12;
  }

  // Calculates a robust, responsive 0-100 Connection Quality Score
  public getConnectionQualityScore(): number {
    if (this.activeProviderId === 'PLG-MKT-DEMO-MODE') {
      return 100; // Perfect local synthetic loop back
    }
    if (this.connectionStatus !== 'CONNECTED') {
      return 0;
    }

    const avgLatency = this.getAverageLatency();
    let score = 100;

    // 1. Latency penalization (up to -40 points)
    if (avgLatency > 500) {
      score -= 40;
    } else if (avgLatency > 150) {
      score -= 20;
    } else if (avgLatency > 80) {
      score -= 10;
    }

    // 2. Heartbeat drops penalization (up to -50 points)
    score -= (this.heartbeatFails * 25);

    // 3. Last update recency penalization
    if (this.lastTickTimestamp) {
      const elapsedSec = (Date.now() - new Date(this.lastTickTimestamp).getTime()) / 1000;
      if (elapsedSec > 15) {
        score -= 20;
      } else if (elapsedSec > 6) {
        score -= 8;
      }
    } else {
      score -= 15;
    }

    return Math.max(0, score);
  }

  // ==========================================
  // RESILIENCY & FAILURE RECOVERY CONTROLLER
  // ==========================================
  
  // Heartbeat monitoring running every 5 seconds
  private startHeartbeatMonitor(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    
    this.heartbeatIntervalId = setInterval(async () => {
      if (this.activeProviderId === 'PLG-MKT-DEMO-MODE' || this.connectionStatus !== 'CONNECTED') {
        return;
      }

      try {
        const startTime = Date.now();
        // Ping provider with basic price probe
        await this.getActiveProvider().getCurrentPrice(this.monitoredSymbol);
        this.recordLatency(Date.now() - startTime);
        
        // Reset fails upon success
        this.heartbeatFails = 0;
      } catch (err) {
        this.heartbeatFails++;
        this.log(`Heartbeat failed (${this.heartbeatFails}/3) for active provider [${this.getActiveProvider().name}]`);
        
        if (this.heartbeatFails >= 3) {
          this.log(`Heartbeat critical breach! Initiating automated recovery circuit...`);
          this.triggerAutomaticReconnection();
        }
      }
    }, 5000);
  }

  private triggerAutomaticReconnection(): void {
    this.connectionStatus = 'FAILED';
    this.log(`Transport link severed. Commencing automatic reconnection procedure...`);
    
    let retries = 0;
    const maxRetries = 2;
    const providerToReconnectId = this.activeProviderId;
    
    const attemptReconnect = async () => {
      retries++;
      this.log(`Reconnection handshake attempt (${retries}/${maxRetries})...`);
      try {
        const provider = this.providers.get(providerToReconnectId);
        if (provider) {
          await provider.connect();
          this.connectionStatus = 'CONNECTED';
          this.heartbeatFails = 0;
          this.setupActiveProviderSubscription();
          this.log(`Reconnection successful! Link restored for [${provider.name}].`);
        }
      } catch (e) {
        this.log(`Reconnection handshake (${retries}) failed.`);
        if (retries < maxRetries) {
          setTimeout(attemptReconnect, 3000);
        } else {
          this.log(`Automated link recovery failed completely. SEAMLESS FALLBACK ACTIVATED: Switching instantly to Demo Data Mode.`);
          this.switchProvider('PLG-MKT-DEMO-MODE');
        }
      }
    };

    setTimeout(attemptReconnect, 2000);
  }

  private handleProviderFailure(context: string): void {
    if (this.activeProviderId === 'PLG-MKT-DEMO-MODE') return;
    this.heartbeatFails++;
    this.log(`Friction detected in provider query [${context}]. Fault count: ${this.heartbeatFails}/3`);
    
    if (this.heartbeatFails >= 3) {
      this.triggerAutomaticReconnection();
    }
  }

  // ==========================================
  // TICK RATE CALCULATORS
  // ==========================================
  private startUpdateRateCalculator(): void {
    if (this.updateRateIntervalId) {
      clearInterval(this.updateRateIntervalId);
    }
    
    this.updateRateIntervalId = setInterval(() => {
      const elapsedMinutes = (Date.now() - this.lastTelemetryReset) / 60000;
      if (elapsedMinutes > 0.1) {
        this.updateRatePerMinute = Math.round(this.tickCount / elapsedMinutes);
        this.tickCount = 0;
        this.lastTelemetryReset = Date.now();
      }
    }, 8000);
  }

  private setupActiveProviderSubscription(): void {
    if (this.activeProviderUnsubscribe) {
      this.activeProviderUnsubscribe();
      this.activeProviderUnsubscribe = null;
    }

    const provider = this.getActiveProvider();
    
    // Subscribe to raw tick updates from the provider and forward to listeners
    this.activeProviderUnsubscribe = provider.subscribeTicks(this.monitoredSymbol, (tick: TickUpdate) => {
      this.tickCount++;
      this.lastTickTimestamp = tick.timestamp;
      
      // Dispatch tick to all global engine listeners
      this.tickListeners.forEach(listener => {
        try {
          listener(tick);
        } catch (e) {
          console.error('Error forwarding tick update to engine listener:', e);
        }
      });
    });
  }

  // Exposes structured diagnostics telemetry
  public getTelemetry(): ProviderTelemetry {
    const provider = this.getActiveProvider();
    let requestsRemaining: number | undefined;
    let requestsLimit: number | undefined;

    if (this.activeProviderId === 'PLG-MKT-TWELVEDATA') {
      requestsRemaining = twelveDataPluginState.requestsRemaining;
      requestsLimit = twelveDataPluginState.requestsLimit;
    }

    return {
      providerId: this.activeProviderId,
      providerName: provider.name,
      status: this.connectionStatus,
      latency: this.getAverageLatency(),
      updateRate: this.updateRatePerMinute,
      connectionQuality: this.getConnectionQualityScore(),
      lastTickTimestamp: this.lastTickTimestamp,
      requestsRemaining,
      requestsLimit
    };
  }
}

export const marketDataService = MarketDataService.getInstance();
