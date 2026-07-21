import { MMKV } from 'react-native-mmkv';

// Initialize MMKV instance
export const storage = new MMKV({
  id: 'aq-signal-storage',
  encryptionKey: 'AQ_SECURE_KEY_1337' // In production, generate or retrieve a secure key from Keychain/Keystore
});

/**
 * AsyncStorage-like adapter for libraries that require standard async key-value interfaces
 * (e.g. Firebase Auth persistence, TanStack Query storage, etc.)
 */
export const mmkvAsyncAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const value = storage.getString(key);
    return value !== undefined ? value : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
  clear: async (): Promise<void> => {
    storage.clearAll();
  },
};

export default storage;
