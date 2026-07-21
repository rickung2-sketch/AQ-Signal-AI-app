import Constants from 'expo-constants';

// We can define variables from appconfig extra, or fall back to development defaults.
const extra = Constants.expoConfig?.extra || {};

export const APP_CONFIG = {
  // Base API for AQ Trade AI Secure Integration
  API_BASE_URL: 
    process.env.EXPO_PUBLIC_API_BASE_URL || 
    process.env.API_BASE_URL || 
    (extra.apiBaseUrl as string) || 
    'https://aqtradeai.example.com/api',
  
  // Timeout for API requests in ms
  API_TIMEOUT: 15000,
  
  // Firebase configuration keys (Android / Mobile app clients)
  FIREBASE_CONFIG: {
    apiKey: (extra.firebaseApiKey as string) || 'AIzaSyA-EXAMPLE-KEY-FOR-APP',
    authDomain: (extra.firebaseAuthDomain as string) || 'aq-signal-ai.firebaseapp.com',
    projectId: (extra.firebaseProjectId as string) || 'aq-signal-ai',
    storageBucket: (extra.firebaseStorageBucket as string) || 'aq-signal-ai.appspot.com',
    messagingSenderId: (extra.firebaseMessagingSenderId as string) || '1234567890',
    appId: (extra.firebaseAppId as string) || '1:1234567890:web:abcdef123456',
    measurementId: (extra.firebaseMeasurementId as string) || 'G-ABCDEF1234'
  },
  
  // Push Notification channel
  NOTIFICATION_CHANNEL_ID: 'aq-signal-alerts',
  NOTIFICATION_CHANNEL_NAME: 'AQ AI Signal Alerts',
};

export default APP_CONFIG;
