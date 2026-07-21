import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { auth } from '../firebase/config';

// Create a configured Axios instance
export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: APP_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: Inject the current Firebase Auth / Custom JWT token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[Axios Client] Failed to inject authorization token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handler & Refresh token interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Auto token refresh on 401 Unauthorized responses
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = auth.currentUser;
        if (user) {
          // Force refresh of the Firebase ID token / JWT
          const newToken = await user.getIdToken(true);
          useAuthStore.getState().setToken(newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.warn('[Axios Client] Token refresh failed. Auto-logging out user...');
        useAuthStore.getState().logout();
      }
    } else if (error.response?.status === 401) {
      console.warn('[Axios Client] Received persistent 401 Unauthorized. Auto-logging out user...');
      useAuthStore.getState().logout();
    }
    
    // Custom network error messages
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection and try again.'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
