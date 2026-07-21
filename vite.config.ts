import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function twelvedataProxyPlugin(): Plugin {
  return {
    name: 'twelvedata-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/twelvedata')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const endpoint = urlObj.searchParams.get('endpoint');
            const symbol = urlObj.searchParams.get('symbol') || 'XAU/USD';
            const interval = urlObj.searchParams.get('interval');
            const outputsize = urlObj.searchParams.get('outputsize') || '15';

            if (!endpoint) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing endpoint' }));
              return;
            }

            const apiKey = process.env.TWELVE_DATA_API_KEY;
            if (!apiKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: 'error',
                message: 'TWELVE_DATA_API_KEY environment variable is not configured on the server. Please check your system secrets.'
              }));
              return;
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

            res.statusCode = apiResponse.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              data,
              latency,
              rateLimit: {
                limit: limit ? parseInt(limit, 10) : 8,
                remaining: remaining ? parseInt(remaining, 10) : 8,
                reset: reset ? parseInt(reset, 10) : 0
              }
            }));
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: error.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), twelvedataProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
