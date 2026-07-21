import { BrokerPlugin, BrokerPosition, BrokerTradeHistory } from '../types/broker';

class BrokerPluginRegistry {
  private plugins: Map<string, BrokerPlugin> = new Map();

  /**
   * Registers a new broker plugin to the AQ Core system.
   */
  public register(plugin: BrokerPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Broker plugin with ID ${plugin.id} is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`AQ SDK: Successfully registered broker plugin [${plugin.name}] (v${plugin.version})`);
  }

  /**
   * Unregisters a broker plugin.
   */
  public unregister(id: string): void {
    this.plugins.delete(id);
  }

  /**
   * Returns all registered broker plugins.
   */
  public getPlugins(): BrokerPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Returns a specific broker plugin by ID.
   */
  public getPlugin(id: string): BrokerPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Checks if any broker plugins are registered in the system.
   */
  public hasPlugins(): boolean {
    return this.plugins.size > 0;
  }
}

export const registry = new BrokerPluginRegistry();

// ==========================================
// SAMPLE BROKER PLUGIN 1: Aureum Clearing Group
// ==========================================
export const aureumClearingPlugin: BrokerPlugin = {
  id: 'PLG-BRK-AUREUM',
  name: 'Aureum Clearing Group',
  description: 'Premium institutional clearing broker with deep gold-backed liquidity routing.',
  version: '1.0.0',
  author: 'Aureum Labs',
  supportedModes: ['LIVE'],
  configSchema: [
    {
      key: 'apiEndpoint',
      label: 'Clearing API Endpoint',
      type: 'text',
      placeholder: 'https://api.aureum.clearing/v1',
      required: true,
      defaultValue: 'https://api.aureum.clearing/v1'
    },
    {
      key: 'jwtToken',
      label: 'JWT Token Key',
      type: 'text',
      placeholder: 'AQ-JWK-xxxxxxxxxxxxxxxx',
      required: true
    },
    {
      key: 'privateSecret',
      label: 'API Private Secret Signature',
      type: 'password',
      placeholder: '••••••••••••••••••••••••••••••••',
      required: true
    }
  ],
  validateConfig: (config) => {
    if (!config.jwtToken || config.jwtToken.length < 10) {
      return { isValid: false, error: 'JWT Token must be a valid AQ-JWK hash of at least 10 characters.' };
    }
    if (!config.privateSecret || config.privateSecret.length < 12) {
      return { isValid: false, error: 'API Private Secret signature must be at least 12 characters.' };
    }
    return { isValid: true };
  },
  getAccountDetails: async (config) => {
    // Simulated live data query based on API configurations
    return {
      balance: 1425800.00,
      equity: 1432450.50,
      margin: 125000.00,
      currency: 'USD'
    };
  },
  getPositions: async (config) => {
    return [
      {
        id: 'POS-AUR-001',
        ticker: 'BTCUSD',
        direction: 'BUY',
        size: 2.5,
        leverage: 10,
        entryPrice: 95400.00,
        currentPrice: 95920.00,
        unrealizedPnl: 1300.00,
        marginRequired: 23850.00,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'POS-AUR-002',
        ticker: 'GLDUSD',
        direction: 'BUY',
        size: 50,
        leverage: 20,
        entryPrice: 2420.50,
        currentPrice: 2435.10,
        unrealizedPnl: 730.00,
        marginRequired: 6051.25,
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  },
  getTradeHistory: async (config) => {
    return [
      {
        id: 'TX-AUR-9901',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        ticker: 'ETHUSD',
        direction: 'SELL',
        size: 15.0,
        leverage: 10,
        entryPrice: 3245.00,
        exitPrice: 3210.00,
        realizedPnl: 525.00,
        status: 'WIN',
        notes: 'HFT limit entry. Target resistance zone retested and rejected.'
      },
      {
        id: 'TX-AUR-9844',
        timestamp: new Date(Date.now() - 3600000 * 32).toISOString(),
        ticker: 'SOLUSD',
        direction: 'BUY',
        size: 100,
        leverage: 5,
        entryPrice: 178.50,
        exitPrice: 177.00,
        realizedPnl: -150.00,
        status: 'LOSS',
        notes: 'Stop triggered on minor liquidity hunt sweep.'
      }
    ];
  },
  submitOrder: async (config, order) => {
    // Submit order simulation
    const mockSuccess = Math.random() > 0.05; // 95% execution guarantee
    if (mockSuccess) {
      const fillPrice = order.price || (order.ticker.includes('BTC') ? 95800 : order.ticker.includes('GLD') ? 2430 : 150);
      return {
        success: true,
        orderId: `ORD-AUR-${Math.floor(100000 + Math.random() * 900000)}`,
        fillPrice,
        message: 'Order filled immediately via Aureum liquidity routing.'
      };
    } else {
      return {
        success: false,
        message: 'Order execution rejected: Margin verification failed on clearing level.'
      };
    }
  }
};

// ==========================================
// SAMPLE BROKER PLUGIN 2: Apex Routing Corp
// ==========================================
export const apexRoutingPlugin: BrokerPlugin = {
  id: 'PLG-BRK-APEX',
  name: 'Apex Routing Corp',
  description: 'Ultra-low-latency DMA routing with deep spread optimization filters.',
  version: '2.1.4',
  author: 'Apex Technology Group',
  supportedModes: ['LIVE'],
  configSchema: [
    {
      key: 'clientId',
      label: 'Apex Client Account ID',
      type: 'text',
      placeholder: 'APEX-DMA-10842',
      required: true
    },
    {
      key: 'secureToken',
      label: 'Apex Secure Access Token',
      type: 'password',
      placeholder: '••••••••••••••••••••••••',
      required: true
    },
    {
      key: 'riskLimit',
      label: 'Slippage Guard Threshold (%)',
      type: 'text',
      placeholder: '0.15',
      required: false,
      defaultValue: '0.2'
    }
  ],
  validateConfig: (config) => {
    if (!config.clientId || !config.clientId.startsWith('APEX-')) {
      return { isValid: false, error: 'Client ID must start with Apex prefix: APEX-xxxxx.' };
    }
    if (!config.secureToken || config.secureToken.length < 8) {
      return { isValid: false, error: 'Apex Secure Access Token is too short (min 8 characters).' };
    }
    return { isValid: true };
  },
  getAccountDetails: async (config) => {
    return {
      balance: 850400.00,
      equity: 849100.00,
      margin: 45000.00,
      currency: 'USD'
    };
  },
  getPositions: async (config) => {
    return [
      {
        id: 'POS-APX-001',
        ticker: 'SOLUSD',
        direction: 'SELL',
        size: 250,
        leverage: 5,
        entryPrice: 182.20,
        currentPrice: 184.10,
        unrealizedPnl: -475.00,
        marginRequired: 9110.00,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
  },
  getTradeHistory: async (config) => {
    return [
      {
        id: 'TX-APX-0294',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        ticker: 'BTCUSD',
        direction: 'BUY',
        size: 0.8,
        leverage: 20,
        entryPrice: 94100.00,
        exitPrice: 94850.00,
        realizedPnl: 600.00,
        status: 'WIN',
        notes: 'Fast scalp execution via Chicago routing lines.'
      }
    ];
  },
  submitOrder: async (config, order) => {
    return {
      success: true,
      orderId: `ORD-APX-${Math.floor(100000 + Math.random() * 900000)}`,
      fillPrice: order.price || 95800,
      message: 'Apex DMA routed order executed successfully on CME engine.'
    };
  }
};

// Auto-register mock plugins to demonstrate modular pluggability
registry.register(aureumClearingPlugin);
registry.register(apexRoutingPlugin);
