import { MarketDataPlugin, MarketIntelligenceState } from '../types/marketIntelligence';

class MarketDataPluginRegistry {
  private plugins: Map<string, MarketDataPlugin> = new Map();

  public register(plugin: MarketDataPlugin): void {
    this.plugins.set(plugin.id, plugin);
    console.log(`AQ Market SDK: Registered Market Data Plugin [${plugin.name}]`);
  }

  public unregister(id: string): void {
    this.plugins.delete(id);
  }

  public getPlugins(): MarketDataPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getPlugin(id: string): MarketDataPlugin | undefined {
    return this.plugins.get(id);
  }

  public hasPlugins(): boolean {
    return this.plugins.size > 0;
  }
}

export const marketDataRegistry = new MarketDataPluginRegistry();

// ==========================================
// SAMPLE MARKET DATA PLUGIN: Bloomberg B-Pipe Feed
// ==========================================
export const bloombergBPipePlugin: MarketDataPlugin = {
  id: 'PLG-MKT-BLOOMBERG',
  name: 'Bloomberg B-Pipe Feed',
  description: 'Institutional real-time global consensus market depth and indicators.',
  version: '1.0.4',
  author: 'Bloomberg Professional',
  validateCredentials: (creds) => {
    if (!creds.uuid || creds.uuid.length < 5) {
      return { isValid: false, error: 'Bloomberg Terminal UUID is required.' };
    }
    if (!creds.feedKey) {
      return { isValid: false, error: 'B-Pipe Enterprise Session Key is required.' };
    }
    return { isValid: true };
  },
  fetchLatestState: async (creds) => {
    // Return high confidence institutional state feed
    const now = new Date().toISOString();
    return {
      structure: {
        status: 'OPTIMAL',
        confidence: 94,
        reason: 'Real-time liquidity clusters verified on NYSE and CME Group order books.',
        timestamp: now,
        higherHighs: true,
        higherLows: true,
        lowerHighs: false,
        lowerLows: false,
        rangeDetected: false,
        regime: 'Aggressive Institutional Markup'
      },
      trend: {
        status: 'STABLE',
        confidence: 96,
        reason: 'EMA 50 and EMA 200 separation widening with heavy volume support.',
        timestamp: now,
        ema50: 95480.20,
        ema200: 93850.50,
        trendStrength: 88,
        trendDirection: 'BULLISH'
      },
      volatility: {
        status: 'STABLE',
        confidence: 90,
        reason: 'ATR narrowing dynamically, bid-ask spread compressed at 0.01%.',
        timestamp: now,
        atr: 420.50,
        spreadAnalysis: 1.2,
        volatilityScore: 35
      },
      session: {
        status: 'STABLE',
        confidence: 99,
        reason: 'Overlapping liquidity desk session streams actively bridged.',
        timestamp: now,
        asianActive: false,
        londonActive: true,
        newYorkActive: true,
        sessionOverlap: true,
        activeSessionName: 'London & New York Overlap'
      },
      supportResistance: {
        status: 'STABLE',
        confidence: 91,
        reason: 'Multiple volume profile nodes mapping high-conviction key levels.',
        timestamp: now,
        supportLevels: [94200, 93500, 92000],
        resistanceLevels: [96500, 97800, 99000],
        nearestSupport: 94200,
        nearestResistance: 96500
      }
    };
  }
};

// ==========================================
// SAMPLE MARKET DATA PLUGIN: Reuters Elektron Realtime
// ==========================================
export const reutersElektronPlugin: MarketDataPlugin = {
  id: 'PLG-MKT-REUTERS',
  name: 'Reuters Elektron Realtime',
  description: 'Ultra-low-latency raw tick data stream with custom interval analytics aggregates.',
  version: '2.0.0',
  author: 'Thomson Reuters',
  validateCredentials: (creds) => {
    if (!creds.username || !creds.password) {
      return { isValid: false, error: 'Reuters Elektron login credentials missing.' };
    }
    return { isValid: true };
  },
  fetchLatestState: async (creds) => {
    const now = new Date().toISOString();
    return {
      structure: {
        status: 'STABLE',
        confidence: 89,
        reason: 'Reuters tick analysis matches descending structure across minor keyframes.',
        timestamp: now,
        higherHighs: false,
        higherLows: false,
        lowerHighs: true,
        lowerLows: true,
        rangeDetected: false,
        regime: 'Sustained Supply Distribution'
      },
      trend: {
        status: 'STABLE',
        confidence: 91,
        reason: 'EMA 50 currently testing below EMA 200 with descending momentum.',
        timestamp: now,
        ema50: 94900.00,
        ema200: 95250.00,
        trendStrength: 74,
        trendDirection: 'BEARISH'
      },
      volatility: {
        status: 'WARN',
        confidence: 85,
        reason: 'Sudden ATR increase following block trade liquidation print.',
        timestamp: now,
        atr: 680.10,
        spreadAnalysis: 2.8,
        volatilityScore: 68
      },
      session: {
        status: 'STABLE',
        confidence: 98,
        reason: 'New York trading hours active. High institutional activity.',
        timestamp: now,
        asianActive: false,
        londonActive: false,
        newYorkActive: true,
        sessionOverlap: false,
        activeSessionName: 'New York Session'
      },
      supportResistance: {
        status: 'WARN',
        confidence: 87,
        reason: 'Sellers attacking key $94,000 support level on elevated delta.',
        timestamp: now,
        supportLevels: [94000, 92800, 91500],
        resistanceLevels: [95600, 96200, 97500],
        nearestSupport: 94000,
        nearestResistance: 95600
      }
    };
  }
};

// Register default plugins
marketDataRegistry.register(bloombergBPipePlugin);
marketDataRegistry.register(reutersElektronPlugin);

// ==========================================
// HIGH-FIDELITY GENERATOR FOR HISTORICAL/TEST DATA
// ==========================================
export function generateHistoricalOrTestData(preset: 'Bullish' | 'Bearish' | 'Sideways' | 'Extreme'): MarketIntelligenceState {
  const now = new Date().toISOString();

  switch (preset) {
    case 'Bullish':
      return {
        structure: {
          status: 'OPTIMAL',
          confidence: 85,
          reason: 'Consolidated markup phase. Price continues validating Higher Highs & Higher Lows.',
          timestamp: now,
          higherHighs: true,
          higherLows: true,
          lowerHighs: false,
          lowerLows: false,
          rangeDetected: false,
          regime: 'Markup / Expansion'
        },
        trend: {
          status: 'OPTIMAL',
          confidence: 90,
          reason: 'EMA 50 ($95,200) trades confidently above EMA 200 ($93,100). Angle and separation are rising.',
          timestamp: now,
          ema50: 95200.00,
          ema200: 93100.00,
          trendStrength: 85,
          trendDirection: 'BULLISH'
        },
        volatility: {
          status: 'STABLE',
          confidence: 80,
          reason: 'ATR is healthy ($310). Bid-ask spread remains tight with stable liquidity pools.',
          timestamp: now,
          atr: 310.00,
          spreadAnalysis: 1.1,
          volatilityScore: 40
        },
        session: {
          status: 'STABLE',
          confidence: 95,
          reason: 'London and New York overlapping desk volumes active. Dynamic execution is optimized.',
          timestamp: now,
          asianActive: false,
          londonActive: true,
          newYorkActive: true,
          sessionOverlap: true,
          activeSessionName: 'London & NY Overlap'
        },
        supportResistance: {
          status: 'OPTIMAL',
          confidence: 82,
          reason: 'Strong demand zone established at $94,500. Next major sell target is at $97,000.',
          timestamp: now,
          supportLevels: [94500, 93200, 92000],
          resistanceLevels: [97000, 98200, 99500],
          nearestSupport: 94500,
          nearestResistance: 97000
        }
      };

    case 'Bearish':
      return {
        structure: {
          status: 'WARN',
          confidence: 78,
          reason: 'Supply distribution phase. Lower Highs and Lower Lows print on high-volume pivots.',
          timestamp: now,
          higherHighs: false,
          higherLows: false,
          lowerHighs: true,
          lowerLows: true,
          rangeDetected: false,
          regime: 'Markdown / Liquidation'
        },
        trend: {
          status: 'WARN',
          confidence: 84,
          reason: 'EMA 50 ($93,400) crossed below EMA 200 ($94,800). Descending slope remains strong.',
          timestamp: now,
          ema50: 93400.00,
          ema200: 94800.00,
          trendStrength: 78,
          trendDirection: 'BEARISH'
        },
        volatility: {
          status: 'WARN',
          confidence: 75,
          reason: 'ATR elevated to $580. Bid-ask spreads widening across secondary clearing books.',
          timestamp: now,
          atr: 580.00,
          spreadAnalysis: 2.4,
          volatilityScore: 65
        },
        session: {
          status: 'STABLE',
          confidence: 95,
          reason: 'New York afternoon liquidity. Institutions actively unwinding margin exposures.',
          timestamp: now,
          asianActive: false,
          londonActive: false,
          newYorkActive: true,
          sessionOverlap: false,
          activeSessionName: 'New York Session'
        },
        supportResistance: {
          status: 'WARN',
          confidence: 76,
          reason: 'Broken $94,000 support has flipped to active resistance. Immediate target $91,200.',
          timestamp: now,
          supportLevels: [91200, 90000, 88500],
          resistanceLevels: [94000, 95100, 96300],
          nearestSupport: 91200,
          nearestResistance: 94000
        }
      };

    case 'Sideways':
      return {
        structure: {
          status: 'STANDBY',
          confidence: 88,
          reason: 'Range detected. Prices restricted between well-defined support and resistance channels.',
          timestamp: now,
          higherHighs: false,
          higherLows: false,
          lowerHighs: false,
          lowerLows: false,
          rangeDetected: true,
          regime: 'Mean Reverting Range'
        },
        trend: {
          status: 'STANDBY',
          confidence: 82,
          reason: 'EMA 50 and EMA 200 converge horizontally. Trend power is currently dormant.',
          timestamp: now,
          ema50: 94500.00,
          ema200: 94450.00,
          trendStrength: 15,
          trendDirection: 'SIDEWAYS'
        },
        volatility: {
          status: 'STANDBY',
          confidence: 84,
          reason: 'ATR compressed to $120. Volatility is very quiet. Standard range breakout logic active.',
          timestamp: now,
          atr: 120.00,
          spreadAnalysis: 0.8,
          volatilityScore: 18
        },
        session: {
          status: 'STABLE',
          confidence: 90,
          reason: 'Asian desk hours active. Historical mean-reversion rules apply to range bounds.',
          timestamp: now,
          asianActive: true,
          londonActive: false,
          newYorkActive: false,
          sessionOverlap: false,
          activeSessionName: 'Asian Session'
        },
        supportResistance: {
          status: 'STABLE',
          confidence: 89,
          reason: 'Range extremes validated 4 times. High confidence buy boundary at $94,000.',
          timestamp: now,
          supportLevels: [94000, 93100, 92500],
          resistanceLevels: [95000, 95800, 96500],
          nearestSupport: 94000,
          nearestResistance: 95000
        }
      };

    case 'Extreme':
      return {
        structure: {
          status: 'CRITICAL',
          confidence: 72,
          reason: 'Systemic liquidation event. Price breaks structures on aggressive volume spreads.',
          timestamp: now,
          higherHighs: false,
          higherLows: false,
          lowerHighs: false,
          lowerLows: true,
          rangeDetected: false,
          regime: 'Flash Liquidity Drain'
        },
        trend: {
          status: 'CRITICAL',
          confidence: 80,
          reason: 'Extreme separation. EMA 50 plunging away from EMA 200 on absolute negative delta.',
          timestamp: now,
          ema50: 91200.00,
          ema200: 94800.00,
          trendStrength: 95,
          trendDirection: 'BEARISH'
        },
        volatility: {
          status: 'CRITICAL',
          confidence: 88,
          reason: 'ATR spikes to $1,450. Bid-ask spread has widened 400% on safety halt risk.',
          timestamp: now,
          atr: 1450.00,
          spreadAnalysis: 12.5,
          volatilityScore: 98
        },
        session: {
          status: 'WARN',
          confidence: 95,
          reason: 'London and NY Overlap. Sudden macro sentiment shifts triggered clearing delays.',
          timestamp: now,
          asianActive: false,
          londonActive: true,
          newYorkActive: true,
          sessionOverlap: true,
          activeSessionName: 'London & NY Overlap'
        },
        supportResistance: {
          status: 'CRITICAL',
          confidence: 65,
          reason: 'Order books thin. Historical levels are being breached without standard consolidation.',
          timestamp: now,
          supportLevels: [88000, 85000, 80000],
          resistanceLevels: [93000, 94500, 96000],
          nearestSupport: 88000,
          nearestResistance: 93000
        }
      };
  }
}
