import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, GuardianStatus, UserPreferences, AssetAnalysis } from '../../services/apiService';
import { useSignalStore, Signal } from '../../store/signalStore';

/**
 * React Query & API Orchestration for AQ SIGNAL AI
 */
export const signalsApi = {
  // Fetch active signals
  getSignals: async (): Promise<Signal[]> => {
    return await apiService.getLatestSignals();
  },

  // Fetch signal history
  getSignalHistory: async (): Promise<Signal[]> => {
    return await apiService.getSignalHistory();
  },

  // Fetch detail for a specific signal
  getSignalById: async (id: string): Promise<Signal> => {
    return await apiService.getSignalById(id);
  },

  // Register push token with backend
  registerPushToken: async (token: string): Promise<{ success: boolean }> => {
    return await apiService.registerDevice(token);
  }
};

/**
 * TanStack Query custom hooks
 */

// Fetches the latest active signals
export function useFetchSignals() {
  const setSignals = useSignalStore((state) => state.setSignals);
  const setError = useSignalStore((state) => state.setError);

  return useQuery<Signal[], Error>({
    queryKey: ['signals'],
    queryFn: signalsApi.getSignals,
    staleTime: 30000, // 30 seconds fresh state (Smart Refresh: 30-second background refresh)
    gcTime: 5 * 60 * 1000, // 5 minutes cache lifetime
    refetchInterval: 30000, // 30-second background poll for smart live refresh
    
    // Connect React Query lifecycle to Zustand synchronized local storage
    meta: {
      onSuccess: (data: Signal[]) => {
        setSignals(data);
        setError(null);
      },
      onError: (err: Error) => {
        setError(err.message || 'Failed to sync latest trading signals.');
      }
    }
  });
}

// Fetches the closed signal history
export function useFetchSignalHistory() {
  return useQuery<Signal[], Error>({
    queryKey: ['signals-history'],
    queryFn: signalsApi.getSignalHistory,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

// Fetches details of a specific signal
export function useFetchSignalDetails(id: string | null) {
  return useQuery<Signal, Error>({
    queryKey: ['signal', id],
    queryFn: () => signalsApi.getSignalById(id!),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// Fetches the AQ Guardian Shield Status
export function useFetchGuardianStatus() {
  return useQuery<GuardianStatus, Error>({
    queryKey: ['guardian-status'],
    queryFn: apiService.getGuardianStatus,
    staleTime: 30000,
    refetchInterval: 30000, // Poll every 30s to keep risk bulletins active
  });
}

// Fetches user preferences
export function useFetchUserPreferences() {
  return useQuery<UserPreferences, Error>({
    queryKey: ['user-preferences'],
    queryFn: apiService.getUserPreferences,
    staleTime: 120000, // 2 minutes
  });
}

// Fetches technical analysis details for a symbol
export function useFetchAnalysis(symbol: string) {
  return useQuery<AssetAnalysis, Error>({
    queryKey: ['analysis', symbol],
    queryFn: () => apiService.getAnalysisBySymbol(symbol),
    staleTime: 60000, // 1 minute
  });
}

// Updates user preferences
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation<UserPreferences, Error, UserPreferences>({
    mutationFn: apiService.updateUserPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data);
    },
  });
}

// Registers device token with backend
export function useRegisterToken() {
  return useMutation({
    mutationFn: signalsApi.registerPushToken,
    onSuccess: () => {
      console.log('[API] Device push token synchronized with trade intelligence backend.');
    },
    onError: (error) => {
      console.error('[API] Failed to register push token with backend:', error);
    }
  });
}
