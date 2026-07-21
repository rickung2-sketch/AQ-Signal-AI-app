# AQ SIGNAL AI — MASTER SPECIFICATION

This document is the **Single Source of Truth** and authoritative technical specification for the AQ SIGNAL AI platform. It details the existing architecture, structural boundaries, REST API schemas, offline synchronization, notifications behavior, and design system constraints.

---

## 1. VISION & DESIGN PRINCIPLES
AQ SIGNAL AI is a luxury, high-fidelity financial signal companion application designed for institutional operators. 
* **Zero-Broker Policy**: The platform is purely analytical. There is absolutely no trade execution, broker linking, or capital-clearing functionality built into the client app.
* **Luxury Dark & Gold Theme**: 
  * Backgrounds use deep, immersive pure blacks (`#000000` / `#070707`) to optimize contrast.
  * Accents use a premium, radiant gold (`#D4AF37`) indicating high-fidelity intelligence.
  * System alerts, stop limits, and bullish indicators use crisp status colors (Success: `#4CAF50`, Error/Stop Limit: `#FF5252`, Neutral/Pending: `#9E9E9E`).
* **Architectural Honesty**: Every piece of on-screen telemetry maps back to a real functional endpoint, REST response state, or system latency tracker. The design rejects fake placeholder telemetry logs.

---

## 2. REPOSITORIAL DIRECTORY STRUCTURE
The project is organized in a clear, dual-layer modular hierarchy:

```
├── /                          # Workspace Root & API Gateway
│   ├── server.ts              # Express Backend with robust REST API routes & Vite middleware
│   ├── package.json           # Dual-mode script manager & dependency catalog
│   ├── tsconfig.json          # Workspace TypeScript build instructions
│   ├── vite.config.ts         # Asset pipeline & Vite middleware configurations
│   ├── metadata.json          # Platform metadata & major capability descriptors
│   └── AQ_SIGNAL_AI_MASTER_SPEC.md # This specification file
│
└── /mobile                    # High-Fidelity Expo Mobile Application
    ├── api/
    │   └── client.ts          # Axios client instance with Bearer token interpolation
    ├── app/                   # Expo Router File-system Navigation Tree
    │   ├── (auth)/            # Operator Verification Gates
    │   │   ├── login.tsx      # Multi-factor authentication input
    │   │   ├── register.tsx   # Secured operator registration screen
    │   │   ├── forgot-password.tsx
    │   │   └── verify-email.tsx
    │   ├── (main)/            # Secure Application Context
    │   │   ├── index.tsx      # Main Signals Dashboard & AQ Guardian Hub
    │   │   ├── analysis.tsx   # Detailed chart analysis & technical audits
    │   │   ├── ledger.tsx     # Completed transactions auditing log
    │   │   └── settings.tsx   # System metadata, notifications, & account erasure
    │   └── _layout.tsx        # Top-level entry & global provider mounting
    ├── components/            # Reusable UI Atoms & Molecules
    │   ├── AQChart.tsx        # Responsive custom canvas chart snapshot
    │   ├── AQRing.tsx         # Shared Reanimated continuous scoring scanner
    │   ├── Button.tsx         # Unified pressable selector
    │   ├── Card.tsx           # Framed component container (optional gold borders)
    │   ├── SplashScreen.tsx   # Immersive gold-glow entry sequence
    │   └── Typography.tsx     # Typography scales (sans, display, monospace)
    ├── constants/
    │   └── config.ts          # Consolidated global constants & environment endpoints
    ├── features/
    │   └── signals/
    │       └── api.ts         # TanStack Query custom hook abstractions
    ├── firebase/
    │   └── config.ts          # Client-side Firebase SDK configuration
    ├── services/
    │   ├── apiService.ts      # Core API client proxy, retry engine & offline MMKV cache
    │   └── notifications.ts   # Device push credentials registry
    ├── store/
    │   ├── authStore.ts       # Zustand-managed Authentication Core
    │   └── signalStore.ts     # Zustand-managed Signal Memory state
    ├── theme/
    │   └── colors.ts          # Palette dictionary
    └── utils/
        └── storage.ts         # Ultra-low latency MMKV store instance
```

---

## 3. EXPRESS BACKEND REST API ENDPOINTS
The API gateway is implemented server-side in `/server.ts` binding to host `0.0.0.0` and port `3000` in standard containers.

### Authentication Endpoints
* **`POST /api/auth/login`**:
  * Receives `email`, `password`.
  * Returns a premium `token` (e.g., `aq_jwt_...`) and high-fidelity operator object.
* **`POST /api/auth/register`**:
  * Receives `email`, `password`, `displayName`.
  * Creates an operator identity with default permissions.
* **`POST /api/auth/logout`**:
  * Terminates the active session token cleanly.
* **`POST /api/auth/refresh`**:
  * Exchanges an active token for a renewed cryptographic authorization wrapper.

### Signal Endpoints
* **`GET /api/signal/latest`**:
  * Returns an array of active signal models. Each model contains `id`, `symbol`, `direction` (`BUY`/`SELL`), `type` (`LIMIT`/`MARKET`), `entryPrice`, `stopLoss`, `takeProfit1`, `takeProfit2`, `confidenceScore`, `aiReasoning`, `aiAnalysisPoints` (3-bullet analysis details), and `timestamp`.
* **`GET /api/signal/history`**:
  * Retrieves archived historical trades including their performance outcome (`resultPips` gain/loss).
* **`GET /api/signal/{id}`**:
  * Returns detailed metadata for a specific active or archived signal.

### Security & Guardian Endpoints
* **`GET /api/guardian/status`**:
  * Retrieves threat evaluation states from the AQ Guardian network (`riskLevel`, `activeRulesCount`, `uptime24h`, `guardianAiSummary`).

### Settings & Devices Endpoints
* **`GET /api/user/preferences`** & **`PUT /api/user/preferences`**:
  * Fetch and update user preferences (`theme`, `notificationsEnabled`, `minConfidence`, `riskTolerance`, `selectedSymbols`).
* **`POST /api/notifications/register-device`**:
  * Accepts `token` (Expo / Firebase push token) and `platform` (`ios`/`android`). Maps the hardware device to the operator token to route real-time signals.

---

## 4. OFFLINE SYNCHRONIZATION & SMART REFRESH
The client integrates a multi-layered resilience architecture to guarantee performance under unstable network coverage:
1. **Axios Bearer Verification**: The API client automatically appends the active session token inside request headers.
2. **Exponential Backoff Retry Engine**: Critical API calls are wrapped in a generic promise-based retrier (`withRetry`), making up to 3 retrieval attempts with backoff before failing.
3. **Ultra-Low Latency Offline Cache**: Successful REST responses from `/signal/latest`, `/signal/history`, `/guardian/status`, and `/user/preferences` are serialized and cached inside highly performant MMKV local storage. When offline, cached parameters are loaded instantly to preserve app responsiveness.
4. **Smart Refresh Matrix**:
  * **30-Second Background Poll**: TanStack Query automatically polls the backend every 30 seconds to fetch state changes.
  * **Pull to Refresh**: Active lists support standard `RefreshControl` gestures.
  * **Notification-Triggered Refresh**: Real-time push arrivals automatically invalidate the local cache and trigger foreground data queries, ensuring near-instant updates.

---

## 5. DESIGN SYSTEM & REUSABLE COMPONENT CONTRACTS
Typography, spacing, and styling conventions are managed using strict Tailwind and React Native stylesheets:

### Monospace Styling and Display Fonts
* Pairings utilize standard layout parameters:
  * **Display Headings**: High-contrast, wide-tracking elements utilizing visual hierarchies.
  * **Monospace Logs**: System-internal hashes, prices, pips, and dates use `JetBrains Mono` or the integrated platform monospace font.
* **AQRing component**:
  * Shared Reanimated element implementing continuous, slow-spinning scanner rings (`withLoop`) and mounting pulses (`withTiming`) to present confidence scores cleanly.
* **AQChart component**:
  * Responsive SVG line graph that normalizes raw price points to automatically scale within the parent container's layout metrics.

### Expandable Sections
* Settings screen features expandable, clean accordion cards for the Privacy Policy and Terms of Service, utilizing Reanimated layouts.

---

## 6. COMPILING AND PRODUCTION REBUILD DIRECTIVES
To run cleanly inside server-side environments and bypass ESM import constraints:
* **The Dev Loop**: `npm run dev` boots the Express gateway and Vite middleware simultaneously using `tsx`.
* **The Production Build**: 
  * Compiles frontend assets inside standard static directories via `vite build`.
  * Bundles server-side TypeScript code into a single, compiled CJS file at `dist/server.cjs` using `esbuild` with `--packages=external`. This prevents relative ESM runtime errors during server initialization.
  * Production app boots directly using `node dist/server.cjs`.

---
This master specification remains static and authoritative. No code alterations or functional expansions should deviate from the architectural paths defined above.
