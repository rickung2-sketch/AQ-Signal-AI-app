import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { mmkvAsyncAdapter } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(APP_CONFIG.FIREBASE_CONFIG) : getApp();

// Initialize Firebase Authentication with MMKV-based persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(mmkvAsyncAdapter),
  });
} catch (error) {
  // Fallback if already initialized
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { app, auth };
export default app;
