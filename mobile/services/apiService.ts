import { apiClient } from '../api/client';
import { storage } from '../utils/storage';
import { Signal } from '../store/signalStore';

// Type definitions for API models
export interface GuardianStatus {
  status: 'ACTIVE' | 'MAINTENANCE' | 'ALERT' | 'STANDBY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastChecked: string;
  uptime24h: number;
  activeRulesCount: number;
  guardianAiSummary: string;
}

export interface UserPreferences {
  theme: string;
  notificationsEnabled: boolean;
  minConfidence: number;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  selectedSymbols: string[];
}

/**
 * Custom promise-based retry wrapper to avoid external dependencies issues.
 * Retries asynchronous calls with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.warn(`[API Retry] Request failed. Retrying in ${delay}ms... (${retries} attempts left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

/**
 * Cache helpers using high-performance MMKV storage
 */
const CACHE_KEYS = {
  SIGNALS_LATEST: 'cache_signals_latest',
  SIGNALS_HISTORY: 'cache_signals_history',
  GUARDIAN_STATUS: 'cache_guardian_status',
  USER_PREFERENCES: 'cache_user_preferences',
};

function saveToCache<T>(key: string, data: T): void {
  try {
    storage.set(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[Offline Cache] Failed to save cache for key ${key}:`, e);
  }
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = storage.getString(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error(`[Offline Cache] Failed to load cache for key ${key}:`, e);
    return null;
  }
}

/**
 * Core AQ Signal API Service implementation containing all specified endpoints.
 */
export const apiService = {
  // === AUTHENTICATION ENDPOINTS ===
  
  // POST /auth/login
  login: async (email: string, password: string): Promise<{ token: string; user: any }> => {
    return withRetry(async () => {
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Authentication failed. Please verify credentials.');
      }
    });
  },

  // POST /auth/register
  register: async (email: string, password: string, displayName: string): Promise<{ success: boolean; user: any }> => {
    return withRetry(async () => {
      try {
        const response = await apiClient.post('/auth/register', { email, password, displayName });
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration rejected by terminal security rules.');
      }
    });
  },

  // POST /auth/logout
  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      // Logout should fail gracefully
      console.warn('[API Service] POST /auth/logout failed or was unreachable.');
      return { success: true };
    }
  },

  // POST /auth/refresh
  refresh: async (token: string): Promise<{ token: string }> => {
    try {
      const response = await apiClient.post('/auth/refresh', { token });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to refresh operator auth session.');
    }
  },

  // === SIGNAL ENDPOINTS ===

  // GET /signal/latest
  getLatestSignals: async (): Promise<Signal[]> => {
    try {
      const data = await withRetry(async () => {
        const response = await apiClient.get<Signal[]>('/signal/latest');
        return response.data;
      });
      saveToCache(CACHE_KEYS.SIGNALS_LATEST, data);
      return data;
    } catch (error) {
      console.warn('[API Service] GET /signal/latest failed. Serving offline cache...');
      const cached = getFromCache<Signal[]>(CACHE_KEYS.SIGNALS_LATEST);
      if (cached) return cached;
      throw error;
    }
  },

  // GET /signal/history
  getSignalHistory: async (): Promise<Signal[]> => {
    try {
      const data = await withRetry(async () => {
        const response = await apiClient.get<Signal[]>('/signal/history');
        return response.data;
      });
      saveToCache(CACHE_KEYS.SIGNALS_HISTORY, data);
      return data;
    } catch (error) {
      console.warn('[API Service] GET /signal/history failed. Serving offline cache...');
      const cached = getFromCache<Signal[]>(CACHE_KEYS.SIGNALS_HISTORY);
      if (cached) return cached;
      throw error;
    }
  },

  // GET /signal/{id}
  getSignalById: async (id: string): Promise<Signal> => {
    try {
      return await withRetry(async () => {
        const response = await apiClient.get<Signal>(`/signal/${id}`);
        return response.data;
      });
    } catch (error) {
      console.warn(`[API Service] GET /signal/${id} failed. Checking local memory cache...`);
      const cachedLatest = getFromCache<Signal[]>(CACHE_KEYS.SIGNALS_LATEST) || [];
      const cachedHistory = getFromCache<Signal[]>(CACHE_KEYS.SIGNALS_HISTORY) || [];
      const found = [...cachedLatest, ...cachedHistory].find(s => s.id === id);
      if (found) return found;
      throw error;
    }
  },

  // === GUARDIAN ENDPOINTS ===

  // GET /guardian/status
  getGuardianStatus: async (): Promise<GuardianStatus> => {
    try {
      const data = await withRetry(async () => {
        const response = await apiClient.get<GuardianStatus>('/guardian/status');
        return response.data;
      });
      saveToCache(CACHE_KEYS.GUARDIAN_STATUS, data);
      return data;
    } catch (error) {
      console.warn('[API Service] GET /guardian/status failed. Serving offline cache...');
      const cached = getFromCache<GuardianStatus>(CACHE_KEYS.GUARDIAN_STATUS);
      if (cached) return cached;
      
      // Default fallback offline placeholder
      return {
        status: 'STANDBY',
        riskLevel: 'LOW',
        lastChecked: new Date().toISOString(),
        uptime24h: 99.98,
        activeRulesCount: 42,
        guardianAiSummary: 'Guardian system is operating in isolated offline cache mode. Active network signals are temporarily suspended.'
      };
    }
  },

  // === USER PREFERENCES ENDPOINTS ===

  // GET /user/preferences
  getUserPreferences: async (): Promise<UserPreferences> => {
    try {
      const data = await withRetry(async () => {
        const response = await apiClient.get<UserPreferences>('/user/preferences');
        return response.data;
      });
      saveToCache(CACHE_KEYS.USER_PREFERENCES, data);
      return data;
    } catch (error) {
      console.warn('[API Service] GET /user/preferences failed. Serving offline cache...');
      const cached = getFromCache<UserPreferences>(CACHE_KEYS.USER_PREFERENCES);
      if (cached) return cached;
      
      // Default preferences
      return {
        theme: 'dark',
        notificationsEnabled: true,
        minConfidence: 75,
        riskTolerance: 'MODERATE',
        selectedSymbols: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD']
      };
    }
  },

  // PUT /user/preferences
  updateUserPreferences: async (preferences: UserPreferences): Promise<UserPreferences> => {
    try {
      const data = await withRetry(async () => {
        const response = await apiClient.put<UserPreferences>('/user/preferences', preferences);
        return response.data;
      });
      saveToCache(CACHE_KEYS.USER_PREFERENCES, data);
      return data;
    } catch (error) {
      console.warn('[API Service] PUT /user/preferences failed. Updating local cache only...');
      saveToCache(CACHE_KEYS.USER_PREFERENCES, preferences);
      return preferences;
    }
  },

  // === NOTIFICATION DEVICE REGISTER ===

  // POST /notifications/register-device
  registerDevice: async (token: string, platform: string = 'expo'): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.post('/notifications/register-device', { token, platform });
      return response.data;
    } catch (error) {
      console.error('[API Service] POST /notifications/register-device failed:', error);
      throw error;
    }
  },
};

export default apiService;
