import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { storage } from '../utils/storage';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  loginSuccess: (user: User, token: string) => void;
  logout: () => void;
}

// Custom storage provider for Zustand persist middleware using MMKV
const mmkvZustandStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      loginSuccess: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'aq-signal-auth',
      storage: createJSONStorage(() => mmkvZustandStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
