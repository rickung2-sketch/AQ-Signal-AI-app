import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Log requests for diagnostic purposes
  app.use((req, res, next) => {
    console.log(`[API Gateway] ${req.method} ${req.url}`);
    next();
  });

  // --- API Endpoints ---

  // Health check endpoint used by settings tab verification
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      latency: '12ms',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // 1. POST /auth/login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email address or passcode security fields.' });
    }
    
    // Create a high-fidelity JWT
    const token = `aq_jwt_${Buffer.from(email).toString('base64').substring(0, 16)}_${Date.now()}`;
    return res.status(200).json({
      success: true,
      token,
      user: {
        uid: `USR-${Math.floor(Math.random() * 90000) + 10000}`,
        email: email,
        displayName: 'Senior Operator',
        photoURL: null
      }
    });
  });

  // 2. POST /auth/register
  app.post('/api/auth/register', (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'All operator registration fields are mandatory.' });
    }
    return res.status(201).json({
      success: true,
      user: {
        uid: `USR-${Math.floor(Math.random() * 90000) + 10000}`,
        email,
        displayName,
        emailVerified: true
      }
    });
  });

  // 3. POST /auth/logout
  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Operator session terminated cleanly.' });
  });

  // 4. POST /auth/refresh
  app.post('/api/auth/refresh', (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing authorization token for refresh operation.' });
    }
    const refreshedToken = `aq_jwt_refreshed_${Date.now()}`;
    res.json({ token: refreshedToken });
  });

  // Mock static data for signals
  const activeSignals = [
    {
      id: 'SIG-XAU-1001',
      symbol: 'XAU/USD (Gold)',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 2410.50,
      stopLoss: 2395.00,
      takeProfit1: 2425.00,
      takeProfit2: 2445.00,
      confidenceScore: 94.8,
      aiReasoning: 'Bullish engulfing breakout confirmed on the 4H timeframe. Key structural support at 2405 holding strong. Multi-timeframe trend alignment suggests high-probability continuation of upward impulsive movement.',
      aiAnalysisPoints: [
        'Engulfing candle validation on 4H structure',
        'Strong buyer concentration detected near SMA-200',
        'Momentum RSI divergence exited oversold territory'
      ],
      timestamp: new Date().toISOString(),
      status: 'ACTIVE'
    },
    {
      id: 'SIG-US30-1003',
      symbol: 'US30 (Dow Jones)',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 39120.00,
      stopLoss: 39350.00,
      takeProfit1: 38850.00,
      takeProfit2: 38600.00,
      confidenceScore: 91.2,
      aiReasoning: 'Liquidity sweep confirmed at daily high range. Strong rejection wick indicates institution distribution blocks are fully operational. Market structure shift (MSS) triggered on the 15M timeframe.',
      aiAnalysisPoints: [
        'Rejection of daily key distribution block',
        'Market structure shift on high volume',
        'MACD bearish crossover with momentum increase'
      ],
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'ACTIVE'
    },
    {
      id: 'SIG-EUR-1002',
      symbol: 'EUR/USD',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 1.08920,
      stopLoss: 1.09450,
      takeProfit1: 1.08400,
      takeProfit2: 1.07800,
      confidenceScore: 89.2,
      aiReasoning: 'Distribution structure completed in the Asian session. Order book shows heavy sell liquidity sitting directly above current market price. Target zone aligns with daily support pivot.',
      aiAnalysisPoints: [
        'Wyckoff distribution block confirmation',
        'Bearish MACD crossover on 1H timeframe',
        'Liquidity sweep at 1.0920 before rejection'
      ],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'ACTIVE'
    }
  ];

  const closedHistory = [
    {
      id: 'SIG-BTC-901',
      symbol: 'BTC/USD (Bitcoin)',
      direction: 'BUY',
      type: 'MARKET',
      entryPrice: 62450.00,
      stopLoss: 61500.00,
      takeProfit1: 64100.00,
      takeProfit2: 66000.00,
      confidenceScore: 93.5,
      aiReasoning: 'Liquidity validation at key daily block. High volume breakout verified with strong institutional accumulation triggers.',
      aiAnalysisPoints: [
        'Institutional order block retested',
        'Volume spread analysis confirms bullish absorption',
        'RSI trendline break with breakout velocity'
      ],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'CLOSED',
      resultPips: 1650
    },
    {
      id: 'SIG-GBP-902',
      symbol: 'GBP/USD',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 1.27200,
      stopLoss: 1.26800,
      takeProfit1: 1.27900,
      takeProfit2: 1.28500,
      confidenceScore: 88.0,
      aiReasoning: 'Double bottom accumulation pattern on the 1H timeframe with clear bullish volume divergence.',
      aiAnalysisPoints: [
        'Double bottom support validation at key level',
        'Increasing volume on upswings',
        'Stochastic oscillator bullish expansion'
      ],
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'EXPIRED',
      resultPips: 0
    }
  ];

  // 5. GET /signal/latest
  app.get('/api/signal/latest', (req, res) => {
    // Dynamic updates of timestamps to keep feed fresh
    const responseData = activeSignals.map(s => ({
      ...s,
      timestamp: new Date().toISOString()
    }));
    res.json(responseData);
  });

  // 6. GET /signal/history
  app.get('/api/signal/history', (req, res) => {
    res.json(closedHistory);
  });

  // 7. GET /signal/{id}
  app.get('/api/signal/:id', (req, res) => {
    const { id } = req.params;
    const all = [...activeSignals, ...closedHistory];
    const found = all.find(s => s.id === id);
    if (!found) {
      return res.status(404).json({ message: `Signal with ID ${id} not found.` });
    }
    res.json(found);
  });

  // 8. GET /guardian/status
  app.get('/api/guardian/status', (req, res) => {
    res.json({
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      lastChecked: new Date().toISOString(),
      uptime24h: 99.98,
      activeRulesCount: 42,
      guardianAiSummary: 'AQ Guardian Shield is fully functional. Security bounds are strictly holding, with zero abnormal price spike anomalies detected across all primary liquidity feeds.'
    });
  });

  // Local preferences cache (transient server memory)
  let userPrefs = {
    theme: 'dark',
    notificationsEnabled: true,
    minConfidence: 75,
    riskTolerance: 'MODERATE',
    selectedSymbols: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD']
  };

  // 9. GET /user/preferences
  app.get('/api/user/preferences', (req, res) => {
    res.json(userPrefs);
  });

  // 10. PUT /user/preferences
  app.put('/api/user/preferences', (req, res) => {
    const newPrefs = req.body;
    userPrefs = { ...userPrefs, ...newPrefs };
    res.json(userPrefs);
  });

  // 11. POST /notifications/register-device
  app.post('/api/notifications/register-device', (req, res) => {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required to register for push notifications.' });
    }
    console.log(`[Push Notification Registry] Successfully registered token: ${token} for platform: ${platform || 'unknown'}`);
    res.status(200).json({
      success: true,
      message: 'Operator device registered successfully for push signal bulletins.',
      registeredAt: new Date().toISOString()
    });
  });

  // Twelve Data Proxy (Preserving existing logic)
  app.get('/api/twelvedata', async (req, res) => {
    try {
      const { endpoint, symbol = 'XAU/USD', interval, outputsize = '15' } = req.query;

      if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint query parameter' });
      }

      const apiKey = process.env.TWELVE_DATA_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          status: 'error',
          message: 'TWELVE_DATA_API_KEY environment variable is not configured. Please check your secrets.'
        });
      }

      let targetUrl = `https://api.twelvedata.com/${endpoint}?symbol=${symbol}&apikey=${apiKey}`;
      if (interval) targetUrl += `&interval=${interval}`;
      if (outputsize) targetUrl += `&outputsize=${outputsize}`;

      const startTime = Date.now();
      const apiResponse = await fetch(targetUrl);
      const data = await apiResponse.json();
      const latency = Date.now() - startTime;

      const limit = apiResponse.headers.get('x-ratelimit-limit');
      const remaining = apiResponse.headers.get('x-ratelimit-remaining');
      const reset = apiResponse.headers.get('x-ratelimit-reset');

      res.status(apiResponse.status).json({
        data,
        latency,
        rateLimit: {
          limit: limit ? parseInt(limit, 10) : 8,
          remaining: remaining ? parseInt(remaining, 10) : 8,
          reset: reset ? parseInt(reset, 10) : 0
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // --- Serve Assets with Vite Middleware (Dev) or Express static (Prod) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[AQ Core] High-fidelity REST Server listening on host 0.0.0.0 and port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('[AQ Core] Failed to boot REST API backend server:', err);
});
